---
name: amdui
description: How to render interactive, autonomous A-MarkdownUI (.mdui) generative UI components and widgets inside Antigravity IDE chat and side-pane artifacts using the amdui MCP server.
---

# A-MarkdownUI (.mdui) Generative UI Guide

Use the `render_mdui` tool provided by the `amdui` MCP server whenever the user asks for interactive forms, dashboards, checkout flows, telemetry visualizers, survey wizards, or flight/ticket booking cards.

## Core Architectural Patterns

Choose the pattern matching the user's intent:

### Pattern A: Progressive Intake Wizard (Mandatory for Action & Transaction Flows)
When the user requests an action or transaction without providing all parameters (e.g. *"book doctor appointment for me"*, *"order groceries"*, *"reserve flight"*, *"configure cloud server"*):
- **NEVER** fabricate user intent, dates, or doctors into a pre-filled mock end-state.
- **ALWAYS** implement a 3-step reactive wizard using `@step("intake")`:
  1. **Step 1: Intake & Criteria Gathering (`::: card if: @step == "intake"`)**
     - Ask the essential questions interactively: specialty/reason, visit type, urgency, or preferred time window using form controls (`segmented`, `picker`, `text`, `date`).
     - Disable navigation until required fields are filled: `[Find Available Providers](action:set:step="selection"){primary, disabled: empty(patientName)}`.
  2. **Step 2: Tailored Option Selection (`::: card if: @step == "selection"`)**
     - Present matching options (doctors, time slots, pricing).
     - **For long option labels (e.g. Doctor names, email addresses), ALWAYS use `style: menu` (select dropdown) or `style: chip` rather than plain horizontal segmented buttons** to prevent text truncation/squashing.
     - Include equal-split navigation: `[← Back](action:set:step="intake"){secondary} = [Confirm Appointment](action:set:step="confirmed"){primary}`.
  3. **Step 3: Confirmation & Next Steps (`::: card if: @step == "confirmed"`)**
     - Display a clean summary card with confirmation code, calendar action (`[Add to Calendar](action:calendar){primary}`), and an option to modify (`[Modify](action:set:step="intake"){secondary}`).

### Pattern B: Telemetry & Analytics Dashboard
Use single-screen layout only for read-only telemetry, historical reports, election results, or pre-existing datasets where all data is known upfront.

---

## Directives Reference

1. **Reactive State**: Declare variables at the top:
   ```markdown
   @step("intake")
   @specialty("Primary Care")
   @provider("Dr. Sarah Jenkins, MD")
   @timeSlot("Tomorrow at 10:00 AM")
   ```
2. **Containers**: `::: card`, `::: row`, `::: grid`, `::: hero`, `::: auto`, or charts (`::: barChart`, `::: lineChart`, `::: pieChart`). Always close with `:::`.
   - *Note on Conditional Views*: Stack mutually exclusive cards directly (e.g. `::: card if: @step == "intake"`) without wrapping them inside `::: grid` to prevent layout collapse.
3. **Form Controls**:
   ```markdown
   ??? provider
   typeOf: segmented
   options: ["Dr. Sarah Jenkins, MD", "Dr. Alex Rivera, DO"]
   label: Healthcare Provider
   ???
   ```
4. **State Transition Buttons**:
   - `[Proceed to Options](action:set:step="selection"){primary}`
   - `[← Back](action:set:step="intake"){secondary}`
   - `[Confirm Booking](action:set:step="confirmed"){primary}`
5. **Expressions & Interpolation**:
   ```markdown
   {{ provider }} or {{ count * price | 0 | currency }{.bold, #38bdf8}}
   ```

---

## Tool Execution Workflow

1. Generate the `.mdui` markup adhering to the Progressive Intake Wizard or Dashboard pattern.
2. Call `render_mdui`:
   - Pass `content: "<mdui markup>"`, `title: "<Component Title>"`, and `theme: "dark"`.
3. The tool generates an Antigravity-compliant HTML artifact and returns the embed code:
   ```html
   <agent-embed src="file:///<artifact-path>"></agent-embed>
   ```
   **CRITICAL REQUIREMENT**: You MUST copy this `<agent-embed src="file://..."></agent-embed>` tag directly into your visible assistant message response so Antigravity renders the live, interactive UI directly in the conversation chat.
4. **Side Pane Preview**: You can also provide the user with a clickable link to inspect the document in A-MDUI Studio:
   ```markdown
   [Open in A-MDUI Studio](http://localhost:4388/)
   ```

## Self-Contained Client-Side UI & Actions

A-MDUI Generative UI components are completely **self-contained and autonomous**:
1. All state transitions, multi-step wizards, filtering, calculations, and input interactions occur entirely within the rendered client-side component using `@state` variables and `action:set:...` triggers.
2. The MCP tool does not attempt to dispatch external HTTP callbacks or push involuntary turns into the agent session.
3. If the agent needs to ask the user a question to make decisions or continue a backend task, it should use Antigravity's native `ask_question` tool or a plain-text prompt.

