import { parentPort, workerData } from "node:worker_threads";

import type { AgentTask, AgentEvent } from "./agent.types.js";

// The worker dynamically imports the SDK so the main thread never loads it.
// workerData carries the task; parentPort streams events back.

type WorkerData = {
  task: AgentTask;
};

const post = (event: AgentEvent): void => {
  parentPort!.postMessage(event);
};

const extractTitle = (content: unknown): string => {
  if (Array.isArray(content)) {
    for (const block of content) {
      if (block && typeof block === "object" && "type" in block) {
        if (block.type === "text" && "text" in block) {
          const text = String(block.text);
          return text.length > 120 ? text.slice(0, 117) + "..." : text;
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
          const text = typeof block.content === "string" ? block.content : JSON.stringify(block.content);
          return text.length > 120 ? text.slice(0, 117) + "..." : text;
        }
      }
    }
  }
  if (typeof content === "string") {
    return content.length > 120 ? content.slice(0, 117) + "..." : content;
  }
  return "Agent step";
};

const run = async (): Promise<void> => {
  const { task } = workerData as WorkerData;

  // Dynamic import — the SDK is only loaded inside the worker
  const { query } = await import("@anthropic-ai/claude-agent-sdk");

  const startTime = Date.now();

  const conversation = query({
    prompt: task.prompt,
    options: {
      systemPrompt: task.systemPrompt,
      allowedTools: task.builtinTools ? [...task.builtinTools] : [
        "Read",
        "Glob",
        "Grep",
        "Bash",
        "Write",
        "Edit",
      ],
      cwd: task.cwd,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      maxTurns: 30,
    },
  });

  try {
    for await (const message of conversation) {
      if (message.type === "assistant") {
        const msg = message.message as {
          content?: unknown;
          stop_reason?: string;
          usage?: { input_tokens?: number; output_tokens?: number };
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
            post({
              type: "step",
              kind: "thinking",
              title: text.length > 120 ? text.slice(0, 117) + "..." : text,
              detail: text,
            });
          } else if (block.type === "text" && "text" in block) {
            post({
              type: "step",
              kind: "message",
              title: extractTitle([block]),
              detail: String(block.text),
            });
          } else if (block.type === "tool_use" && "name" in block) {
            post({
              type: "step",
              kind: "tool-call",
              title: extractTitle([block]),
              detail: JSON.stringify(
                "input" in block ? block.input : undefined,
                null,
                2,
              ),
            });
          }
        }
      } else if (message.type === "user" && !("isReplay" in message)) {
        // Tool results come back as user messages
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
              const isError = "is_error" in block && block.is_error === true;
              post({
                type: "step",
                kind: isError ? "error" : "tool-call",
                title: extractTitle([block]),
                output,
                status: isError ? "failed" : undefined,
              });
            }
          }
        }
      } else if (message.type === "result") {
        const result = message as { subtype?: string; result?: string };
        if (result.subtype === "success" && result.result) {
          post({ type: "result", text: result.result });
        } else if (result.subtype === "error") {
          const errorMsg = result.result ?? "Agent ended with an error";
          post({ type: "error", message: errorMsg });
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    post({ type: "error", message });
  } finally {
    post({ type: "done" });
  }
};

// Listen for abort signals from the main thread
parentPort!.on("message", (msg: unknown) => {
  if (typeof msg === "object" && msg !== null && "type" in msg) {
    if ((msg as { type: string }).type === "abort") {
      process.exit(0);
    }
  }
});

run();
