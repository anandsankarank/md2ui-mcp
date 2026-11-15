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

    const safeFilename = `mdui_widget_${Date.now()}.html`;
    const artifactPath = path.join(outDir, safeFilename);

    const bundle = resolveBundle();

    // Generate standalone HTML widget (hybrid: inlined locally or dynamic via CDN)
    const bundleHead =
      bundle.mode === 'inline'
        ? `  <style>\n    /* Inlined A-MDUI bundle styling */\n    ${bundle.css}\n  </style>`
        : `  <link rel="stylesheet" href="${bundle.cssUrl}">\n  <script src="${bundle.jsUrl}"></script>`;

    const bundleScript =
      bundle.mode === 'inline'
        ? `    // Inline A-MDUI Web Component Bundle\n    ${bundle.js}`
        : `    // Loaded dynamically via decoupled public CDN (${bundle.jsUrl})`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en" class="${safeTheme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
${bundleHead}
  <style>
    /* Antigravity Generative UI - Flush Layout with Auto-Height & Selectable Text */
    html, body {
      background: transparent;
      color: var(--foreground, #f8fafc);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      overflow-y: visible;
      box-sizing: border-box;
      width: 100%;
      -webkit-user-select: text !important;
      user-select: text !important;
    }
    .antigravity-card {
      position: relative;
      background: transparent;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      width: 100%;
    }
    .antigravity-card, a-mdui, .mdui-root,
    p, span, h1, h2, h3, h4, h5, h6, table, thead, tbody, tr, td, th,
    li, ol, ul, blockquote, div, code, pre, section, article {
      -webkit-user-select: text !important;
      user-select: text !important;
    }
    ::selection {
      background: rgba(56, 189, 248, 0.35);
      color: inherit;
    }
    .mdui-widget-toolbar {
      position: absolute;
      top: 10px;
      right: 12px;
      z-index: 50;
      display: flex;
      align-items: center;
      gap: 6px;
      opacity: 0.75;
      transition: opacity 0.2s ease;
    }
    .antigravity-card:hover .mdui-widget-toolbar {
      opacity: 1;
    }
    .mdui-toolbar-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(24, 24, 27, 0.78);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(148, 163, 184, 0.25);
      color: #e2e8f0;
      border-radius: 6px;
      padding: 4px 9px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      line-height: 1.2;
      transition: all 0.15s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
    }
    .mdui-toolbar-btn:hover {
      background: rgba(39, 39, 42, 0.95);
      border-color: rgba(56, 189, 248, 0.5);
      color: #38bdf8;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    .mdui-toolbar-btn.copied {
      background: rgba(5, 150, 105, 0.85);
      border-color: rgba(52, 211, 153, 0.7);
      color: #ffffff;
    }
    .mdui-selection-bubble {
      position: fixed;
      z-index: 99999;
      transform: translate(-50%, -100%);
      margin-top: -8px;
      background: #18181b;
      border: 1px solid rgba(56, 189, 248, 0.4);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      border-radius: 6px;
      padding: 2px;
    }
    .mdui-selection-bubble button {
      background: transparent;
      border: none;
      color: #38bdf8;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border-radius: 4px;
    }
    .mdui-selection-bubble button:hover {
      background: rgba(56, 189, 248, 0.15);
    }
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased">
  <div class="antigravity-card">
    <div class="mdui-widget-toolbar" id="mdui-toolbar">
      <button type="button" id="copy-btn" class="mdui-toolbar-btn" title="Copy content or selection to clipboard" aria-label="Copy content">
        <svg class="copy-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span class="btn-text">Copy</span>
      </button>
    </div>
    <div id="selection-bubble" class="mdui-selection-bubble" style="display:none;">
      <button type="button" id="bubble-copy-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Copy Selection
      </button>
    </div>
    <a-mdui theme="${safeTheme}" id="app-view"></a-mdui>
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
            const targetOrigin = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : '*';
            window.parent.postMessage({
              type: 'a-mdui:submit',
              source: 'a-mdui',
              detail: e.detail || {}
            }, targetOrigin);
          }
        });

        view.addEventListener('action', (e) => {
          if (window.parent && window.parent !== window) {
            const targetOrigin = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : '*';
            window.parent.postMessage({
              type: 'a-mdui:action',
              source: 'a-mdui',
              detail: e.detail || {}
            }, targetOrigin);
          }
        });

        // Dynamic auto-resize to fit container without internal scrollbars
        function notifyHeight() {
          const h = Math.ceil(document.documentElement.scrollHeight || document.body.scrollHeight || 100);
          if (window.parent && window.parent !== window) {
            const targetOrigin = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : '*';
            window.parent.postMessage({ type: 'resize', height: h }, targetOrigin);
            window.parent.postMessage({ type: 'antigravity:resize', height: h }, targetOrigin);
          }
        }
        if (typeof ResizeObserver !== 'undefined') {
          const ro = new ResizeObserver(() => notifyHeight());
          ro.observe(document.body);
          ro.observe(view);
        }
        window.addEventListener('load', notifyHeight);
        setTimeout(notifyHeight, 100);
        setTimeout(notifyHeight, 500);

        // Clipboard copying helper with scroll-neutral fallback
        const rawContentStr = ${JSON.stringify(rawContent)};
        async function copyText(text) {
          if (!text) return false;
          if (navigator.clipboard) {
            try {
              await navigator.clipboard.writeText(text);
              return true;
            } catch (_) {}
          }
          // Prevent screen scroll jump by anchoring fallback element to current viewport coordinates
          const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
          const scrollX = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.top = scrollY + "px";
          ta.style.left = scrollX + "px";
          ta.style.width = '1px';
          ta.style.height = '1px';
          ta.style.padding = '0';
          ta.style.border = 'none';
          ta.style.outline = 'none';
          ta.style.background = 'transparent';
          ta.style.opacity = '0.01';
          ta.style.pointerEvents = 'none';
          document.body.appendChild(ta);
          ta.focus({ preventScroll: true });
          ta.select();
          let ok = false;
          try {
            ok = document.execCommand('copy');
          } catch (_) {}
          document.body.removeChild(ta);
          if (window.scrollY !== scrollY || window.scrollX !== scrollX) {
            window.scrollTo(scrollX, scrollY);
          }
          return ok;
        }

        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', async () => {
            const sel = window.getSelection();
            const selText = sel ? sel.toString().trim() : '';
            const textToCopy = selText || rawContentStr;
            const success = await copyText(textToCopy);
            if (success) {
              const btnText = copyBtn.querySelector('.btn-text');
              const orig = btnText ? btnText.textContent : 'Copy';
              copyBtn.classList.add('copied');
              if (btnText) btnText.textContent = selText ? 'Selection Copied!' : 'Copied!';
              showToast(selText ? '✓ Selection copied to clipboard' : '✓ Full content copied to clipboard', 'success');
              setTimeout(() => {
                copyBtn.classList.remove('copied');
                if (btnText) btnText.textContent = orig;
              }, 2000);
            } else {
              showToast('Failed to copy to clipboard', 'info');
            }
          });
        }

        // Native copy event handler (preserves scroll position and handles Cmd+C / Ctrl+C without layout shifts)
        document.addEventListener('copy', (e) => {
          const sel = window.getSelection();
          const selText = sel ? sel.toString() : '';
          if (selText && e.clipboardData) {
            e.clipboardData.setData('text/plain', selText);
            showToast('✓ Text copied to clipboard', 'success');
          }
        });

        // Capture-phase keyboard shortcut interceptor for Cmd+C (macOS) and Ctrl+C (Windows/Linux)
        // Stops Electron/VSCode parent IDE from swallowing shortcut while copying active DOM selection in-place
        window.addEventListener('keydown', (e) => {
          if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'C')) {
            const sel = window.getSelection();
            const selText = sel ? sel.toString() : '';
            if (selText) {
              e.stopPropagation();
              let copied = false;
              try {
                copied = document.execCommand('copy');
              } catch (_) {}
              if (!copied && navigator.clipboard) {
                navigator.clipboard.writeText(selText).then(() => {
                  showToast('✓ Text copied to clipboard', 'success');
                }).catch(() => {});
                return;
              }
              if (copied) {
                showToast('✓ Text copied to clipboard', 'success');
              }
            }
          }
        }, true);

        // Floating quick-copy bubble for selected text
        const bubble = document.getElementById('selection-bubble');
        const bubbleCopyBtn = document.getElementById('bubble-copy-btn');
        document.addEventListener('mouseup', (e) => {
          setTimeout(() => {
            const sel = window.getSelection();
            const text = sel ? sel.toString().trim() : '';
            if (text && bubble && !bubble.contains(e.target)) {
              try {
                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  bubble.style.top = Math.max(10, rect.top) + 'px';
                  bubble.style.left = Math.min(window.innerWidth - 70, Math.max(60, rect.left + rect.width / 2)) + 'px';
                  bubble.style.display = 'block';
                }
              } catch (_) {
                if (bubble) bubble.style.display = 'none';
              }
            } else if (bubble && !bubble.contains(e.target)) {
              bubble.style.display = 'none';
            }
          }, 30);
        });
        if (bubbleCopyBtn) {
          bubbleCopyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const sel = window.getSelection();
            const text = sel ? sel.toString().trim() : '';
            if (text) {
              await copyText(text);
              showToast('✓ Text copied to clipboard', 'success');
            }
            if (bubble) bubble.style.display = 'none';
          });
        }
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
* **Size**: ${lines} lines · ${bytes} bytes · Theme: \`${safeTheme}\` · Bundle: \`${bundle.mode}\`
* **Interaction**: Autonomous client-side UI. All reactive variables (@step, @filter), math calculations, conditions, and UI actions operate locally within the component.

> **CRITICAL FOR AGENT:** You MUST include the following line directly in your visible assistant message response so the user sees the rendered component:
> <agent-embed src="file://${artifactPath}"></agent-embed>`,
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
