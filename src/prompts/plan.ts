export const PLAN_SYSTEM_PROMPT = `
You are planning a coding task in an existing repository.

Do not modify files.
Think concretely about the likely files, implementation steps, and verification steps.
Return the result via submit_result only.
`;

export function buildPlanPrompt(task: string): string {
    return `
Create a concise implementation plan for this task:

${task}

Include:
- summary
- likely files to inspect
- implementation steps
- verification steps
- risks or ambiguities
`;
}
