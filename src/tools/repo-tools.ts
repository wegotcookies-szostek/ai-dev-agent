import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import type { AgentTool, ToolContext } from "../models/types.js";

const execFileAsync = promisify(execFile);

const listFilesArgsSchema = z.object({
    glob: z.string().optional(),
});

const searchFilesArgsSchema = z.object({
    pattern: z.string().min(1),
    maxResults: z.number().int().positive().max(200).optional(),
});

const readFileArgsSchema = z.object({
    path: z.string().min(1),
    startLine: z.number().int().positive().optional(),
    endLine: z.number().int().positive().optional(),
});

const writeFileArgsSchema = z.object({
    path: z.string().min(1),
    content: z.string(),
});

const replaceInFileArgsSchema = z.object({
    path: z.string().min(1),
    oldText: z.string(),
    newText: z.string(),
    expectedOccurrences: z.number().int().positive().optional(),
});

const runCommandArgsSchema = z.object({
    command: z.string().min(1),
    timeoutMs: z.number().int().positive().max(600_000).optional(),
});

function resolveRepoPath(repoPath: string, targetPath: string): string {
    const resolved = path.resolve(repoPath, targetPath);
    const relative = path.relative(repoPath, resolved);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error(`Path escapes repository root: ${targetPath}`);
    }

    return resolved;
}

function truncate(text: string, maxLength = 16_000): string {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}\n...[truncated]`;
}

async function runRg(args: string[], context: ToolContext) {
    try {
        const { stdout } = await execFileAsync("rg", args, {
            cwd: context.repoPath,
            timeout: context.commandTimeoutMs,
            maxBuffer: 1024 * 1024 * 10,
        });

        return stdout;
    } catch (error: any) {
        if (error.code === 1) {
            return "";
        }
        throw error;
    }
}

function json(value: unknown): string {
    return JSON.stringify(value, null, 2);
}

const listFilesTool: AgentTool = {
    name: "list_files",
    description: "List repository files. Use this before reading or editing when you need file discovery.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            glob: { type: "string" },
        },
        required: [],
    },
    async execute(args, context) {
        const parsed = listFilesArgsSchema.parse(args);
        const rgArgs = parsed.glob
            ? ["--files", "-g", parsed.glob, "."]
            : ["--files", "."];
        const stdout = await runRg(rgArgs, context);
        const files = stdout.split("\n").filter(Boolean).slice(0, 500);
        return json({ files });
    },
};

const searchFilesTool: AgentTool = {
    name: "search_files",
    description: "Search repository contents with ripgrep and return matching lines.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            pattern: { type: "string" },
            maxResults: { type: "number" },
        },
        required: ["pattern"],
    },
    async execute(args, context) {
        const parsed = searchFilesArgsSchema.parse(args);
        const stdout = await runRg(
            ["-n", "--hidden", "--glob", "!node_modules", parsed.pattern, "."],
            context
        );
        const matches = stdout
            .split("\n")
            .filter(Boolean)
            .slice(0, parsed.maxResults ?? 50);
        return json({ matches });
    },
};

const readFileTool: AgentTool = {
    name: "read_file",
    description: "Read a file from the repository. Supports optional line ranges.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            path: { type: "string" },
            startLine: { type: "number" },
            endLine: { type: "number" },
        },
        required: ["path"],
    },
    async execute(args, context) {
        const parsed = readFileArgsSchema.parse(args);
        const filePath = resolveRepoPath(context.repoPath, parsed.path);
        const content = await fs.readFile(filePath, "utf8");

        if (!parsed.startLine && !parsed.endLine) {
            return json({
                path: parsed.path,
                content: truncate(content),
            });
        }

        const lines = content.split("\n");
        const start = (parsed.startLine ?? 1) - 1;
        const end = parsed.endLine ?? lines.length;
        const excerpt = lines.slice(start, end).join("\n");

        return json({
            path: parsed.path,
            startLine: start + 1,
            endLine: end,
            content: truncate(excerpt),
        });
    },
};

const writeFileTool: AgentTool = {
    name: "write_file",
    description: "Create or replace a repository file with the provided content.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            path: { type: "string" },
            content: { type: "string" },
        },
        required: ["path", "content"],
    },
    async execute(args, context) {
        const parsed = writeFileArgsSchema.parse(args);
        const filePath = resolveRepoPath(context.repoPath, parsed.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, parsed.content, "utf8");
        return json({ path: parsed.path, written: true });
    },
};

const replaceInFileTool: AgentTool = {
    name: "replace_in_file",
    description:
        "Replace exact text in a file. Use this for surgical edits instead of rewriting whole files.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            path: { type: "string" },
            oldText: { type: "string" },
            newText: { type: "string" },
            expectedOccurrences: { type: "number" },
        },
        required: ["path", "oldText", "newText"],
    },
    async execute(args, context) {
        const parsed = replaceInFileArgsSchema.parse(args);
        const filePath = resolveRepoPath(context.repoPath, parsed.path);
        const content = await fs.readFile(filePath, "utf8");
        const occurrences = content.split(parsed.oldText).length - 1;

        if (occurrences === 0) {
            throw new Error(`Text to replace was not found in ${parsed.path}`);
        }

        if (
            parsed.expectedOccurrences !== undefined &&
            occurrences !== parsed.expectedOccurrences
        ) {
            throw new Error(
                `Expected ${parsed.expectedOccurrences} occurrences in ${parsed.path} but found ${occurrences}`
            );
        }

        const updated = content.replaceAll(parsed.oldText, parsed.newText);
        await fs.writeFile(filePath, updated, "utf8");

        return json({
            path: parsed.path,
            replacements: occurrences,
        });
    },
};

const runCommandTool: AgentTool = {
    name: "run_command",
    description:
        "Run a shell command inside the repository and return exit code, stdout, and stderr.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            command: { type: "string" },
            timeoutMs: { type: "number" },
        },
        required: ["command"],
    },
    async execute(args, context) {
        const parsed = runCommandArgsSchema.parse(args);
        try {
            const { stdout, stderr } = await execFileAsync(
                "bash",
                ["-lc", parsed.command],
                {
                    cwd: context.repoPath,
                    timeout: parsed.timeoutMs ?? context.commandTimeoutMs,
                    maxBuffer: 1024 * 1024 * 20,
                }
            );

            return json({
                command: parsed.command,
                exitCode: 0,
                stdout: truncate(stdout),
                stderr: truncate(stderr),
            });
        } catch (error: any) {
            return json({
                command: parsed.command,
                exitCode: error.code ?? null,
                stdout: truncate(error.stdout ?? ""),
                stderr: truncate(error.stderr ?? error.message ?? ""),
            });
        }
    },
};

export function createImplementationTools(): AgentTool[] {
    return [
        listFilesTool,
        searchFilesTool,
        readFileTool,
        writeFileTool,
        replaceInFileTool,
        runCommandTool,
    ];
}

export function createVerificationTools(): AgentTool[] {
    return [listFilesTool, searchFilesTool, readFileTool, runCommandTool];
}
