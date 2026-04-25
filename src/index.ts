import "dotenv/config";
import { graph } from "./graph";
import { parseArgs } from "./cli/args";

const { repoPath, task } = parseArgs(process.argv.slice(2));

const result = await graph.invoke({
    task,
    repoPath,
    attempts: 0,
    status: "planning",
});

console.log(JSON.stringify(result, null, 2));