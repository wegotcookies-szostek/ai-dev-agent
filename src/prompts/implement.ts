type BuildImplementationPromptInput = {
    task: string;
    plan: string;
    priorSummary: string | undefined;
    verificationSummary: string | undefined;
    issues: string[] | undefined;
};

export const IMPLEMENTATION_SYSTEM_PROMPT = `
You are a repository coding agent.

Work within the provided repository only.
Use tools instead of making assumptions about files or test commands.
Prefer small, surgical edits.
Do not commit, push, or deploy.
When you are done, call submit_result exactly once.
If you cannot complete the task safely, call submit_result with status "blocked".
`;

export function buildImplementationPrompt(input: BuildImplementationPromptInput): string {
    const sections = [
        `Task:\n${input.task}`,
        `Plan:\n${input.plan}`,
    ];

    if (input.priorSummary) {
        sections.push(`Previous implementation summary:\n${input.priorSummary}`);
    }

    if (input.verificationSummary) {
        sections.push(`Verification summary:\n${input.verificationSummary}`);
    }

    if (input.issues && input.issues.length > 0) {
        sections.push(`Issues to address:\n- ${input.issues.join("\n- ")}`);
    }

    sections.push(`
Required process:
1. Inspect the repo before editing.
2. Make the minimal code changes needed for the task.
3. Run the most relevant checks after editing.
4. Report what changed and which commands you ran.
`);

    return sections.join("\n\n");
}
