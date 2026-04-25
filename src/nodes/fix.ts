import { AgentStateType } from "../state";
import {createExecutor} from "../executors/factory";

const MAX_ATTEMPTS = 5;

export async function fixNode(state: AgentStateType) {
    const attempts = state.attempts + 1;

    if (attempts > MAX_ATTEMPTS) {
        return {
            attempts,
            status: "blocked" as const,
        };
    }

    const prompt = `
Fix the implementation.

Task:
${state.task}

Previous plan:
${state.plan}

Code output:
${state.implementationOutput}

Test output:
${state.testOutput}

Browser output:
${state.browserOutput}

Rules:
- Fix the root cause, not only the symptom.
- Add regression tests where possible.
- Re-run relevant checks after changes.
- Do not push, deploy, or commit.
`;

    const executor = createExecutor();
    const result = await executor.run({
        prompt,
        cwd: state.repoPath,
    });

    return {
        codexOutput: result.combinedOutput,
        attempts,
        status: "testing" as const,
    };
}