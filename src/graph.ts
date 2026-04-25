import { END, START, StateGraph } from "@langchain/langgraph";
import { AgentState, type AgentStateType } from "./state.js";
import { fixNode } from "./nodes/fix.js";
import { implementNode } from "./nodes/implement.js";
import { planNode } from "./nodes/plan.js";
import { verifyNode } from "./nodes/verify.js";

function routeAfterImplementation(state: AgentStateType) {
    if (state.status === "blocked") return END;
    return "verify";
}

function routeAfterVerification(state: AgentStateType) {
    if (state.status === "done") return END;
    if (state.status === "blocked") return END;
    return "fix";
}

function routeAfterFix(state: AgentStateType) {
    if (state.status === "blocked") return END;
    return "verify";
}

export const graph = new StateGraph(AgentState)
    .addNode("plan", planNode)
    .addNode("implement", implementNode)
    .addNode("verify", verifyNode)
    .addNode("fix", fixNode)
    .addEdge(START, "plan")
    .addEdge("plan", "implement")
    .addConditionalEdges("implement", routeAfterImplementation)
    .addConditionalEdges("verify", routeAfterVerification)
    .addConditionalEdges("fix", routeAfterFix)
    .compile();
