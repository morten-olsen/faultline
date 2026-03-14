import { z } from 'zod';

import type { IssueStage, TimelineEntryKind, TimelineEntryStatus } from './issues.types.js';

// ── Event schemas (single source of truth) ───────────────────────────

const triageCompleteSchema = z.object({
  type: z.literal('TRIAGE_COMPLETE'),
  summary: z.string().min(1),
});

const proposePlanSchema = z.object({
  type: z.literal('PROPOSE_PLAN'),
  plan: z.string().min(1),
});

const planApprovedSchema = z.object({
  type: z.literal('PLAN_APPROVED'),
});

const planDeniedSchema = z.object({
  type: z.literal('PLAN_DENIED'),
  reason: z.string().optional(),
});

const enterMonitoringSchema = z.object({
  type: z.literal('ENTER_MONITORING'),
  monitorPlan: z.string().min(1),
  intervalMinutes: z.number().int().min(1),
  durationMinutes: z.number().int().min(1),
});

const monitoringDoneSchema = z.object({
  type: z.literal('MONITORING_DONE'),
  checksCompleted: z.number().int().optional(),
});

const regressionSchema = z.object({ type: z.literal('REGRESSION') });
const sourceResolvedSchema = z.object({ type: z.literal('SOURCE_RESOLVED') });
const reopenSchema = z.object({ type: z.literal('REOPEN') });
const ignoreSchema = z.object({ type: z.literal('IGNORE') });

const issueEventSchema = z.discriminatedUnion('type', [
  triageCompleteSchema,
  proposePlanSchema,
  planApprovedSchema,
  planDeniedSchema,
  enterMonitoringSchema,
  monitoringDoneSchema,
  regressionSchema,
  sourceResolvedSchema,
  reopenSchema,
  ignoreSchema,
]);

type IssueEvent = z.infer<typeof issueEventSchema>;

const issueEventTypes = [
  'TRIAGE_COMPLETE',
  'PROPOSE_PLAN',
  'PLAN_APPROVED',
  'PLAN_DENIED',
  'ENTER_MONITORING',
  'MONITORING_DONE',
  'REGRESSION',
  'SOURCE_RESOLVED',
  'REOPEN',
  'IGNORE',
] as const;

type IssueEventType = (typeof issueEventTypes)[number];

// ── Transition effects ───────────────────────────────────────────────

type IssueUpdates = {
  summary?: string;
  description?: string;
  monitor_plan?: string;
  monitor_interval_minutes?: number;
  monitor_next_check_at?: string;
  monitor_until?: string;
  monitor_checks_completed?: number;
};

type TransitionEffect = {
  stage: IssueStage;
  needsYou?: boolean;
  resolvedAt?: string;
  issueUpdates?: IssueUpdates;
  timeline?: {
    kind: TimelineEntryKind;
    status: TimelineEntryStatus;
    title: string;
    body?: string;
  };
};

type TransitionResult = { ok: true; effect: TransitionEffect } | { ok: false; reason: string };

// ── Error ────────────────────────────────────────────────────────────

class InvalidTransitionError extends Error {
  stage: IssueStage;
  event: IssueEventType;

  constructor(stage: IssueStage, event: IssueEventType, reason: string) {
    super(reason);
    this.name = 'InvalidTransitionError';
    this.stage = stage;
    this.event = event;
  }
}

// ── Active stages (non-terminal, for wildcard transitions) ───────────

const activeStages: ReadonlySet<IssueStage> = new Set([
  'triage',
  'investigation',
  'proposed-plan',
  'implementation',
  'monitoring',
]);

// ── Wildcard transitions ─────────────────────────────────────────────

const handleSourceResolved = (currentStage: IssueStage): TransitionResult => {
  if (!activeStages.has(currentStage)) {
    return { ok: false, reason: `Cannot source-resolve from "${currentStage}"` };
  }
  return {
    ok: true,
    effect: {
      stage: 'resolved',
      resolvedAt: new Date().toISOString(),
      timeline: { kind: 'resolved', status: 'success', title: 'Alert resolved by source' },
    },
  };
};

const handleIgnore = (currentStage: IssueStage): TransitionResult => {
  if (!activeStages.has(currentStage)) {
    return { ok: false, reason: `Cannot ignore from "${currentStage}"` };
  }
  return {
    ok: true,
    effect: {
      stage: 'ignored',
      timeline: { kind: 'user-action', status: 'info', title: 'Issue ignored' },
    },
  };
};

// ── Stage-specific transition handlers ───────────────────────────────

const transitionFromTriage = (event: IssueEvent): TransitionResult | undefined => {
  if (event.type === 'TRIAGE_COMPLETE') {
    return {
      ok: true,
      effect: {
        stage: 'investigation',
        issueUpdates: { summary: event.summary },
        timeline: { kind: 'outcome', status: 'success', title: 'Triage complete' },
      },
    };
  }
  return undefined;
};

const transitionFromInvestigation = (event: IssueEvent): TransitionResult | undefined => {
  if (event.type === 'PROPOSE_PLAN') {
    return {
      ok: true,
      effect: {
        stage: 'proposed-plan',
        needsYou: true,
        issueUpdates: { description: event.plan },
        timeline: { kind: 'needs-you', status: 'pending', title: 'Plan proposed — awaiting approval' },
      },
    };
  }
  return undefined;
};

const transitionFromProposedPlan = (event: IssueEvent): TransitionResult | undefined => {
  if (event.type === 'PLAN_APPROVED') {
    return {
      ok: true,
      effect: {
        stage: 'implementation',
        needsYou: false,
        timeline: { kind: 'user-action', status: 'success', title: 'Plan approved' },
      },
    };
  }
  if (event.type === 'PLAN_DENIED') {
    return {
      ok: true,
      effect: {
        stage: 'investigation',
        needsYou: false,
        timeline: {
          kind: 'user-action',
          status: 'info',
          title: event.reason ? `Plan rejected: ${event.reason}` : 'Plan rejected',
          body: event.reason,
        },
      },
    };
  }
  return undefined;
};

const transitionFromImplementation = (event: IssueEvent): TransitionResult | undefined => {
  if (event.type === 'ENTER_MONITORING') {
    const monitorUntil = new Date(Date.now() + event.durationMinutes * 60_000);
    const nextCheck = new Date(Date.now() + event.intervalMinutes * 60_000);
    return {
      ok: true,
      effect: {
        stage: 'monitoring',
        issueUpdates: {
          monitor_plan: event.monitorPlan,
          monitor_interval_minutes: event.intervalMinutes,
          monitor_next_check_at: nextCheck.toISOString(),
          monitor_until: monitorUntil.toISOString(),
          monitor_checks_completed: 0,
        },
        timeline: { kind: 'outcome', status: 'success', title: 'Entering monitoring' },
      },
    };
  }
  return undefined;
};

const transitionFromMonitoring = (event: IssueEvent): TransitionResult | undefined => {
  if (event.type === 'MONITORING_DONE') {
    const checks = event.checksCompleted;
    return {
      ok: true,
      effect: {
        stage: 'resolved',
        resolvedAt: new Date().toISOString(),
        timeline: {
          kind: 'resolved',
          status: 'success',
          title: 'Monitoring complete — issue resolved',
          body: checks !== undefined ? `All ${checks} checks passed. Closing.` : undefined,
        },
      },
    };
  }
  if (event.type === 'REGRESSION') {
    return {
      ok: true,
      effect: {
        stage: 'investigation',
        timeline: { kind: 'regression', status: 'failed', title: 'Regression detected during monitoring' },
      },
    };
  }
  return undefined;
};

const transitionFromResolved = (event: IssueEvent): TransitionResult | undefined => {
  if (event.type === 'REOPEN') {
    return {
      ok: true,
      effect: {
        stage: 'triage',
        timeline: { kind: 'regression', status: 'info', title: 'Issue reopened' },
      },
    };
  }
  return undefined;
};

// ── Stage handler dispatch ───────────────────────────────────────────

const stageHandlers: Record<IssueStage, ((event: IssueEvent) => TransitionResult | undefined) | undefined> = {
  triage: transitionFromTriage,
  investigation: transitionFromInvestigation,
  'proposed-plan': transitionFromProposedPlan,
  implementation: transitionFromImplementation,
  monitoring: transitionFromMonitoring,
  resolved: transitionFromResolved,
  ignored: undefined,
};

// ── Transition function ──────────────────────────────────────────────

const transition = (currentStage: IssueStage, event: IssueEvent): TransitionResult => {
  // Wildcard: any active stage → resolved via SOURCE_RESOLVED
  if (event.type === 'SOURCE_RESOLVED') {
    return handleSourceResolved(currentStage);
  }

  // Wildcard: any active stage → ignored via IGNORE
  if (event.type === 'IGNORE') {
    return handleIgnore(currentStage);
  }

  // Stage-specific transitions
  const handler = stageHandlers[currentStage];
  const result = handler?.(event);
  if (result) {
    return result;
  }

  return { ok: false, reason: `Invalid transition: "${event.type}" from "${currentStage}"` };
};

export type { IssueEventType, IssueEvent, IssueUpdates, TransitionEffect, TransitionResult };
export { issueEventTypes, issueEventSchema, transition, InvalidTransitionError };
