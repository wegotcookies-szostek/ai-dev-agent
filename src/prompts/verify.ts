type BuildVerifyPromptInput = {
    task: string;
    implementationSummary: string | undefined;
    changedFiles: string[];
    commandsRun: string[];
};

export const VERIFY_SYSTEM_PROMPT = `
You are verifying a repository change.

Use tools to inspect the changed files and run the relevant checks.
Do not edit files in this phase.
When verification is complete, call submit_result exactly once.
If verification cannot be completed, use status "blocked".
`;

export function buildVerifyPrompt(input: BuildVerifyPromptInput): string {
    return `
Task:
${input.task}

Implementation summary:
${input.implementationSummary ?? "No summary recorded."}

Changed files:
${input.changedFiles.length > 0 ? input.changedFiles.join("\n") : "Unknown"}

Commands already run:
${input.commandsRun.length > 0 ? input.commandsRun.join("\n") : "None recorded"}

Required process:
1. Confirm which project checks are relevant.
2. Run the relevant commands.
3. Inspect any failures.
4. Return a structured verification result.
`;
}
