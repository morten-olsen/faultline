import { parentPort, workerData } from 'node:worker_threads';

import type { AgentTask, AgentEvent } from './agent.types.js';

// The worker dynamically imports the SDK so the main thread never loads it.
// workerData carries the task; parentPort streams events back.

type WorkerData = {
  task: AgentTask;
};

const post = (event: AgentEvent): void => {
  parentPort?.postMessage(event);
};

const truncate = (text: string, max = 120): string => (text.length > max ? text.slice(0, max - 3) + '...' : text);

const extractTitleFromBlock = (block: Record<string, unknown>): string | undefined => {
  if (block.type === 'text' && 'text' in block) {
    return truncate(String(block.text));
  }
  if (block.type === 'tool_use' && 'name' in block) {
    const input = 'input' in block ? block.input : undefined;
    const args =
      input && typeof input === 'object'
        ? Object.entries(input as Record<string, unknown>)
            .slice(0, 2)
            .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
            .join(', ')
        : '';
    return `${String(block.name)}(${args})`;
  }
  if (block.type === 'tool_result' && 'content' in block) {
    const text = typeof block.content === 'string' ? block.content : JSON.stringify(block.content);
    return truncate(text);
  }
  return undefined;
};

const extractTitle = (content: unknown): string => {
  if (Array.isArray(content)) {
    for (const block of content) {
      if (!block || typeof block !== 'object' || !('type' in block)) {
        continue;
      }
      const title = extractTitleFromBlock(block as Record<string, unknown>);
      if (title) {
        return title;
      }
    }
  }
  if (typeof content === 'string') {
    return truncate(content);
  }
  return 'Agent step';
};

// ── Content block → event mappers ───────────────────────────────────

type ContentBlock = Record<string, unknown> & { type: string };

const isContentBlock = (block: unknown): block is ContentBlock =>
  typeof block === 'object' && block !== null && 'type' in block;

const postAssistantBlock = (block: ContentBlock): void => {
  if (block.type === 'thinking' && 'thinking' in block) {
    const text = String(block.thinking);
    post({ type: 'step', kind: 'thinking', title: truncate(text), detail: text });
  } else if (block.type === 'text' && 'text' in block) {
    post({ type: 'step', kind: 'message', title: extractTitle([block]), detail: String(block.text) });
  } else if (block.type === 'tool_use' && 'name' in block) {
    post({
      type: 'step',
      kind: 'tool-call',
      title: extractTitle([block]),
      detail: JSON.stringify('input' in block ? block.input : undefined, null, 2),
    });
  }
};

const postToolResult = (block: ContentBlock): void => {
  if (block.type !== 'tool_result') {
    return;
  }
  const output =
    'content' in block
      ? typeof block.content === 'string'
        ? block.content
        : JSON.stringify(block.content)
      : undefined;
  const isError = 'is_error' in block && block.is_error === true;
  post({
    type: 'step',
    kind: isError ? 'error' : 'tool-call',
    title: extractTitle([block]),
    output,
    status: isError ? 'failed' : undefined,
  });
};

const handleAssistantMessage = (message: { message: unknown }): void => {
  const msg = message.message as { content?: unknown };
  if (!msg.content || !Array.isArray(msg.content)) {
    return;
  }
  for (const block of msg.content) {
    if (isContentBlock(block)) {
      postAssistantBlock(block);
    }
  }
};

const handleUserMessage = (message: { message: unknown }): void => {
  const param = message.message as { content?: unknown };
  if (!param.content || !Array.isArray(param.content)) {
    return;
  }
  for (const block of param.content) {
    if (isContentBlock(block)) {
      postToolResult(block);
    }
  }
};

const handleResultMessage = (message: { subtype?: string; result?: string }): void => {
  if (message.subtype === 'success' && message.result) {
    post({ type: 'result', text: message.result });
  } else if (message.subtype === 'error') {
    post({ type: 'error', message: message.result ?? 'Agent ended with an error' });
  }
};

// ── Message dispatch ────────────────────────────────────────────────

const dispatchMessage = (message: unknown): void => {
  const msg = message as { type: string; message?: unknown; subtype?: string; result?: string };
  if (msg.type === 'assistant') {
    handleAssistantMessage(msg as { message: unknown });
    return;
  }
  if (msg.type === 'user' && !('isReplay' in (message as object))) {
    handleUserMessage(msg as { message: unknown });
    return;
  }
  if (msg.type === 'result') {
    handleResultMessage(msg as { subtype?: string; result?: string });
  }
};

// ── Main run loop ───────────────────────────────────────────────────

const run = async (): Promise<void> => {
  const { task } = workerData as WorkerData;

  // Dynamic import — the SDK is only loaded inside the worker
  const { query } = await import('@anthropic-ai/claude-agent-sdk');

  const conversation = query({
    prompt: task.prompt,
    options: {
      systemPrompt: task.systemPrompt,
      allowedTools: task.builtinTools ? [...task.builtinTools] : ['Read', 'Glob', 'Grep', 'Bash', 'Write', 'Edit'],
      cwd: task.cwd,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      maxTurns: 30,
    },
  });

  try {
    for await (const message of conversation) {
      dispatchMessage(message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    post({ type: 'error', message });
  } finally {
    post({ type: 'done' });
  }
};

// Listen for abort signals from the main thread
parentPort?.on('message', (msg: unknown) => {
  if (typeof msg === 'object' && msg !== null && 'type' in msg) {
    if ((msg as { type: string }).type === 'abort') {
      process.exit(0);
    }
  }
});

run();
