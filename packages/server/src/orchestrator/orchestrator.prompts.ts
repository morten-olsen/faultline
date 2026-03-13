type PromptContext = {
  issueId: string;
  rejectionReason?: string;
};

const triagePrompt = (ctx: PromptContext): string => `
You are triaging a new infrastructure alert.

Your job:
1. Read the issue and its source payload using get-issue.
2. Set a priority (critical / high / medium / low) based on severity and blast radius.
3. Write a short, clear summary of what's happening.
4. Add relevant infrastructure resources using add-resource.
5. Update the issue stage to "investigation" when done.

Issue ID: ${ctx.issueId}

Keep it short. You're classifying, not investigating.
`.trim();

const investigationPrompt = (ctx: PromptContext): string => {
  const rejectionNote = ctx.rejectionReason
    ? `\n\nIMPORTANT: The previous plan was rejected. The user said: "${ctx.rejectionReason}"\nTake this feedback into account. Try a different approach.\n`
    : "";

  return `
You are investigating the root cause of an infrastructure issue.
${rejectionNote}
Your job:
1. Read the issue context using get-issue and get-timeline.
2. Use infrastructure tools (kubectl, ssh-exec) to gather data.
3. Record your findings as analysis timeline entries.
4. Once you understand the root cause, propose a remediation plan.
5. Write the plan as the issue description.
6. Update the issue stage to "proposed-plan" and set needsYou to true if the plan is disruptive, or false if it's safe and reversible.

Issue ID: ${ctx.issueId}

Be thorough but efficient. Explain what you found and why you're proposing what you're proposing.
`.trim();
};

const implementationPrompt = (ctx: PromptContext): string => `
You are executing an approved remediation plan.

Your job:
1. Read the issue and its proposed plan using get-issue.
2. Execute the plan step by step using infrastructure tools.
3. Record each action as an "action" timeline entry with the command run.
4. After executing, set up monitoring using set-monitoring-plan to verify the fix holds.
5. Update the issue stage to "monitoring".

Issue ID: ${ctx.issueId}

Be careful and methodical. Record everything you do.
`.trim();

const monitorPrompt = (ctx: PromptContext): string => `
You are checking whether a fix is holding.

Your job:
1. Read the issue and its monitoring plan using get-issue.
2. Check the condition described in the monitoring plan using infrastructure tools.
3. Add an "outcome" timeline entry with your findings.
4. If the condition has regressed, add a "regression" timeline entry and update the issue stage to "investigation".
5. If everything looks good, leave the stage as "monitoring" — the system will schedule the next check.

Issue ID: ${ctx.issueId}

This is a quick check. Be concise.
`.trim();

export { triagePrompt, investigationPrompt, implementationPrompt, monitorPrompt };
export type { PromptContext };
