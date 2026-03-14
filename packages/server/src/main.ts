import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import type { EventMessage } from '@faultline/protocol';

import { Services } from './services/services.js';
import { DatabaseService } from './database/database.js';
import { OrchestratorService } from './orchestrator/orchestrator.js';
import { registerAlertmanagerWebhook } from './webhooks/webhooks.js';
import { buildRouter } from './main.routes.js';
import type { CallContext } from './router/router.js';

const services = new Services();
const router = buildRouter();

const start = async (): Promise<void> => {
  const app = Fastify();
  await app.register(fastifyWebsocket);

  const connectedSockets = new Set<import('ws').WebSocket>();

  app.get('/api/ws', { websocket: true }, (socket) => {
    connectedSockets.add(socket);
    socket.on('close', () => connectedSockets.delete(socket));

    const context: CallContext = {
      services,
      ws: socket,
    };

    const connectedEvent: EventMessage = {
      type: 'event',
      event: 'connected',
      payload: { clientId: crypto.randomUUID() },
    };
    socket.send(JSON.stringify(connectedEvent));

    socket.on('message', (data) => {
      router.handle(String(data), context);
    });
  });

  registerAlertmanagerWebhook(app, services);

  // Ensure database is initialized before accepting connections
  await services.get(DatabaseService).instance;

  // Start the orchestrator
  const orchestrator = services.get(OrchestratorService);
  orchestrator.onStageChange((issueId, from, to) => {
    const event: EventMessage = {
      type: 'event',
      event: 'issue.stageChanged',
      payload: { issueId, from, to },
    };
    const msg = JSON.stringify(event);
    for (const ws of connectedSockets) {
      try {
        ws.send(msg);
      } catch {
        /* ignore dead sockets */
      }
    }
  });
  orchestrator.start();

  const address = await app.listen({ port: 3007, host: '0.0.0.0' });
  console.log(`Faultline server listening on ${address}`);
};

const shutdown = async (): Promise<void> => {
  services.get(OrchestratorService).stop();
  await services.destroy();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
