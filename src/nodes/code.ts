import { AgentStateType } from "../state";
import {createExecutor} from "../executors/factory";

export async function codeNode(state: AgentStateType) {
    const prompt = `
Implement this task.

Task:
${state.task}

Plan:
${state.plan}

Rules:
- Follow existing project patterns.
- Make minimal scoped changes.
- Add or update tests.
- Do not push, deploy, or commit.
- Do not claim success unless tests are actually runnable.
`;

    const executor = createExecutor();
    const result = await executor.run({
        prompt,
        cwd: state.repoPath,
    });

    return {
        implementationOutput: result.combinedOutput,
        status: "testing" as const,
    };
}