import fs from "node:fs";
import path from "node:path";

export type ParsedArgs = {
    repoPath: string;
    task: string;
};

export function parseArgs(argv: string[]): ParsedArgs {
    const repoIndex = argv.indexOf("--repo");

    if (repoIndex === -1 || !argv[repoIndex + 1]) {
        throw new Error(
            'Usage: npm run agent -- --repo "/path/to/project" "task description"'
        );
    }

    const rawRepoPath = argv[repoIndex + 1] as string;
    const repoPath = path.resolve(rawRepoPath);

    const task = argv
        .filter((_, index) => index !== repoIndex && index !== repoIndex + 1)
        .join(" ")
        .trim();

    if (!task) {
        throw new Error("Missing task description.");
    }

    if (!fs.existsSync(repoPath)) {
        throw new Error(`Repo path does not exist: ${repoPath}`);
    }

    if (!fs.statSync(repoPath).isDirectory()) {
        throw new Error(`Repo path is not a directory: ${repoPath}`);
    }

    if (!fs.existsSync(path.join(repoPath, ".git"))) {
        console.warn(`Warning: ${repoPath} does not look like a git repository.`);
    }

    return {
        repoPath,
        task,
    };
}