# Design Principles

Faultline is a team of capable colleagues who handle your infrastructure so you don't have to. The interface is how they keep you in the loop.

## Core Philosophy

**Automatic by default, never a loss of control.**

Think of Faultline like a self-managing issue tracker — imagine Linear, but the issues are raised, triaged, and resolved by a team of agentic colleagues. Most of the time the board is empty because everything was handled before you looked. When something *is* open, you can see exactly what's happening, who's working on it, and why. You can step in at any point, but you almost never need to.

The user isn't an operator staring at a control panel. They're a person who checks in, sees that things are handled, and goes on with their day.

### The Issue Lifecycle

Every issue flows through a pipeline:

```
Triage → Investigation → Proposed Plan → Implementation → Monitoring → Resolved
                                                             ↑            |
                                                             └────────────┘
                                                               (regression)
```

- **Triage** — the system has detected something and is assessing severity
- **Investigation** — analyzing root cause, gathering context
- **Proposed Plan** — the system has a plan and may need approval before proceeding
- **Implementation** — actively executing the fix
- **Monitoring** — fix applied, watching to confirm it holds
- **Resolved** — confirmed fixed, moves to the log

At any stage, the system may need human involvement — input during investigation, approval for a proposed plan, physical action like swapping a disk. When this happens, the issue is flagged **"Needs you"** at whatever stage it's in. This isn't a separate state — it's a signal layered on top of the current stage, making it clear that the pipeline is blocked until the user acts.

Issues can **regress**: a monitored issue that resurfaces goes back into the pipeline (back to Investigation), flowing through again. The system doesn't pretend a problem is solved when it isn't.

## Principles

### 1. Calm Over Urgent

Not every event demands attention. The interface should absorb complexity and surface only what matters. Default to quiet. Escalate through subtlety — a color shift, a gentle animation — before resorting to anything loud. Notifications are a last resort, not a first instinct.

- Healthy state should feel like stillness, not absence
- Problems surface gradually: ambient → visible → prominent → actionable
- Never interrupt unless human attention is genuinely required

### 2. Show the Machine Thinking

Automation should not feel like a black box. When the system acts, the user sees it — not as noise, but as a steady, readable stream of decisions. Transparency builds trust. The user should understand *what* happened, *why* it happened, and *what would have happened* if the system hadn't intervened.

- Every automated action has a visible trace
- Decisions are explainable in plain language
- History is always accessible, never buried

### 3. A Checkmark Over a Chart

If a checkmark can tell the story, don't build an infographic. The healthy state is a feeling — not a grid of numbers. Complexity exists for the curious, never as the default. Data density is something the user opts into, not something forced upon them.

- Start with the simplest possible signal: is it okay, yes or no?
- Metrics, graphs, and breakdowns are exploration — one layer deeper
- Every element earns its place; if it doesn't inform a decision, it doesn't belong
- Whitespace is not emptiness — it is calm

### 4. The Pipeline Is the Interface

The home view mirrors the issue lifecycle directly. Issues flow visually through **Triage → Investigation → Proposed Plan → Implementation → Monitoring → Resolved**, and the user sees the pipeline at a glance. "Needs you" items float to the top — everything else is the system showing its work.

- A glance answers: "Is anything blocked on me?"
- Issues that don't need the user are visible but calm — transparency, not obligation
- Resolved issues are a quiet log — proof the system works, building trust over time
- Detail lives one click deeper: each issue card expands into the full story
- Regressions are honest — a monitored issue that resurfaces reappears in the pipeline, not hidden

### 5. Assign, Don't Alarm

When the system needs a human, it doesn't sound an alarm — it assigns. "Needs you" is a flag layered on whatever stage the issue is in: the system might need approval before applying a proposed plan (Proposed Plan), need input to decide how to investigate (Triage), or need physical action like a disk swap (Implementation). The flag is unmistakable but respectful — a colleague asking for help, not a siren.

- The system only flags when it genuinely can't proceed without a human
- The flag explains *what* the user needs to do and *why* the system is blocked
- Once the user acts, the system picks back up — the pipeline resumes automatically
- Human involvement can be lightweight: an approval, a decision, a physical action
- **"Needs you" is not an error.** Asking the user to approve a fix is not the same as something failing. The visual treatment must reflect this — warm and inviting, not red and alarming. Red is reserved for genuine failures where something is broken and degrading. An approval request is amber at most: a gentle hand-raise, not a fire alarm. If the design makes the user feel anxious when all the system needs is a "yes", the design is wrong.

### 6. Always in Your Pocket

Peace of mind requires availability. The interface must work as well on a phone in the metro as it does on a desktop at home. Not "responsive" in the CSS sense — *designed for the glance*. The commuter who pulls out their phone between stops gets the same instant clarity as someone sitting at a desk. One viewport, one answer.

- Every state fits in a single mobile viewport without scrolling
- Touch targets are generous — approvals and actions work with a thumb
- No layout depends on width — the experience is the same, not a degraded version
- If it takes more than 3 seconds to know "am I good?", the design has failed

### 7. Motion as Storytelling

Things don't just appear — they enter. And when they leave, they exit. Motion is not decoration; it is narrative. A card that fades up from below *arrives*. A row that staggers in after its siblings tells the user "there's a sequence here." A needs-you card that settles into view with a gentle pause says "this is important, but not urgent."

Motion guides the eye. It establishes hierarchy (the status line lands first, then the rest follows), signals relationships (timeline entries cascade chronologically), and creates continuity between states. Without motion, every page load feels like a jump cut. With it, the interface *breathes*.

- **Enter, don't snap.** Every element that appears should have a moment — a subtle fade, a short slide. Not enough to slow the user down, enough to feel intentional.
- **Stagger to show structure.** When multiple elements appear, cascade them with short delays. The user's eye follows the rhythm and absorbs the hierarchy.
- **Keep it quiet.** Duration is 200–400ms. Easing is gentle (`easeOut`). Movement distance is small (8–12px). Nothing bounces, nothing overshoots, nothing calls attention to itself. The animation should feel like the content settling, not performing.
- **Exit with the same care.** Removed elements should fade or slide away, not vanish. The user should feel continuity, not disruption.

### 8. Consistency as Kindness

Same patterns, same places, same behaviors. The user should never wonder where something is or how something works. Predictability is not boring — it is respectful of the user's time and attention.

- Components behave identically across contexts
- Spatial relationships are stable — things don't move
- Interactions have consistent feedback

## Visual Language

### Tone

Warm and unhurried. The aesthetic is modern but approachable — closer to a well-designed home app than a mission control screen. Think: a calm morning, not a command center. The user lives with this interface; it should feel like a place they're comfortable in, not a place that demands their vigilance.

### Color

Dark by default, with warm undertones — the interface feels like evening light, not a server room. Color is reserved for meaning:

| Role | Usage |
|---|---|
| **Neutral** | Structure, containers, text — the background hum |
| **Green** | Healthy, resolved, successful |
| **Amber** | Degraded, warning, needs-attention |
| **Red** | Critical, failed, requires action |
| **Blue** | Informational, in-progress, system-acting |
| **Muted** | Unknown, stale, irrelevant |

Avoid using color as the sole differentiator — pair with iconography or text for accessibility.

### Typography

The typesetting is purposeful and precise. Two voices:

- **The interface voice** (Geist) — clean, geometric, built for screens. How the platform speaks to you. Crisp at small sizes, expressive at large ones. This is the trusted system: "Noticed memory pressure — rebalanced a few workloads."
- **The machine voice** (Geist Mono) — for data that comes from the system. Node names, IPs, timestamps. The shift to monospace is a signal: "this is a specific thing you can look up."

Weight carries emotional tone, not just hierarchy. Regular feels conversational. Medium is emphasis. We keep it light — on dark backgrounds, heavy weights feel stressed, the opposite of calm.

### Motion

Animation is storytelling, not decoration (see Principle 7). Every element enters and exits with intent. Duration is fast enough to feel responsive, slow enough to be perceived: 100–200ms for micro-interactions, 200–400ms for entrances and layout shifts. Easing is always gentle — `easeOut` for entrances, `easeIn` for exits. Never bounce, never overshoot. Stagger delays (30–60ms between siblings) reveal hierarchy without slowing the user down. We use [Motion](https://motion.dev) (framer-motion) for orchestrated animations.

### Density

The default view should feel spacious, almost empty — the calm is the point. Detail is available for those who want it, layered naturally behind the summary. The user should never feel crowded, and never feel like they need to parse a wall of data just to know if things are okay.

## Storybook as Storytelling

Our Storybook is not a component catalogue — it is a piece of design in itself. It tells the story of *why* these decisions were made, not just *what* the components look like.

### Principles for our Storybook

- **Every page explains intent.** Token stories don't just show a color swatch — they explain what the color means, when to use it, and why it exists. A reader should understand the design philosophy without ever opening this document.
- **Interactive, not static.** Storybook's controls and variants aren't just for QA — they let a designer or engineer *explore* the decision space. What happens at the edges? How do states combine? The best documentation is the kind you can play with.
- **Designed, not default.** The Storybook itself should reflect the design system it documents. Dark backgrounds, our type scale, our spacing tokens. If the documentation looks generic, it teaches the wrong lessons.
- **Documentation as visual design.** Component pages are showcases, not spec sheets. Instead of markdown tables listing props, we render live components inside styled cards — grids of variants, contextual examples, side-by-side comparisons. The documentation *demonstrates* the design system by using it. Think Uber's Base Web: every page is a piece of design that could stand on its own. No static tables, no bullet-point prop lists — visual proof that the component works.
- **Organized as narrative.** Stories are grouped as chapters: Foundations (the atomic decisions), Components (the building blocks), Patterns (how they compose), and Anti-patterns (what we avoid). A new team member can read it front to back and understand not just the system, but the thinking behind it.
- **Living specification.** The Storybook is the source of truth. If a component looks different in the app than it does in Storybook, the app is wrong.

## Anti-Patterns

These are explicitly avoided:

- **Alert fatigue** — flooding the user with notifications they learn to ignore
- **Dashboard theater** — impressive-looking charts that don't inform decisions
- **Hidden automation** — the system acting without any visible trace
- **Modal hell** — stacking dialogs that block the user from the interface
- **Configuration sprawl** — exposing every knob instead of choosing good defaults
- **Skeleton spam** — loading states that are more disruptive than waiting
