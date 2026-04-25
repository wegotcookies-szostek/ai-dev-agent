import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
    task: Annotation<string>(),
    repoPath: Annotation<string>(),

    plan: Annotation<string | undefined>(),
    implementationOutput: Annotation<string | undefined>(),
    testOutput: Annotation<string | undefined>(),
    browserOutput: Annotation<string | undefined>(),

    attempts: Annotation<number>({
        reducer: (_, update) => update,
        default: () => 0,
    }),

    status: Annotation<
        "planning" | "coding" | "testing" | "browser" | "fixing" | "done" | "blocked"
    >(),
});

export type AgentStateType = typeof AgentState.State;