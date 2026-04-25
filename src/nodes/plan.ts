import { loadConfig } from "../config.js";
import { createModel } from "../models/factory.js";
import { PLAN_SYSTEM_PROMPT, buildPlanPrompt } from "../prompts/plan.js";
import { planResultSpec } from "../schemas/results.js";
import type { AgentStateType } from "../state.js";

export async function planNode(state: AgentStateType) {
    const config = loadConfig({
        provider: state.provider,
        model: state.model,
        openAiBaseUrl: state.openAiBaseUrl,
    });
    const model = createModel(config);
    const plan = await model.runToolAgent({
        systemPrompt: PLAN_SYSTEM_PROMPT,
        userPrompt: buildPlanPrompt(state.task),
        tools: [],
        result: planResultSpec,
        context: {
            repoPath: state.repoPath,
            commandTimeoutMs: config.commandTimeoutMs,
        },
        maxSteps: 4,
    });

    return {
        plan,
        status: "implementing" as const,
    };
}
