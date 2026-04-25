import { loadConfig } from "../config.js";
import { createModel } from "../models/factory.js";
import { buildVerifyPrompt, VERIFY_SYSTEM_PROMPT } from "../prompts/verify.js";
import { verificationResultSpec } from "../schemas/results.js";
import type { AgentStateType } from "../state.js";
import { createVerificationTools } from "../tools/repo-tools.js";

export async function verifyNode(state: AgentStateType) {
    const config = loadConfig({
        provider: state.provider,
        model: state.model,
        openAiBaseUrl: state.openAiBaseUrl,
    });
    const model = createModel(config);
    const result = await model.runToolAgent({
        systemPrompt: VERIFY_SYSTEM_PROMPT,
        userPrompt: buildVerifyPrompt({
            task: state.task,
            implementationSummary: state.implementation?.summary,
            changedFiles: state.implementation?.changedFiles ?? [],
            commandsRun: state.implementation?.commandsRun ?? [],
        }),
        tools: createVerificationTools(),
        result: verificationResultSpec,
        context: {
            repoPath: state.repoPath,
            commandTimeoutMs: config.commandTimeoutMs,
        },
        maxSteps: config.agentMaxSteps,
    });

    return {
        verification: result,
        status:
            result.status === "passed"
                ? ("done" as const)
                : result.status === "blocked"
                  ? ("blocked" as const)
                  : ("fixing" as const),
    };
}
