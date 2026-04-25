import type {AgentStateType} from "../state";
import {createExecutor} from "../executors/factory";

function looksFailed(output: string): boolean {
    return (
        /bug|fail|failed|error|broken|incorrect|repro/i.test(output) &&
        !/pass|passed|no issues|works as expected/i.test(output)
    );
}

export async function browserNode(state: AgentStateType) {
    const prompt = `
Manually verify the UI/browser behavior for this task.

Task:
${state.task}

Use available browser/devtools/MCP tools if configured.

Check:
- happy path
- validation errors
- edge cases from the task
- console errors
- failed network requests
- incorrect UI states

Return:
1. scenarios tested
2. repro steps for any bug
3. console/network findings
4. pass/fail result
`;

    const executor = createExecutor();
    const result = await executor.run({
        prompt,
        cwd: state.repoPath,
    });

    return {
        browserOutput: result.combinedOutput,
        status: looksFailed(result.combinedOutput) ? "fixing" as const : "done" as const,
    };
}