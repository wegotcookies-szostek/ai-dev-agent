import type { PlanResult } from "../schemas/results.js";

export function renderPlan(plan: PlanResult | undefined): string {
    if (!plan) {
        return "No plan recorded.";
    }

    const lines = [`Summary: ${plan.summary}`];

    if (plan.relevantFiles.length > 0) {
        lines.push(`Relevant files:\n- ${plan.relevantFiles.join("\n- ")}`);
    }

    if (plan.implementationSteps.length > 0) {
        lines.push(`Implementation steps:\n- ${plan.implementationSteps.join("\n- ")}`);
    }

    if (plan.verificationSteps.length > 0) {
        lines.push(`Verification steps:\n- ${plan.verificationSteps.join("\n- ")}`);
    }

    if (plan.risks.length > 0) {
        lines.push(`Risks:\n- ${plan.risks.join("\n- ")}`);
    }

    return lines.join("\n\n");
}
