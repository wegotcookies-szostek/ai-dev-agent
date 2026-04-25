import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AgentExecutor, ExecutorInput, ExecutorResult } from "./executor";

const execFileAsync = promisify(execFile);

export class CodexExecutor implements AgentExecutor {
    name = "codex";

    async run(input: ExecutorInput): Promise<ExecutorResult> {
        try {
            const { stdout, stderr } = await execFileAsync(
                "codex",
                ["exec", input.prompt],
                {
                    cwd: input.cwd,
                    timeout: input.timeoutMs ?? 1000 * 60 * 20,
                    maxBuffer: 1024 * 1024 * 20,
                }
            );

            return {
                stdout,
                stderr,
                exitCode: 0,
                combinedOutput: [stdout, stderr].filter(Boolean).join("\n"),
            };
        } catch (error: any) {
            return {
                stdout: error.stdout ?? "",
                stderr: error.stderr ?? error.message ?? "",
                exitCode: error.code ?? null,
                combinedOutput: [error.stdout, error.stderr, error.message]
                    .filter(Boolean)
                    .join("\n"),
            };
        }
    }
}