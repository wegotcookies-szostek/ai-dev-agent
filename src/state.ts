import { Annotation } from "@langchain/langgraph";
import type { ModelProviderName } from "./config.js";
import type {
    ImplementationResult,
    PlanResult,
    VerificationResult,
} from "./schemas/results.js";

export const AgentState = Annotation.Root({
    task: Annotation<string>(),
    repoPath: Annotation<string>(),
    provider: Annotation<ModelProviderName | undefined>(),
    model: Annotation<string | undefined>(),
    openAiBaseUrl: Annotation<string | undefined>(),

    plan: Annotation<PlanResult | undefined>(),
    implementation: Annotation<ImplementationResult | undefined>(),
    verification: Annotation<VerificationResult | undefined>(),

    attempts: Annotation<number>({
        reducer: (_, update) => update,
        default: () => 0,
    }),

    status: Annotation<
        "planning" | "implementing" | "verifying" | "fixing" | "done" | "blocked"
    >(),
});

export type AgentStateType = typeof AgentState.State;
