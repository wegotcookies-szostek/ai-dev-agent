import { z } from "zod";
import type { ToolAgentResult } from "../models/types.js";

export const planResultSchema = z.object({
    summary: z.string().min(1),
    relevantFiles: z.array(z.string()).default([]),
    implementationSteps: z.array(z.string()).default([]),
    verificationSteps: z.array(z.string()).default([]),
    risks: z.array(z.string()).default([]),
});

export type PlanResult = z.infer<typeof planResultSchema>;

export const implementationResultSchema = z.object({
    status: z.enum(["implemented", "blocked"]),
    summary: z.string().min(1),
    changedFiles: z.array(z.string()).default([]),
    commandsRun: z.array(z.string()).default([]),
    followUps: z.array(z.string()).default([]),
});

export type ImplementationResult = z.infer<typeof implementationResultSchema>;

export const verificationResultSchema = z.object({
    status: z.enum(["passed", "failed", "blocked"]),
    summary: z.string().min(1),
    commandsRun: z.array(z.string()).default([]),
    issues: z.array(z.string()).default([]),
});

export type VerificationResult = z.infer<typeof verificationResultSchema>;

const stringArraySchema = {
    type: "array",
    items: { type: "string" },
} as const;

export const planResultSpec: ToolAgentResult<PlanResult> = {
    description: "Submit the implementation plan.",
    schema: {
        type: "object",
        additionalProperties: false,
        properties: {
            summary: { type: "string" },
            relevantFiles: stringArraySchema,
            implementationSteps: stringArraySchema,
            verificationSteps: stringArraySchema,
            risks: stringArraySchema,
        },
        required: [
            "summary",
            "relevantFiles",
            "implementationSteps",
            "verificationSteps",
            "risks",
        ],
    },
    validate(value) {
        return planResultSchema.parse(value);
    },
};

export const implementationResultSpec: ToolAgentResult<ImplementationResult> = {
    description: "Submit the implementation result after code changes and checks are complete.",
    schema: {
        type: "object",
        additionalProperties: false,
        properties: {
            status: {
                type: "string",
                enum: ["implemented", "blocked"],
            },
            summary: { type: "string" },
            changedFiles: stringArraySchema,
            commandsRun: stringArraySchema,
            followUps: stringArraySchema,
        },
        required: ["status", "summary", "changedFiles", "commandsRun", "followUps"],
    },
    validate(value) {
        return implementationResultSchema.parse(value);
    },
};

export const verificationResultSpec: ToolAgentResult<VerificationResult> = {
    description: "Submit the verification result after running the relevant checks.",
    schema: {
        type: "object",
        additionalProperties: false,
        properties: {
            status: {
                type: "string",
                enum: ["passed", "failed", "blocked"],
            },
            summary: { type: "string" },
            commandsRun: stringArraySchema,
            issues: stringArraySchema,
        },
        required: ["status", "summary", "commandsRun", "issues"],
    },
    validate(value) {
        return verificationResultSchema.parse(value);
    },
};
