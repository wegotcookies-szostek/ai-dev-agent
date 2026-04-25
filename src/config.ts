export type ModelProviderName = "openai";

export type AppConfig = {
    provider: ModelProviderName;
    model: string;
    openAiBaseUrl: string | undefined;
    agentMaxSteps: number;
    commandTimeoutMs: number;
    maxFixAttempts: number;
};

type ConfigOverrides = {
    provider: ModelProviderName | undefined;
    model: string | undefined;
    openAiBaseUrl: string | undefined;
};

function readNumber(value: string | undefined, fallback: number): number {
    if (!value) return fallback;

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        throw new Error(`Expected a positive integer but received "${value}".`);
    }

    return parsed;
}

export function loadConfig(overrides: Partial<ConfigOverrides> = {}): AppConfig {
    return {
        provider: overrides.provider ?? "openai",
        model: overrides.model ?? process.env.OPENAI_MODEL ?? "gpt-4.1",
        openAiBaseUrl: overrides.openAiBaseUrl ?? process.env.OPENAI_BASE_URL,
        agentMaxSteps: readNumber(process.env.AGENT_MAX_STEPS, 24),
        commandTimeoutMs: readNumber(process.env.AGENT_COMMAND_TIMEOUT_MS, 120_000),
        maxFixAttempts: readNumber(process.env.AGENT_MAX_FIX_ATTEMPTS, 3),
    };
}
