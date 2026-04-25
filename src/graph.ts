import { END, START, StateGraph } from "@langchain/langgraph";
import { AgentState, type AgentStateType } from "./state";

import { planNode } from "./nodes/plan";
import { codeNode } from "./nodes/code";
import { testNode } from "./nodes/test";
import { browserNode } from "./nodes/browser";
import { fixNode } from "./nodes/fix";

function routeAfterTest(state: AgentStateType) {
    return state.status === "fixing" ? "fix" : "browser";
}

function routeAfterBrowser(state: AgentStateType) {
    if (state.status === "fixing") return "fix";
    if (state.status === "done") return END;
    return "fix";
}

function routeAfterFix(state: AgentStateType) {
    if (state.status === "blocked") return END;
    return "test";
}

export const graph = new StateGraph(AgentState)
    .addNode("plan", planNode)
    .addNode("code", codeNode)
    .addNode("test", testNode)
    .addNode("browser", browserNode)
    .addNode("fix", fixNode)
    .addEdge(START, "plan")
    .addEdge("plan", "code")
    .addEdge("code", "test")
    .addConditionalEdges("test", routeAfterTest)
    .addConditionalEdges("browser", routeAfterBrowser)
    .addConditionalEdges("fix", routeAfterFix)
    .compile();