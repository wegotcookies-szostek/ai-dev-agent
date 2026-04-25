import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AgentExecutor, ExecutorInput, ExecutorResult } from "./executor";

const execFileAsync = promisify(execFile);

export class ShellExecutor implements AgentExecutor {
    name: string;

    constructor(
        name: string,
        private command: string,
        private argsTemplate: string[]
    ) {
        this.name = name;
    }

    async run(input: ExecutorInput): Promise<ExecutorResult> {
        const args = this.argsTemplate.map((arg) =>
            arg.replace("{{prompt}}", input.prompt)
        );

        try {
            const { stdout, stderr } = await execFileAsync(this.command, args, {
                cwd: input.cwd,
                timeout: input.timeoutMs ?? 1000 * 60 * 20,
                maxBuffer: 1024 * 1024 * 20,
            });

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