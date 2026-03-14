import { z } from 'zod';
import type { FastifyInstance } from 'fastify';

import { IssueService } from '../issues/issues.js';
import type { Services } from '../services/services.js';
import type { IssuePriority } from '../issues/issues.js';

const alertSchema = z.object({
  status: z.enum(['firing', 'resolved']),
  labels: z.record(z.string(), z.string()).default({}),
  annotations: z.record(z.string(), z.string()).default({}),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  generatorURL: z.string().optional(),
  fingerprint: z.string(),
});

type Alert = z.infer<typeof alertSchema>;

const alertmanagerPayloadSchema = z.object({
  version: z.string().optional(),
  groupKey: z.string().optional(),
  status: z.enum(['firing', 'resolved']),
  receiver: z.string().optional(),
  groupLabels: z.record(z.string(), z.string()).optional(),
  commonLabels: z.record(z.string(), z.string()).optional(),
  commonAnnotations: z.record(z.string(), z.string()).optional(),
  externalURL: z.string().optional(),
  alerts: z.array(alertSchema),
});

type AlertmanagerPayload = z.infer<typeof alertmanagerPayloadSchema>;

const severityToPriority = (severity: string | undefined): IssuePriority => {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'warning':
      return 'high';
    case 'info':
      return 'low';
    default:
      return 'medium';
  }
};

const buildTitle = (alert: Alert): string => {
  const alertname = alert.labels['alertname'];
  const summary = alert.annotations['summary'];

  if (alertname && summary) {
    return `[${alertname}] ${summary}`;
  }

  return alertname ?? summary ?? 'Unnamed alert';
};

const registerAlertmanagerWebhook = (app: FastifyInstance, services: Services): void => {
  app.post('/api/webhooks/alertmanager', async (request, reply) => {
    const result = alertmanagerPayloadSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        error: 'Invalid AlertManager payload',
        details: result.error.issues,
      });
    }

    const payload = result.data;
    const issueService = services.get(IssueService);

    for (const alert of payload.alerts) {
      const existing = await issueService.getByFingerprint(alert.fingerprint, 'alertmanager');

      if (alert.status === 'firing') {
        if (!existing) {
          const issue = await issueService.create({
            fingerprint: alert.fingerprint,
            source: 'alertmanager',
            title: buildTitle(alert),
            summary: alert.annotations['summary'] ?? null,
            description: alert.annotations['description'] ?? null,
            stage: 'triage',
            needsYou: false,
            priority: severityToPriority(alert.labels['severity']),
            sourcePayload: JSON.stringify(alert),
          });

          await issueService.addTimelineEntry({
            issueId: issue.id,
            agentLoopId: null,
            kind: 'detected',
            status: 'info',
            title: buildTitle(alert),
            body: alert.annotations['description'] ?? null,
            commandRun: null,
          });
        } else {
          // Always update source payload
          await issueService.update(existing.id, {
            sourcePayload: JSON.stringify(alert),
          });

          if (existing.stage === 'resolved') {
            await issueService.transition(existing.id, { type: 'REOPEN' });
            await issueService.addTimelineEntry({
              issueId: existing.id,
              agentLoopId: null,
              kind: 'regression',
              status: 'info',
              title: 'Alert re-fired — issue regressed',
              body: JSON.stringify(alert),
              commandRun: null,
            });
          } else {
            await issueService.addTimelineEntry({
              issueId: existing.id,
              agentLoopId: null,
              kind: 'detected',
              status: 'info',
              title: 'Alert re-fired',
              body: JSON.stringify(alert),
              commandRun: null,
            });
          }
        }
      } else if (alert.status === 'resolved') {
        if (existing && existing.stage !== 'resolved' && existing.stage !== 'ignored') {
          await issueService.transition(existing.id, { type: 'SOURCE_RESOLVED' });
        }
      }
    }

    return reply.status(200).send({ status: 'ok' });
  });
};

export type { AlertmanagerPayload };
export { alertmanagerPayloadSchema, registerAlertmanagerWebhook };
