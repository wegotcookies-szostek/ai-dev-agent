import type { AppConfig } from "../config.js";
import { OpenAIModelClient } from "./openai-model.js";
import type { AgentModel } from "./types.js";

export function createModel(config: AppConfig): AgentModel {
    if (config.provider === "openai") {
        return new OpenAIModelClient(config);
    }

    throw new Error(`Unsupported model provider: ${String(config.provider)}`);
}
