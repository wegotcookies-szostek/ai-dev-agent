import type { AgentExecutor } from "./executor";
import { CodexExecutor } from "./codex-executor";
import { ShellExecutor } from "./shell-executor";

export function createExecutor(): AgentExecutor {
    const executor = process.env.AGENT_EXECUTOR ?? "codex";

    if (executor === "codex") {
        return new CodexExecutor();
    }

    if (executor === "claude") {
        return new ShellExecutor("claude", "claude", ["-p", "{{prompt}}"]);
    }

    if (executor === "local") {
        return new ShellExecutor("local", "ollama", ["run", "qwen2.5-coder", "{{prompt}}"]);
    }

    throw new Error(`Unknown AGENT_EXECUTOR: ${executor}`);
}