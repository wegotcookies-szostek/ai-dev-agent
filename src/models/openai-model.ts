import OpenAI from "openai";
import type { AppConfig } from "../config.js";
import { parseJson } from "../utils/json.js";
import type {
    AgentModel,
    AgentTool,
    RunToolAgentInput,
} from "./types.js";

const FINAL_TOOL_NAME = "submit_result";

function toToolDefinition(tool: AgentTool) {
    return {
        type: "function" as const,
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
        strict: true,
    };
}

function buildUserMessage(prompt: string) {
    return {
        role: "user" as const,
        content: [{ type: "input_text" as const, text: prompt }],
    };
}

function isFunctionCall(
    item: any
): item is { type: "function_call"; arguments: string; name: string; call_id: string } {
    return item?.type === "function_call";
}

export class OpenAIModelClient implements AgentModel {
    private client: OpenAI;

    constructor(private config: AppConfig) {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: config.openAiBaseUrl,
        });
    }

    async runToolAgent<T>(input: RunToolAgentInput<T>): Promise<T> {
        const tools = [
            ...input.tools.map(toToolDefinition),
            toToolDefinition({
                name: FINAL_TOOL_NAME,
                description: input.result.description,
                inputSchema: input.result.schema,
                async execute() {
                    throw new Error(`${FINAL_TOOL_NAME} is handled by the model client.`);
                },
            }),
        ];

        const conversation: any[] = [buildUserMessage(input.userPrompt)];

        for (let step = 0; step < input.maxSteps; step += 1) {
            const response = await this.client.responses.create({
                model: this.config.model,
                instructions: input.systemPrompt,
                input: conversation,
                tools,
            });

            const output = Array.isArray(response.output) ? response.output : [];
            const functionCalls = output.filter(isFunctionCall);

            conversation.push(...output);

            if (functionCalls.length === 0) {
                throw new Error(
                    `Model stopped without calling ${FINAL_TOOL_NAME}. Output: ${response.output_text}`
                );
            }

            const pendingOutputs: Array<{
                type: "function_call_output";
                call_id: string;
                output: string;
            }> = [];

            let finalResult: T | undefined;

            for (const call of functionCalls) {
                const args = parseJson(call.arguments);

                if (call.name === FINAL_TOOL_NAME) {
                    finalResult = input.result.validate(args);
                    continue;
                }

                const tool = input.tools.find((candidate) => candidate.name === call.name);
                if (!tool) {
                    throw new Error(`Unknown tool requested by model: ${call.name}`);
                }

                const outputValue = await tool.execute(args, input.context);
                pendingOutputs.push({
                    type: "function_call_output",
                    call_id: call.call_id,
                    output: outputValue,
                });
            }

            if (pendingOutputs.length > 0) {
                conversation.push(...pendingOutputs);
            }

            if (finalResult) {
                return finalResult;
            }
        }

        throw new Error(`Model exceeded max steps (${input.maxSteps}) without finishing.`);
    }
}
