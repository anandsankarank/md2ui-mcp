---
name: amdui
description: How to render interactive, autonomous A-MarkdownUI (.mdui) generative UI components and widgets inside Antigravity IDE chat and side-pane artifacts using the amdui MCP server.
---

# A-MarkdownUI (.mdui) Generative UI Guide

Use the `render_mdui` tool provided by the `amdui` MCP server whenever the user asks for interactive forms, dashboards, checkout flows, telemetry visualizers, survey wizards, or flight/ticket booking cards.

## Workflow

1. Generate standard Markdown enhanced with A-MDUI directives:
   - **Reactive State**: `@variableName("initialValue")` at the top of the document.
   - **Containers**: `::: card`, `::: row`, `::: grid`, `::: hero`, `::: auto`, or pipe-table charts (`::: barChart`, `::: lineChart`, `::: pieChart`). Always close each with `:::`.
   - **Conditional Views**: Stack mutually exclusive views directly (e.g. `::: card if: @tab == "profile"`) without wrapping inside `::: grid`.
   - **Form Controls**:
     ```
     ??? id
     typeOf: [segmented | toggle | slider | text | picker | date]
     label: Label
     options: ["Option 1", "Option 2"]
     ???
     ```
   - **Expressions**: `{{ variable * multiplier | 0 | currency }{.bold, #38bdf8}}`
   - **Semantic Actions**: `[Action Button](action:action_name){primary}` or `[Cancel](action:cancel){secondary}`

2. Call the `render_mdui` tool:
   - Pass `content: "<mdui markup>"`, `title: "<Component Title>"`, and `theme: "dark"`.

3. The tool generates an Antigravity-compliant HTML artifact and returns:
   ```html
   <agent-embed src="file:///<artifact-path>"></agent-embed>
   ```
   Antigravity will render the live, interactive UI directly in the conversation chat.

