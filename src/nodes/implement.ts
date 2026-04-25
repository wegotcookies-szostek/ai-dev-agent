import { loadConfig } from "../config.js";
import { createModel } from "../models/factory.js";
import {
    buildImplementationPrompt,
    IMPLEMENTATION_SYSTEM_PROMPT,
} from "../prompts/implement.js";
import { implementationResultSpec } from "../schemas/results.js";
import type { AgentStateType } from "../state.js";
import { createImplementationTools } from "../tools/repo-tools.js";
import { renderPlan } from "../utils/render.js";

export async function implementNode(state: AgentStateType) {
    const config = loadConfig({
        provider: state.provider,
        model: state.model,
        openAiBaseUrl: state.openAiBaseUrl,
    });
    const model = createModel(config);
    const result = await model.runToolAgent({
        systemPrompt: IMPLEMENTATION_SYSTEM_PROMPT,
        userPrompt: buildImplementationPrompt({
            task: state.task,
            plan: renderPlan(state.plan),
            priorSummary: undefined,
            verificationSummary: undefined,
            issues: undefined,
        }),
        tools: createImplementationTools(),
        result: implementationResultSpec,
        context: {
            repoPath: state.repoPath,
            commandTimeoutMs: config.commandTimeoutMs,
        },
        maxSteps: config.agentMaxSteps,
    });

    return {
        implementation: result,
        status: result.status === "blocked" ? "blocked" as const : "verifying" as const,
    };
}
