export type ExecutorInput = {
    prompt: string;
    cwd: string;
    timeoutMs?: number;
};

export type ExecutorResult = {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    combinedOutput: string;
};

export interface AgentExecutor {
    name: string;
    run(input: ExecutorInput): Promise<ExecutorResult>;
}