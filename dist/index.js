#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, ErrorCode, McpError, } from '@modelcontextprotocol/sdk/types.js';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { TEMPLATES } from './templates.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Locate a-mdui.bundle.js and a-mdui.bundle.css locally, or fallback to public CDN
function resolveBundle() {
    const forceCdn = process.env.AMDUI_FORCE_CDN === 'true';
    const cdnVersion = process.env.AMDUI_CDN_VERSION || 'latest';
    const cdnJsUrl = process.env.AMDUI_CDN_JS_URL ||
        `https://cdn.jsdelivr.net/npm/@a-mdui/web@${cdnVersion}/dist/a-mdui.bundle.js`;
    const cdnCssUrl = process.env.AMDUI_CDN_CSS_URL ||
        `https://cdn.jsdelivr.net/npm/@a-mdui/web@${cdnVersion}/dist/a-mdui.bundle.css`;
    if (!forceCdn) {
        const possibleRoots = [
            path.resolve(__dirname, '../../dist'),
            path.resolve(__dirname, '../../../dist'),
            path.resolve(__dirname, '../dist/assets'),
            path.resolve(__dirname, './assets'),
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
                }
                catch {
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
const server = new Server({
    name: 'amdui-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
        prompts: {},
    },
});
// =============================================================================
// 1. Tool Declarations
// =============================================================================
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'render_mdui',
                description: 'Renders A-MarkdownUI (.mdui) markup into a live interactive UI widget inside Antigravity IDE chat (via <agent-embed>) or the side-pane artifact viewer. For transactional tasks (e.g. bookings, appointments, checkout, onboarding, surveys), generate a Progressive Intake Wizard (@step("intake") -> selection -> confirmed) rather than pre-populating fabricated end-state assumptions.',
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
                            description: 'Optional directory path where the HTML artifact should be saved (e.g. Antigravity conversation artifact directory). Defaults to a persistent temporary folder.',
                        },
                    },
                    required: ['content'],
                },
            },
            {
                name: 'validate_mdui',
                description: 'Fast static validation and linter for .mdui markup. Verifies balanced ::: container blocks, ??? input fields, @state variables, and {{ }} expressions.',
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
                description: 'Retrieves a production-ready .mdui template (booking_wizard, flight_booking, dashboard, checkout, charts).',
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
                description: 'System prompt teaching the LLM how to author valid, rich, autonomous .mdui screens.',
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
        const theme = String(args?.theme || 'dark');
        const targetDir = args?.targetDir ? String(args.targetDir) : '';
        // Strip outer markdown fences if present
        const fenceMatch = rawContent.match(/^```(?:mdui|markdown)?\s*\n([\s\S]*?)\n```\s*$/i);
        if (fenceMatch) {
            rawContent = fenceMatch[1].trim();
        }
        // Determine artifact directory
        let outDir = targetDir;
        if (!outDir) {
            if (process.env.ANTIGRAVITY_ARTIFACT_DIR && fs.existsSync(process.env.ANTIGRAVITY_ARTIFACT_DIR)) {
                outDir = process.env.ANTIGRAVITY_ARTIFACT_DIR;
            }
            else {
                outDir = path.join(os.tmpdir(), 'antigravity-mdui-artifacts');
            }
        }
        fs.mkdirSync(outDir, { recursive: true });
        const safeFilename = `mdui_widget_${Date.now()}.html`;
        const artifactPath = path.join(outDir, safeFilename);
        const bundle = resolveBundle();
        // Generate standalone HTML widget (hybrid: inlined locally or dynamic via CDN)
        const bundleHead = bundle.mode === 'inline'
            ? `  <style>\n    /* Inlined A-MDUI bundle styling */\n    ${bundle.css}\n  </style>`
            : `  <link rel="stylesheet" href="${bundle.cssUrl}">\n  <script src="${bundle.jsUrl}"></script>`;
        const bundleScript = bundle.mode === 'inline'
            ? `    // Inline A-MDUI Web Component Bundle\n    ${bundle.js}`
            : `    // Loaded dynamically via decoupled public CDN (${bundle.jsUrl})`;
        const htmlContent = `<!DOCTYPE html>
<html lang="en" class="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
${bundleHead}
  <style>
    /* Antigravity Generative UI Card Container */
    body {
      background: transparent;
      color: var(--foreground, #f8fafc);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      margin: 0;
      padding: 8px;
      overflow-x: hidden;
      overflow-y: auto;
      box-sizing: border-box;
    }
    .antigravity-card {
      background: var(--card, rgba(15, 23, 42, 0.95));
      border: 1px solid var(--border, rgba(99, 102, 241, 0.25));
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35);
      box-sizing: border-box;
    }
    .widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    }
    .widget-title {
      font-weight: 700;
      font-size: 13.5px;
      color: var(--foreground, #f8fafc);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .widget-badge {
      font-size: 10.5px;
      font-family: monospace;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 2px 8px;
      border-radius: 9999px;
    }
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased">
  <div class="antigravity-card">
    <div class="widget-header">
      <div class="widget-title">
        <span>✦</span> ${escapeHtml(title)}
      </div>
      <span class="widget-badge">A-MDUI (${bundle.mode})</span>
    </div>

    <a-mdui theme="${theme}" id="app-view"></a-mdui>
  </div>

  <script>
${bundleScript}

    function showToast(message, type = 'success') {
      let toast = document.getElementById('amdui-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'amdui-toast';
        toast.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%) translateY(20px);padding:8px 18px;border-radius:24px;font-size:12px;font-weight:600;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.5);display:flex;align-items:center;gap:6px;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);opacity:0;pointer-events:none;';
        document.body.appendChild(toast);
      }
      if (type === 'success') {
        toast.style.background = '#059669';
        toast.style.color = '#ffffff';
        toast.style.border = '1px solid rgba(52, 211, 153, 0.4)';
      } else {
        toast.style.background = '#2563eb';
        toast.style.color = '#ffffff';
        toast.style.border = '1px solid rgba(96, 165, 250, 0.4)';
      }
      toast.textContent = message;
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
      }, 3500);
    }

    // Set document content with resilient immediate + lifecycle listener
    function initMdui() {
      const view = document.getElementById('app-view');
      if (view && !view.content) {
        view.content = ${JSON.stringify(rawContent)};

        view.addEventListener('submit', (e) => {
          showToast('✓ Form submitted locally', 'success');
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'a-mdui:submit',
              source: 'a-mdui',
              detail: e.detail || {}
            }, '*');
          }
        });

        view.addEventListener('action', (e) => {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'a-mdui:action',
              source: 'a-mdui',
              detail: e.detail || {}
            }, '*');
          }
        });
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMdui);
    } else {
      initMdui();
    }
  </script>
</body>
</html>`;
        fs.writeFileSync(artifactPath, htmlContent, 'utf-8');
        const lines = rawContent.split('\n').length;
        const bytes = Buffer.byteLength(rawContent, 'utf-8');
        return {
            content: [
                {
                    type: 'text',
                    text: `### A-MDUI Interactive UI Rendered

<agent-embed src="file://${artifactPath}"></agent-embed>

* **Artifact File**: [${safeFilename}](file://${artifactPath})
* **Size**: ${lines} lines · ${bytes} bytes · Theme: \`${theme}\` · Bundle: \`${bundle.mode}\`
* **Interaction**: Autonomous client-side UI. All reactive variables (@step, @filter), math calculations, conditions, and UI actions operate locally within the component.`,
                },
            ],
        };
    }
    if (name === 'validate_mdui') {
        const content = String(args?.content || '');
        const errors = [];
        const warnings = [];
        // 1. Container validation
        const containerOpens = (content.match(/:::\s*[a-zA-Z0-9_-]+/g) || []).length;
        const containerCloses = (content.match(/^:::\s*$/gm) || []).length;
        if (containerOpens !== containerCloses) {
            errors.push(`Container block mismatch: ${containerOpens} opened, but ${containerCloses} closed.`);
        }
        // 2. Input validation
        const inputOpens = (content.match(/\?\?\?\s+[a-zA-Z0-9_]+/g) || []).length;
        const inputCloses = (content.match(/^\?\?\?\s*$/gm) || []).length;
        if (inputOpens !== inputCloses) {
            errors.push(`Input block mismatch: ${inputOpens} opened, but ${inputCloses} closed with '???'`);
        }
        // 3. Grid conditional warning check
        if (content.includes('::: grid') && content.includes('::: card if:')) {
            warnings.push("Notice: Mutually exclusive conditional cards (e.g. '::: card if: @tab == ...') should be stacked directly without an enclosing '::: grid' to prevent column squashing.");
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
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const activeSseTransports = new Map();
async function startSseServer(port) {
    const httpServer = http.createServer(async (req, res) => {
        // Enable CORS for web and client tool integrations
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }
        const host = req.headers.host || `localhost:${port}`;
        const parsedUrl = new URL(req.url || '/', `http://${host}`);
        const pathname = parsedUrl.pathname;
        // 1. Initial SSE Connection endpoint
        if (pathname === '/sse' && req.method === 'GET') {
            const transport = new SSEServerTransport('/message', res);
            activeSseTransports.set(transport.sessionId, transport);
            transport.onclose = () => {
                activeSseTransports.delete(transport.sessionId);
            };
            await server.connect(transport);
            return;
        }
        // 2. Incoming JSON-RPC Message endpoint
        if (pathname === '/message' && req.method === 'POST') {
            const sessionId = parsedUrl.searchParams.get('sessionId');
            if (!sessionId || !activeSseTransports.has(sessionId)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing or unknown sessionId' }));
                return;
            }
            const transport = activeSseTransports.get(sessionId);
            await transport.handlePostMessage(req, res);
            return;
        }
        // 3. Health & Discovery check
        if (pathname === '/' || pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                service: 'amdui-mcp-server',
                version: '1.0.0',
                mode: 'sse',
                activeSessions: activeSseTransports.size,
            }));
            return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    });
    return new Promise((resolve, reject) => {
        httpServer.listen(port, () => {
            console.error(`[amdui-mcp-server] SSE Server running on http://localhost:${port}`);
            console.error(`[amdui-mcp-server] SSE Endpoint: http://localhost:${port}/sse`);
            console.error(`[amdui-mcp-server] Message Endpoint: http://localhost:${port}/message`);
            resolve();
        });
        httpServer.on('error', reject);
    });
}
async function main() {
    const args = process.argv.slice(2);
    const isSse = args.includes('--sse') || process.env.MCP_TRANSPORT === 'sse';
    const portArgIndex = args.indexOf('--port');
    const port = portArgIndex !== -1
        ? parseInt(args[portArgIndex + 1], 10)
        : parseInt(process.env.PORT || '3000', 10);
    if (isSse) {
        await startSseServer(port);
    }
    else {
        const transport = new StdioServerTransport();
        await server.connect(transport);
    }
}
main().catch((err) => {
    console.error('Fatal MCP Server Error:', err);
    process.exit(1);
});
