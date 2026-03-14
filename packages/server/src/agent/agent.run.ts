import { randomUUID } from 'node:crypto';

import { EventEmitter } from '../utils/utils.event-emitter.js';

import type { AgentTask, AgentProvider, AgentRunEventMap } from './agent.types.js';

class AgentRun {
  readonly id: string;
  readonly correlationId: string | undefined;
  readonly events: EventEmitter<AgentRunEventMap>;

  #task: AgentTask;
  #provider: AgentProvider;
  #controller: AbortController;

  constructor(task: AgentTask, provider: AgentProvider) {
    this.id = randomUUID();
    this.correlationId = task.correlationId;
    this.events = new EventEmitter();
    this.#task = task;
    this.#provider = provider;
    this.#controller = new AbortController();
  }

  get signal(): AbortSignal {
    return this.#controller.signal;
  }

  start = (): void => {
    this.#execute().catch(() => {
      // Errors are emitted as events; nothing to do here.
    });
  };

  stop = (): void => {
    this.#controller.abort();
  };

  #execute = async (): Promise<void> => {
    try {
      for await (const event of this.#provider.run(this.#task, this.#controller.signal)) {
        switch (event.type) {
          case 'step':
            this.events.emit('step', event);
            break;
          case 'result':
            this.events.emit('result', event);
            break;
          case 'error':
            this.events.emit('error', event);
            break;
          case 'done':
            break;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.events.emit('error', { type: 'error', message });
    } finally {
      this.events.emit('done');
    }
  };
}

export { AgentRun };
