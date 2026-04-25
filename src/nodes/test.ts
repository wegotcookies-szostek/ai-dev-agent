import type {AgentStateType} from "../state";
import {createExecutor} from "../executors/factory";

function looksFailed(output: string): boolean {
    return (
        /fail|failed|error|exception|cannot|not found|timeout/i.test(output) &&
        !/all tests passed|successfully|0 failed/i.test(output)
    );
}

export async function testNode(state: AgentStateType) {
    const prompt = `
Run the relevant project checks for this task.

You must:
1. inspect package.json/composer.json/test config
2. run relevant unit tests
3. run relevant integration/e2e tests if available
4. run typecheck/lint if relevant
5. summarize exact commands and results

If tests fail, include:
- failing command
- error
- suspected cause
- next fix direction
`;

    const executor = createExecutor();
    const result = await executor.run({
        prompt,
        cwd: state.repoPath,
    });

    return {
        testOutput: result.combinedOutput,
        status: looksFailed(result.combinedOutput) ? "fixing" as const : "browser" as const,
    };
}