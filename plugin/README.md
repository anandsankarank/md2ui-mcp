# A-MarkdownUI (MDUI) Plugin for Antigravity

Render live, interactive generative UI components and dashboards directly inside Antigravity IDE chat and side-pane artifacts using succinct Markdown.

## Features

- **Reactive State & Forms:** Declare reactive variables (`@tab("overview")`) and interactive inputs (`??? input`) in Markdown.
- **Data Visualizations & Charts:** Render interactive SVG bar charts, line charts, and donut charts driven directly by Markdown pipe tables (`::: barChart`, `::: lineChart`, `::: pieChart`).
- **Autonomous Web Component:** Powered by `@a-mdui/web` with zero runtime frontend frameworks required.
- **Fast End-to-End Latency:** 3x–5x faster LLM generation compared to writing raw boilerplate HTML and JavaScript.

## Included Components

- **MCP Server (`amdui`):**
  - `render_mdui`: Compiles and renders `.mdui` markup into a live interactive `<agent-embed>` widget.
  - `validate_mdui`: Instant static linter and AST validator.
  - `get_mdui_template`: Production-ready templates (dashboards, ticket booking, checkout, charts).
- **Skill (`amdui`):** Autonomous generative UI authoring instructions for Antigravity coding agents.

## Usage

Ask Antigravity in chat:
- *"Build an interactive SLA & performance metrics dashboard"*
- *"Show an election results tracker with chamber filters"*
- *"Create an interactive flight ticket booking card"*

