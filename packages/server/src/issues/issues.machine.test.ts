import { describe, it, expect } from "vitest";

import { transition, issueEventSchema, InvalidTransitionError, issueEventTypes } from "./issues.machine.js";

import type { IssueStage } from "./issues.types.js";
import type { IssueEvent } from "./issues.machine.js";

// ── Helpers ──────────────────────────────────────────────────────────

const ok = (stage: IssueStage, event: IssueEvent) => {
  const result = transition(stage, event);
  if (!result.ok) throw new Error(`Expected ok, got: ${result.reason}`);
  return result.effect;
};

const fail = (stage: IssueStage, event: IssueEvent) => {
  const result = transition(stage, event);
  if (result.ok) throw new Error(`Expected failure, got stage: ${result.effect.stage}`);
  return result.reason;
};

// ── Happy path: full lifecycle ───────────────────────────────────────

describe("issue lifecycle — happy path", () => {
  it("progresses through the full lifecycle: triage → investigation → proposed-plan → implementation → monitoring → resolved", () => {
    let stage: IssueStage = "triage";

    const e1 = ok(stage, { type: "TRIAGE_COMPLETE", summary: "Node-02 OOM" });
    expect(e1.stage).toBe("investigation");
    expect(e1.issueUpdates?.summary).toBe("Node-02 OOM");
    stage = e1.stage;

    const e2 = ok(stage, { type: "PROPOSE_PLAN", plan: "Restart the pod and increase limits" });
    expect(e2.stage).toBe("proposed-plan");
    expect(e2.needsYou).toBe(true);
    expect(e2.issueUpdates?.description).toBe("Restart the pod and increase limits");
    stage = e2.stage;

    const e3 = ok(stage, { type: "PLAN_APPROVED" });
    expect(e3.stage).toBe("implementation");
    expect(e3.needsYou).toBe(false);
    stage = e3.stage;

    const e4 = ok(stage, {
      type: "ENTER_MONITORING",
      monitorPlan: "Check memory stays below 80%",
      intervalMinutes: 5,
      durationMinutes: 30,
    });
    expect(e4.stage).toBe("monitoring");
    expect(e4.issueUpdates?.monitor_plan).toBe("Check memory stays below 80%");
    expect(e4.issueUpdates?.monitor_interval_minutes).toBe(5);
    expect(e4.issueUpdates?.monitor_until).toBeDefined();
    expect(e4.issueUpdates?.monitor_next_check_at).toBeDefined();
    expect(e4.issueUpdates?.monitor_checks_completed).toBe(0);
    stage = e4.stage;

    const e5 = ok(stage, { type: "MONITORING_DONE", checksCompleted: 5 });
    expect(e5.stage).toBe("resolved");
    expect(e5.resolvedAt).toBeDefined();
    expect(e5.timeline?.body).toContain("5");
  });
});

// ── Event data flows through to effects ──────────────────────────────

describe("event data flows to issue updates", () => {
  it("TRIAGE_COMPLETE carries summary to the effect", () => {
    const effect = ok("triage", { type: "TRIAGE_COMPLETE", summary: "Pod CrashLoopBackOff" });
    expect(effect.issueUpdates?.summary).toBe("Pod CrashLoopBackOff");
  });

  it("PROPOSE_PLAN carries plan to the effect as description", () => {
    const effect = ok("investigation", { type: "PROPOSE_PLAN", plan: "Scale down and redeploy" });
    expect(effect.issueUpdates?.description).toBe("Scale down and redeploy");
  });

  it("ENTER_MONITORING computes monitoring schedule from duration and interval", () => {
    const before = Date.now();
    const effect = ok("implementation", {
      type: "ENTER_MONITORING",
      monitorPlan: "Watch CPU usage",
      intervalMinutes: 10,
      durationMinutes: 60,
    });
    const after = Date.now();

    const updates = effect.issueUpdates!;
    expect(updates.monitor_plan).toBe("Watch CPU usage");
    expect(updates.monitor_interval_minutes).toBe(10);
    expect(updates.monitor_checks_completed).toBe(0);

    // monitor_until should be ~60 minutes from now
    const until = new Date(updates.monitor_until!).getTime();
    expect(until).toBeGreaterThanOrEqual(before + 60 * 60_000);
    expect(until).toBeLessThanOrEqual(after + 60 * 60_000);

    // next check should be ~10 minutes from now
    const next = new Date(updates.monitor_next_check_at!).getTime();
    expect(next).toBeGreaterThanOrEqual(before + 10 * 60_000);
    expect(next).toBeLessThanOrEqual(after + 10 * 60_000);
  });
});

// ── Plan rejection cycle ─────────────────────────────────────────────

describe("plan rejection", () => {
  it("sends a denied plan back to investigation", () => {
    const effect = ok("proposed-plan", { type: "PLAN_DENIED", reason: "too risky" });
    expect(effect.stage).toBe("investigation");
    expect(effect.needsYou).toBe(false);
    expect(effect.timeline?.title).toContain("too risky");
  });

  it("works without a reason", () => {
    const effect = ok("proposed-plan", { type: "PLAN_DENIED" });
    expect(effect.stage).toBe("investigation");
    expect(effect.timeline?.title).toBe("Plan rejected");
  });
});

// ── Monitoring regression ────────────────────────────────────────────

describe("monitoring regression", () => {
  it("sends a regression back to investigation", () => {
    const effect = ok("monitoring", { type: "REGRESSION" });
    expect(effect.stage).toBe("investigation");
    expect(effect.timeline?.kind).toBe("regression");
  });
});

// ── Reopen from resolved ─────────────────────────────────────────────

describe("reopen", () => {
  it("reopens a resolved issue back to triage", () => {
    const effect = ok("resolved", { type: "REOPEN" });
    expect(effect.stage).toBe("triage");
  });

  it("cannot reopen from non-resolved stages", () => {
    const stages: IssueStage[] = ["triage", "investigation", "proposed-plan", "implementation", "monitoring", "ignored"];
    for (const stage of stages) {
      const reason = fail(stage, { type: "REOPEN" });
      expect(reason).toContain("Invalid transition");
    }
  });
});

// ── Wildcard: SOURCE_RESOLVED from any active stage ──────────────────

describe("SOURCE_RESOLVED", () => {
  const activeStages: IssueStage[] = ["triage", "investigation", "proposed-plan", "implementation", "monitoring"];

  it.each(activeStages)("resolves from %s", (stage) => {
    const effect = ok(stage, { type: "SOURCE_RESOLVED" });
    expect(effect.stage).toBe("resolved");
    expect(effect.resolvedAt).toBeDefined();
  });

  it("cannot source-resolve from resolved", () => {
    const reason = fail("resolved", { type: "SOURCE_RESOLVED" });
    expect(reason).toContain("Cannot source-resolve");
  });

  it("cannot source-resolve from ignored", () => {
    const reason = fail("ignored", { type: "SOURCE_RESOLVED" });
    expect(reason).toContain("Cannot source-resolve");
  });
});

// ── Wildcard: IGNORE from any active stage ───────────────────────────

describe("IGNORE", () => {
  const activeStages: IssueStage[] = ["triage", "investigation", "proposed-plan", "implementation", "monitoring"];

  it.each(activeStages)("ignores from %s", (stage) => {
    const effect = ok(stage, { type: "IGNORE" });
    expect(effect.stage).toBe("ignored");
  });

  it("cannot ignore from resolved", () => {
    const reason = fail("resolved", { type: "IGNORE" });
    expect(reason).toContain("Cannot ignore");
  });

  it("cannot ignore from ignored", () => {
    const reason = fail("ignored", { type: "IGNORE" });
    expect(reason).toContain("Cannot ignore");
  });
});

// ── Terminal states block all non-allowed events ─────────────────────

describe("terminal states", () => {
  // Build valid events with required payloads for each type
  const allEvents: IssueEvent[] = [
    { type: "TRIAGE_COMPLETE", summary: "x" },
    { type: "PROPOSE_PLAN", plan: "x" },
    { type: "PLAN_APPROVED" },
    { type: "PLAN_DENIED" },
    { type: "ENTER_MONITORING", monitorPlan: "x", intervalMinutes: 5, durationMinutes: 30 },
    { type: "MONITORING_DONE" },
    { type: "REGRESSION" },
    { type: "SOURCE_RESOLVED" },
    { type: "REOPEN" },
    { type: "IGNORE" },
  ];

  const nonReopenEvents = allEvents.filter((e) => e.type !== "REOPEN");

  it.each(nonReopenEvents.map((e) => [e.type, e] as const))(
    "resolved rejects %s",
    (_name, event) => {
      const result = transition("resolved", event);
      expect(result.ok).toBe(false);
    },
  );

  it.each(allEvents.map((e) => [e.type, e] as const))(
    "ignored rejects %s",
    (_name, event) => {
      const result = transition("ignored", event);
      expect(result.ok).toBe(false);
    },
  );
});

// ── Invalid transitions from specific stages ─────────────────────────

describe("invalid transitions", () => {
  it("cannot approve a plan from triage", () => {
    const reason = fail("triage", { type: "PLAN_APPROVED" });
    expect(reason).toContain("Invalid transition");
  });

  it("cannot enter monitoring from investigation", () => {
    const reason = fail("investigation", {
      type: "ENTER_MONITORING",
      monitorPlan: "x",
      intervalMinutes: 5,
      durationMinutes: 30,
    });
    expect(reason).toContain("Invalid transition");
  });

  it("cannot complete monitoring from implementation", () => {
    const reason = fail("implementation", { type: "MONITORING_DONE" });
    expect(reason).toContain("Invalid transition");
  });

  it("cannot propose plan from triage (must triage first)", () => {
    const reason = fail("triage", { type: "PROPOSE_PLAN", plan: "x" });
    expect(reason).toContain("Invalid transition");
  });

  it("cannot triage-complete from investigation", () => {
    const reason = fail("investigation", { type: "TRIAGE_COMPLETE", summary: "x" });
    expect(reason).toContain("Invalid transition");
  });
});

// ── Timeline effects ─────────────────────────────────────────────────

describe("timeline effects", () => {
  it("every successful transition produces a timeline entry", () => {
    const validTransitions: [IssueStage, IssueEvent][] = [
      ["triage", { type: "TRIAGE_COMPLETE", summary: "x" }],
      ["investigation", { type: "PROPOSE_PLAN", plan: "x" }],
      ["proposed-plan", { type: "PLAN_APPROVED" }],
      ["proposed-plan", { type: "PLAN_DENIED" }],
      ["implementation", { type: "ENTER_MONITORING", monitorPlan: "x", intervalMinutes: 5, durationMinutes: 30 }],
      ["monitoring", { type: "MONITORING_DONE" }],
      ["monitoring", { type: "REGRESSION" }],
      ["resolved", { type: "REOPEN" }],
      ["triage", { type: "SOURCE_RESOLVED" }],
      ["triage", { type: "IGNORE" }],
    ];

    for (const [stage, event] of validTransitions) {
      const effect = ok(stage, event);
      expect(effect.timeline, `${stage} + ${event.type} should have timeline`).toBeDefined();
      expect(effect.timeline!.title.length).toBeGreaterThan(0);
    }
  });
});

// ── Zod event schema validation ──────────────────────────────────────

describe("issueEventSchema", () => {
  it("rejects TRIAGE_COMPLETE without summary", () => {
    const result = issueEventSchema.safeParse({ type: "TRIAGE_COMPLETE" });
    expect(result.success).toBe(false);
  });

  it("rejects TRIAGE_COMPLETE with empty summary", () => {
    const result = issueEventSchema.safeParse({ type: "TRIAGE_COMPLETE", summary: "" });
    expect(result.success).toBe(false);
  });

  it("accepts TRIAGE_COMPLETE with summary", () => {
    const result = issueEventSchema.safeParse({ type: "TRIAGE_COMPLETE", summary: "Node down" });
    expect(result.success).toBe(true);
  });

  it("rejects PROPOSE_PLAN without plan", () => {
    const result = issueEventSchema.safeParse({ type: "PROPOSE_PLAN" });
    expect(result.success).toBe(false);
  });

  it("accepts PROPOSE_PLAN with plan", () => {
    const result = issueEventSchema.safeParse({ type: "PROPOSE_PLAN", plan: "Restart pod" });
    expect(result.success).toBe(true);
  });

  it("rejects ENTER_MONITORING without required fields", () => {
    expect(issueEventSchema.safeParse({ type: "ENTER_MONITORING" }).success).toBe(false);
    expect(issueEventSchema.safeParse({ type: "ENTER_MONITORING", monitorPlan: "x" }).success).toBe(false);
    expect(issueEventSchema.safeParse({
      type: "ENTER_MONITORING", monitorPlan: "x", intervalMinutes: 5,
    }).success).toBe(false);
  });

  it("accepts ENTER_MONITORING with all required fields", () => {
    const result = issueEventSchema.safeParse({
      type: "ENTER_MONITORING",
      monitorPlan: "Watch CPU",
      intervalMinutes: 5,
      durationMinutes: 30,
    });
    expect(result.success).toBe(true);
  });

  it("accepts events without extra fields", () => {
    for (const type of ["PLAN_APPROVED", "REGRESSION", "SOURCE_RESOLVED", "REOPEN", "IGNORE"] as const) {
      expect(issueEventSchema.safeParse({ type }).success).toBe(true);
    }
  });

  it("rejects unknown event type", () => {
    const result = issueEventSchema.safeParse({ type: "EXPLODE" });
    expect(result.success).toBe(false);
  });
});

// ── InvalidTransitionError ───────────────────────────────────────────

describe("InvalidTransitionError", () => {
  it("carries stage and event info", () => {
    const err = new InvalidTransitionError("triage", "PLAN_APPROVED", "nope");
    expect(err.stage).toBe("triage");
    expect(err.event).toBe("PLAN_APPROVED");
    expect(err.message).toBe("nope");
    expect(err.name).toBe("InvalidTransitionError");
    expect(err).toBeInstanceOf(Error);
  });
});
