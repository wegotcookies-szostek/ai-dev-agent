export type JsonSchema = {
    type: string;
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema;
    required?: string[];
    additionalProperties?: boolean;
    enum?: string[];
    description?: string;
};

export type ToolContext = {
    repoPath: string;
    commandTimeoutMs: number;
};

export type AgentTool = {
    name: string;
    description: string;
    inputSchema: JsonSchema;
    execute(args: unknown, context: ToolContext): Promise<string>;
};

export type ToolAgentResult<T> = {
    description: string;
    schema: JsonSchema;
    validate(value: unknown): T;
};

export type RunToolAgentInput<T> = {
    systemPrompt: string;
    userPrompt: string;
    tools: AgentTool[];
    result: ToolAgentResult<T>;
    context: ToolContext;
    maxSteps: number;
};

export interface AgentModel {
    runToolAgent<T>(input: RunToolAgentInput<T>): Promise<T>;
}
