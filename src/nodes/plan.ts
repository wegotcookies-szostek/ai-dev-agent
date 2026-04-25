import { AgentStateType } from "../state";
import {createExecutor} from "../executors/factory";

export async function planNode(state: AgentStateType) {
    const prompt = `
You are working in an existing PHP/JavaScript/TypeScript project.

Task:
${state.task}

Do not modify files yet.

Create:
1. implementation plan
2. files likely involved
3. unit/integration/e2e test plan
4. manual browser test scenarios
5. ambiguity/blocker list

Return concise markdown.
`;

    const executor = createExecutor();
    const result = await executor.run({
        prompt,
        cwd: state.repoPath,
    });

    return {
        plan: result.combinedOutput,
        status: "coding" as const,
    };
}