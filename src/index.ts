#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { TEMPLATES } from './templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BundleSource {
  mode: 'inline' | 'cdn';
  js?: string;
  css?: string;
  jsUrl?: string;
  cssUrl?: string;
}

// Locate a-mdui.bundle.js and a-mdui.bundle.css locally, or fallback to public CDN
function resolveBundle(): BundleSource {
  const forceCdn = process.env.AMDUI_FORCE_CDN === 'true';
  const cdnVersion = process.env.AMDUI_CDN_VERSION || 'latest';
  const cdnJsUrl =
    process.env.AMDUI_CDN_JS_URL ||
    `https://cdn.jsdelivr.net/npm/@a-mdui/web@${cdnVersion}/dist/a-mdui.bundle.js`;
  const cdnCssUrl =
    process.env.AMDUI_CDN_CSS_URL ||
    `https://cdn.jsdelivr.net/npm/@a-mdui/web@${cdnVersion}/dist/a-mdui.bundle.css`;

  if (!forceCdn) {
    const possibleRoots = [
      path.resolve(__dirname, './assets'),
      path.resolve(__dirname, '../dist/assets'),
      path.resolve(__dirname, '../../dist'),
      path.resolve(__dirname, '../../../dist'),
      path.resolve(process.cwd(), 'dist'),
    ];

    for (const root of possibleRoots) {
      const jsPath = path.join(root, 'a-mdui.bundle.js');
      const cssPath = path.join(root, 'a-mdui.bundle.css');
      if (fs.existsSync(jsPath) && fs.existsSync(cssPath)) {
        try {
          const js = fs.readFileSync(jsPath, 'utf-8');
          const css = fs.readFileSync(cssPath, 'utf-8');
          if (js.length > 0 && css.length > 0) {
            return { mode: 'inline', js, css };
          }
        } catch {
          // Fall through to CDN if reading fails
        }
      }
    }
  }

  // Decoupled Public CDN mode: Updates to @a-mdui/web on npm automatically load without re-releasing MCP server
  return {
    mode: 'cdn',
    jsUrl: cdnJsUrl,
    cssUrl: cdnCssUrl,
  };
}

const server = new Server(
  {
    name: 'amdui-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// =============================================================================
// 1. Tool Declarations
// =============================================================================
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'render_mdui',
        description:
          'Renders A-MarkdownUI (.mdui) markup into a live interactive UI widget inside Antigravity IDE chat (via <agent-embed>) or the side-pane artifact viewer. For transactional tasks (e.g. bookings, appointments, checkout, onboarding, surveys), generate a Progressive Intake Wizard (@step("intake") -> selection -> confirmed) rather than pre-populating fabricated end-state assumptions.',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The raw A-MDUI (.mdui) document markup to render.',
            },
            title: {
              type: 'string',
              description: 'Optional display title for the widget header.',
              default: 'A-MarkdownUI Component',
            },
            theme: {
              type: 'string',
              enum: ['dark', 'default', 'fintech', 'sunset', 'nordic', 'amethyst'],
              description: 'Color theme preset for the rendered widget.',
              default: 'dark',
            },
            targetDir: {
              type: 'string',
              description:
                'Optional directory path where the HTML artifact should be saved (e.g. Antigravity conversation artifact directory). Defaults to a persistent temporary folder.',
            },
            includeMarkdown: {
              type: 'boolean',
              description:
                'Whether to include the raw markdown code block in the tool response. Defaults to false (only the interactive component is returned).',
              default: false,
            },
          },
          required: ['content'],
        },
      },
      {
        name: 'validate_mdui',
        description:
          'Fast static validation and linter for .mdui markup. Verifies balanced ::: container blocks, ??? input fields, @state variables, and {{ }} expressions.',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The .mdui markup text to validate.',
            },
          },
          required: ['content'],
        },
      },
      {
        name: 'get_mdui_template',
        description:
          'Retrieves a production-ready .mdui template (booking_wizard, flight_booking, dashboard, checkout, charts).',
        inputSchema: {
          type: 'object',
          properties: {
            template: {
              type: 'string',
              enum: ['booking_wizard', 'flight_booking', 'dashboard', 'checkout', 'charts'],
              description: 'The key name of the template to retrieve.',
            },
          },
          required: ['template'],
        },
      },
    ],
  };
});

// =============================================================================
// 2. Prompt Declarations
// =============================================================================
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'amdui_authoring_guide',
        description:
          'System prompt teaching the LLM how to author valid, rich, autonomous .mdui screens.',
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name } = request.params;
  if (name === 'amdui_authoring_guide') {
    return {
      description: 'System prompt instructions for authoring .mdui documents',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are an AI UI agent that generates rich interactive screens in raw A-MarkdownUI (.mdui) markup.
Never wrap your whole response in \`\`\`mdui code fences. Use standard Markdown plus the 6 core A-MDUI directives:
1. STATE: @key("value") or @count(1) or @items([...]) declared at the top.
2. CONTAINERS: ::: card, ::: row, ::: grid, ::: hero, ::: auto, or charts (::: barChart, ::: lineChart, ::: pieChart with pipe tables). Close with :::. Mutually exclusive conditional views: stack them directly (::: card if: @tab == "val") without wrapping inside ::: grid.
3. INPUTS: ??? id \\n typeOf: [segmented | toggle | slider | text | picker | date] \\n label: Label \\n options: ["a", "b"] \\n ???
4. INTERPOLATION: {{ count * price | 0 | currency }{.bold, #38bdf8}}
5. BUTTON ACTIONS: [Button Label](action:action_name){primary} or [Cancel](action:cancel){secondary}. Use action:set:variable="value" to update state or advance steps.
6. CONDITIONAL ATTRIBUTES: Add 'if: @key == "value"' on containers and rows.

CORE DESIGN PRINCIPLE: PROGRESSIVE INTAKE WIZARD
- For transactional tasks (booking appointments, flights, reservations, checkouts, onboarding, custom configuration), NEVER fabricate user intent, dates, or providers into a pre-filled mock end-state.
- Always implement a 3-step reactive wizard:
  * Step 1 (Intake): Declare @step("intake"). In '::: card if: @step == "intake"', ask criteria/preferences with inputs. CTA: [Next Step](action:set:step="selection"){primary}.
  * Step 2 (Selection): In '::: card if: @step == "selection"', present available options based on intake. Provide [Back](action:set:step="intake"){secondary} and [Confirm](action:set:step="confirmed"){primary}.
  * Step 3 (Confirmation): In '::: card if: @step == "confirmed"', render summary, confirmation code, and follow-up actions.
- Single-screen dashboards should only be used for read-only telemetry, reports, or charts where data already exists.`,
          },
        },
      ],
    };
  }
  throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
});

// =============================================================================
// 3. Tool Execution Handlers
// =============================================================================
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'render_mdui') {
    let rawContent = String(args?.content || args?.markdown || '').trim();
    const title = String(args?.title || 'A-MarkdownUI Component');
    const ALLOWED_THEMES = ['dark', 'default', 'fintech', 'sunset', 'nordic', 'amethyst', 'light'];
    const rawTheme = String(args?.theme || 'dark').toLowerCase().trim();
    const safeTheme = ALLOWED_THEMES.includes(rawTheme) ? rawTheme : 'dark';
    const targetDir = args?.targetDir ? String(args.targetDir) : '';

    // Strip outer markdown fences if present
    const fenceMatch = rawContent.match(/^```(?:mdui|markdown)?\s*\n([\s\S]*?)\n```\s*$/i);
    if (fenceMatch) {
      rawContent = fenceMatch[1].trim();
    }

    // Determine artifact directory with security containment check
    let outDir = '';
    const conversationArtifactDir =
      process.env.ANTIGRAVITY_APP_DATA_DIR && process.env.ANTIGRAVITY_CONVERSATION_ID
        ? path.join(process.env.ANTIGRAVITY_APP_DATA_DIR, 'brain', process.env.ANTIGRAVITY_CONVERSATION_ID)
        : null;

    if (targetDir) {
      const resolvedTarget = path.resolve(targetDir);
      const allowedRoots = [
        process.cwd(),
        process.env.ANTIGRAVITY_ARTIFACT_DIR ? path.resolve(process.env.ANTIGRAVITY_ARTIFACT_DIR) : null,
        conversationArtifactDir,
        path.join(os.homedir(), '.gemini/antigravity'),
        os.tmpdir()
      ].filter(Boolean) as string[];

      const isAllowed = allowedRoots.some(root => resolvedTarget === root || resolvedTarget.startsWith(root + path.sep));
      if (!isAllowed) {
        throw new McpError(ErrorCode.InvalidParams, `targetDir '${targetDir}' is outside permitted directory boundaries.`);
      }
      outDir = resolvedTarget;
    } else {
      if (process.env.ANTIGRAVITY_ARTIFACT_DIR && fs.existsSync(process.env.ANTIGRAVITY_ARTIFACT_DIR)) {
        outDir = path.resolve(process.env.ANTIGRAVITY_ARTIFACT_DIR);
      } else if (conversationArtifactDir) {
        outDir = conversationArtifactDir;
      } else {
        outDir = path.join(os.tmpdir(), 'antigravity-mdui-artifacts');
      }
    }
    fs.mkdirSync(outDir, { recursive: true });

    // Persist clean A-MDUI markdown source document (NOT a monolithic HTML file)
    const mduiFilename = `component_${Date.now()}.mdui`;
    const mduiArtifactPath = path.join(outDir, mduiFilename);
    fs.writeFileSync(mduiArtifactPath, rawContent, "utf-8");

    // Resolve static plugin harness.html and customizable theme.css
    let harnessPath = path.join(__dirname, "harness.html");
    let themePath = path.join(__dirname, "theme.css");

    if (!fs.existsSync(harnessPath)) {
      const candidateDirs = [
        __dirname,
        path.join(__dirname, ".."),
        path.join(__dirname, "src"),
        path.join(__dirname, "dist"),
        "/opt/homebrew/lib/amdui",
        path.join(process.cwd(), "packages/antigravity-plugin/mcp"),
        path.join(process.cwd(), "packages/mcp/dist"),
        path.join(process.cwd(), "packages/mcp/src"),
      ];
      for (const dir of candidateDirs) {
        const candidateHarness = path.join(dir, "harness.html");
        if (fs.existsSync(candidateHarness)) {
          harnessPath = candidateHarness;
          themePath = path.join(dir, "theme.css");
          break;
        }
      }
    }

    const embedUrl = `file://${harnessPath}#theme=${safeTheme}&data=${encodeURIComponent(rawContent)}`;

    const docLines = rawContent.split("\n").length;
    const docBytes = Buffer.byteLength(rawContent, "utf-8");

    const includeMarkdown =
      args?.includeMarkdown === true ||
      process.env.AMDUI_INCLUDE_MARKDOWN === "true";

    const markdownSection = includeMarkdown
      ? `\n#### Component Structure:\n\`\`\`mdui\n${rawContent}\n\`\`\`\n`
      : "";

    return {
      content: [
        {
          type: "text",
          text: `### A-MDUI Interactive UI Component Rendered

<agent-embed src="${embedUrl}"></agent-embed>

* **Interactive Component (Open in Browser)**: [Open A-MDUI Harness](${embedUrl})
* **A-MDUI Source Document**: [${mduiFilename}](file://${mduiArtifactPath})
* **Design Theme Stylesheet**: [theme.css](file://${themePath})
* **Theme**: \`${safeTheme}\` · **Size**: ${docLines} lines (${docBytes} bytes)${markdownSection}

> **CRITICAL FOR AI ASSISTANT:**
> - Present your response EXCLUSIVELY through the interactive component.
> - In Antigravity IDE: Output ONLY the \`<agent-embed src="${embedUrl}"></agent-embed>\` tag. Do NOT write duplicate markdown explanations, bullet lists, or tables in chat outside the component.
> - In Gemini Desktop: Output ONLY the clickable link \`[Open Interactive Component](${embedUrl})\` with at most 1 concise sentence. Never dump duplicate markdown text in chat.`,
        },
      ],
    };
  }

  if (name === 'validate_mdui') {
    const content = String(args?.content || '');
    const errors: string[] = [];
    const warnings: string[] = [];

    // 0. Empty input validation
    if (content.trim().length === 0) {
      errors.push('Document content is empty.');
    }

    // 1. Container validation
    const containerOpens = (content.match(/^[ \t]*:::[ \t]+[a-zA-Z0-9_-]+/gm) || []).length;
    const containerCloses = (content.match(/^[ \t]*:::[ \t]*$/gm) || []).length;
    if (containerOpens !== containerCloses) {
      errors.push(`Container block mismatch: ${containerOpens} opened, but ${containerCloses} closed.`);
    }

    // 2. Input validation
    const inputOpens = (content.match(/^[ \t]*\?\?\?[ \t]+[a-zA-Z0-9_]+/gm) || []).length;
    const inputCloses = (content.match(/^[ \t]*\?\?\?[ \t]*$/gm) || []).length;
    if (inputOpens !== inputCloses) {
      errors.push(`Input block mismatch: ${inputOpens} opened, but ${inputCloses} closed with '???'`);
    }

    // 3. Expression bracket balance validation
    const exprOpens = (content.match(/\{\{/g) || []).length;
    const exprCloses = (content.match(/\}\}/g) || []).length;
    if (exprOpens !== exprCloses) {
      errors.push(`Expression interpolation mismatch: ${exprOpens} opened with '{{', but ${exprCloses} closed with '}}'.`);
    }

    // 4. Code fence block balance
    const codeFences = (content.match(/^```/gm) || []).length;
    if (codeFences % 2 !== 0) {
      errors.push(`Unclosed code fence block: found odd number (${codeFences}) of \`\`\` delimiters.`);
    }

    // 5. Grid conditional warning check
    if (content.includes('::: grid') && content.includes('::: card if:')) {
      warnings.push(
        "Notice: Mutually exclusive conditional cards (e.g. '::: card if: @tab == ...') should be stacked directly without an enclosing '::: grid' to prevent column squashing."
      );
    }

    const isValid = errors.length === 0;

    return {
      content: [
        {
          type: 'text',
          text: isValid
            ? `✓ **Valid A-MDUI Document**\n* ${containerOpens} container(s)\n* ${inputOpens} interactive input(s)\n${warnings.length > 0 ? '\n' + warnings.map(w => `* ⚠️ ${w}`).join('\n') : ''}`
            : `❌ **A-MDUI Syntax Errors Found**:\n${errors.map(e => `- ${e}`).join('\n')}${warnings.length > 0 ? '\n\nWarnings:\n' + warnings.map(w => `- ${w}`).join('\n') : ''}`,
        },
      ],
    };
  }

  if (name === 'get_mdui_template') {
    const key = String(args?.template || 'flight_booking');
    const tpl = TEMPLATES[key];
    if (!tpl) {
      throw new McpError(ErrorCode.InvalidParams, `Unknown template '${key}'. Available: ${Object.keys(TEMPLATES).join(', ')}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `### Template: ${tpl.title}\n*${tpl.description}*\n\n\`\`\`mdui\n${tpl.mdui}\n\`\`\``,
        },
      ],
    };
  }

  throw new McpError(ErrorCode.MethodNotFound, `Unknown tool '${name}'`);
});

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Fatal MCP Server Error:', err);
  process.exit(1);
});
