import "dotenv/config";
import { parseArgs } from "./cli/args.js";
import { graph } from "./graph.js";

const args = parseArgs(process.argv.slice(2));

const result = await graph.invoke({
    task: args.task,
    repoPath: args.repoPath,
    provider: args.provider,
    model: args.model,
    openAiBaseUrl: args.openAiBaseUrl,
    attempts: 0,
    status: "planning",
});

console.log(JSON.stringify(result, null, 2));
