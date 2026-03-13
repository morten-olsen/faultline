import { z } from "zod";

import type { AgentProvider, AgentTask, AgentEvent } from "./agent.types.js";
import type { Tool } from "./agent.tools.js";

// ── Helpers ─────────────────────────────────────────────────────────

const truncate = (text: string, max = 120): string =>
  text.length > max ? text.slice(0, max - 3) + "..." : text;

const extractTitle = (content: unknown): string => {
  if (Array.isArray(content)) {
    for (const block of content) {
      if (block && typeof block === "object" && "type" in block) {
        if (block.type === "text" && "text" in block) {
          return truncate(String(block.text));
        }
        if (block.type === "tool_use" && "name" in block) {
          const input = "input" in block ? block.input : undefined;
          const args =
            input && typeof input === "object"
              ? Object.entries(input as Record<string, unknown>)
                  .slice(0, 2)
                  .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                  .join(", ")
              : "";
          return `${String(block.name)}(${args})`;
        }
        if (block.type === "tool_result" && "content" in block) {
          const text = typeof block.content === "string"
            ? block.content
            : JSON.stringify(block.content);
          return truncate(text);
        }
      }
    }
  }
  if (typeof content === "string") {
    return truncate(content);
  }
  return "Agent step";
};

// ── Convert our Tool definitions to SDK MCP tool definitions ────────

const toSdkTools = async (
  tools: Tool[],
): Promise<{ mcpServer: unknown; toolNames: string[] }> => {
  const { tool, createSdkMcpServer } = await import(
    "@anthropic-ai/claude-agent-sdk"
  );

  const sdkTools = tools.map((t) =>
    tool(
      t.name,
      t.description,
      // Convert ZodObject to raw shape for the SDK's tool() function
      t.inputSchema.shape as z.ZodRawShape,
      async (args: unknown) => {
        const parsed = t.inputSchema.parse(args);
        const result = await t.execute(parsed);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result),
            },
          ],
        };
      },
    ),
  );

  const mcpServer = createSdkMcpServer({
    name: "faultline",
    version: "1.0.0",
    tools: sdkTools,
  });

  const toolNames = tools.map((t) => `mcp__faultline__${t.name}`);

  return { mcpServer, toolNames };
};

// ── Provider ────────────────────────────────────────────────────────

const createClaudeAgentProvider = (): AgentProvider => {
  const run = async function* (
    task: AgentTask,
    signal: AbortSignal,
  ): AsyncGenerator<AgentEvent> {
    if (signal.aborted) return;

    const { query } = await import("@anthropic-ai/claude-agent-sdk");

    // Build options
    const builtinTools = task.builtinTools ?? [
      "Read", "Glob", "Grep", "Bash", "Write", "Edit",
    ];
    const allowedTools: string[] = [...builtinTools];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mcpServers: Record<string, any> = {};

    // Convert custom tools to an in-process MCP server
    if (task.customTools && task.customTools.length > 0) {
      const { mcpServer, toolNames } = await toSdkTools(task.customTools);
      mcpServers["faultline"] = mcpServer;
      allowedTools.push(...toolNames);
    }

    const conversation = query({
      prompt: task.prompt,
      options: {
        systemPrompt: task.systemPrompt,
        allowedTools,
        ...(Object.keys(mcpServers).length > 0 ? { mcpServers } : {}),
        cwd: task.cwd,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        maxTurns: 30,
      },
    });

    try {
      for await (const message of conversation) {
        if (signal.aborted) break;

        if (message.type === "assistant") {
          const msg = message.message as {
            content?: unknown;
            stop_reason?: string;
          };

          if (!msg.content || !Array.isArray(msg.content)) continue;

          for (const block of msg.content) {
            if (
              typeof block !== "object" ||
              block === null ||
              !("type" in block)
            )
              continue;

            if (block.type === "thinking" && "thinking" in block) {
              const text = String(block.thinking);
              yield {
                type: "step",
                kind: "thinking",
                title: truncate(text),
                detail: text,
              };
            } else if (block.type === "text" && "text" in block) {
              yield {
                type: "step",
                kind: "message",
                title: extractTitle([block]),
                detail: String(block.text),
              };
            } else if (block.type === "tool_use" && "name" in block) {
              yield {
                type: "step",
                kind: "tool-call",
                title: extractTitle([block]),
                detail: JSON.stringify(
                  "input" in block ? block.input : undefined,
                  null,
                  2,
                ),
              };
            }
          }
        } else if (message.type === "user" && !("isReplay" in message)) {
          const param = message.message as { content?: unknown };
          if (param.content && Array.isArray(param.content)) {
            for (const block of param.content) {
              if (
                typeof block === "object" &&
                block !== null &&
                "type" in block &&
                block.type === "tool_result"
              ) {
                const output =
                  "content" in block
                    ? typeof block.content === "string"
                      ? block.content
                      : JSON.stringify(block.content)
                    : undefined;
                const isError =
                  "is_error" in block && block.is_error === true;
                yield {
                  type: "step",
                  kind: isError ? "error" : "tool-call",
                  title: extractTitle([block]),
                  output,
                  status: isError ? "failed" : undefined,
                };
              }
            }
          }
        } else if (message.type === "result") {
          const result = message as { subtype?: string; result?: string };
          if (result.subtype === "success" && result.result) {
            yield { type: "result", text: result.result };
          } else if (result.subtype === "error") {
            yield {
              type: "error",
              message: result.result ?? "Agent ended with an error",
            };
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      yield { type: "error", message };
    } finally {
      yield { type: "done" };
    }
  };

  return { run };
};

export { createClaudeAgentProvider };
