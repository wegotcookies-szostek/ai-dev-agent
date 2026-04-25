export function parseJson(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch (error) {
        throw new Error(
            `Failed to parse JSON from model output: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
