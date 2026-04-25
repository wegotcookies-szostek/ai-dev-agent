import fs from "node:fs";
import path from "node:path";
import type { ModelProviderName } from "../config.js";

export type ParsedArgs = {
    repoPath: string;
    task: string;
    provider: ModelProviderName | undefined;
    model: string | undefined;
    openAiBaseUrl: string | undefined;
};

function readFlag(argv: string[], flag: string): string | undefined {
    const index = argv.indexOf(flag);
    if (index === -1) return undefined;
    return argv[index + 1];
}

export function parseArgs(argv: string[]): ParsedArgs {
    const repoValue = readFlag(argv, "--repo");

    if (!repoValue) {
        throw new Error(
            'Usage: npm run agent -- --repo "/path/to/project" [--provider openai] [--model gpt-4.1] "task description"'
        );
    }

    const repoPath = path.resolve(repoValue);
    const providerValue = readFlag(argv, "--provider");
    const model = readFlag(argv, "--model");
    const openAiBaseUrl = readFlag(argv, "--openai-base-url");

    const consumedFlags = new Set<number>();
    for (const flag of ["--repo", "--provider", "--model", "--openai-base-url"]) {
        const index = argv.indexOf(flag);
        if (index !== -1) {
            consumedFlags.add(index);
            consumedFlags.add(index + 1);
        }
    }

    const task = argv
        .filter((_, index) => !consumedFlags.has(index))
        .join(" ")
        .trim();

    if (!task) {
        throw new Error("Missing task description.");
    }

    if (!fs.existsSync(repoPath)) {
        throw new Error(`Repo path does not exist: ${repoPath}`);
    }

    if (!fs.statSync(repoPath).isDirectory()) {
        throw new Error(`Repo path is not a directory: ${repoPath}`);
    }

    if (!fs.existsSync(path.join(repoPath, ".git"))) {
        console.warn(`Warning: ${repoPath} does not look like a git repository.`);
    }

    if (providerValue && providerValue !== "openai") {
        throw new Error(`Unsupported provider: ${providerValue}`);
    }

    return {
        repoPath,
        task,
        provider: providerValue as ModelProviderName | undefined,
        model,
        openAiBaseUrl,
    };
}
