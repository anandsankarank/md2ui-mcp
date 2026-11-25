#!/usr/bin/env node

// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from "url";

// src/templates.ts
var TEMPLATES = {
  flight_booking: {
    title: "Flight Booking & Cabin Selection",
    description: "Airline ticket selector with live cabin tiers, add-ons toggle, and price computation.",
    mdui: `@cabin("economy")
@passengers(2)
@loungeAccess(false)
@seatSelection(true)

::: hero
# \u2708\uFE0F Flight SFO \u2192 HND
**Non-stop flight to Tokyo Haneda** \xB7 Departs 11:30 AM \xB7 Boeing 787-9
:::

??? cabin
typeOf: segmented
options: ["economy", "premium", "business", "first"]
label: Select Cabin Class
???

::: card if: @cabin == "economy"
### Economy Main Cabin
Standard seating with complimentary meals and inflight entertainment.
* Seat Pitch: 32"
* Carry-on included
* Total per traveler: **$850**
:::

::: card if: @cabin == "premium"
### Premium Economy
Extra legroom, priority boarding, and premium dining.
* Seat Pitch: 38"
* 2 Checked bags (23kg each)
* Haneda priority security lane
* Total per traveler: **$1,450**
:::

::: card if: @cabin == "business"
### Business Class Suite
Lie-flat seat with sliding privacy door and sommelier service.
* Seat Pitch: 78" (Full Flat Bed)
* SFO Polaris lounge access included
* 2 Checked bags (32kg each)
* Total per traveler: **$3,200**
:::

::: card if: @cabin == "first"
### First Class Sanctuary
Private enclosed bedroom suite with Krug champagne and caviar.
* 43" 4K IFE monitor
* Private VIP escort & apron transfer
* Total per traveler: **$5,800**
:::

::: card
### Add-ons & Passenger Count

??? passengers
typeOf: slider
min: 1
max: 6
step: 1
label: Number of Passengers
???

::: row
??? loungeAccess
typeOf: toggle
label: Priority Lounge Access ($95 / person)
???

??? seatSelection
typeOf: toggle
label: Advance Window/Aisle Seat Selection ($35)
???
:::

:::

[Confirm Itinerary & Proceed](action:confirm_booking){primary} [Change Dates](action:change_dates){secondary}`
  },
  dashboard: {
    title: "Executive Telemetry & SLA Dashboard",
    description: "System health indicators, response time metrics, and cluster latency chart.",
    mdui: `@env("production")
@region("us-east-1")

::: hero
# \u26A1 CloudPulse Global Infrastructure
Real-time fleet health across 18 regional availability zones.
:::

??? region
typeOf: segmented
options: ["us-east-1", "eu-west-1", "ap-northeast-1"]
label: Active Edge Region
???

::: grid
::: card
### Overall Health
## 99.992% {.success}
*(P99 SLA: Met)*
:::

::: card
### API Ingestion
## 1.42 M req/s {.primary}
*(+8.4% vs baseline)*
:::

::: card
### Median Latency
## 18.4 ms {.success}
*(-2.1 ms improvement)*
:::

::: card
### Error Rate
## 0.003% {.success}
*(5xx below 0.01% threshold)*
:::
:::

::: barChart
| Service Tier | P50 (ms) | P99 (ms) |
| :--- | :--- | :--- |
| Auth Gateway | 4.2 | 12.8 |
| GraphQL Mesh | 11.5 | 32.1 |
| Vector Index | 8.9 | 24.3 |
| SQL Replica | 6.1 | 18.7 |
:::

[Trigger Failover Drill](action:failover){secondary} [Export Telemetry JSON](action:export_telemetry){primary}`
  },
  checkout: {
    title: "Retail Shopping Bag & Checkout Flow",
    description: "Multi-step e-commerce checkout with quantity selectors and dynamic discount coupon.",
    mdui: `@shipping("ground")
@couponCode("")
@giftWrap(false)

::: hero
# \u{1F6CD}\uFE0F Express Retail Checkout
Review your cart items and complete payment securely.
:::

::: card
### Order Items

| Item | Qty | Unit Price | Total |
| :--- | :--- | :--- | :--- |
| **Studio Wireless Headphones** | 1 | $199.00 | $199.00 |
| **Braided USB-C Cable (2m)** | 2 | $19.00 | $38.00 |
| **Matte MagSafe Phone Case** | 1 | $49.00 | $49.00 |

::: row
::: card
Subtotal: **$286.00**
Estimated Tax: **$23.60**
:::
::: card
Shipping: **Free Ground**
Estimated Delivery: **3-5 Business Days**
:::
:::
:::

??? shipping
typeOf: segmented
options: ["ground", "express", "overnight"]
label: Shipping Delivery Speed
???

::: row
??? giftWrap
typeOf: toggle
label: Add Premium Gift Packaging ($7.50)
???

??? couponCode
typeOf: text
placeholder: Promo Code (e.g. SAVE20)
label: Promotional Discount
???
:::

[Authorize Apple Pay ($309.60)](action:pay_applepay){primary} [Pay with Credit Card](action:pay_card){secondary}`
  },
  charts: {
    title: "Visual Data Analytics & Charts",
    description: "Showcase of SVG Bar, Line, and Donut charts driven by markdown pipe tables.",
    mdui: `@channel("all")

# \u{1F4CA} Performance Metrics & Revenue Analytics

::: barChart
| Channel | Q1 Revenue | Q2 Revenue |
| :--- | :--- | :--- |
| Organic Search | 142000 | 188000 |
| Direct Traffic | 98000 | 115000 |
| Partner Referrals | 62000 | 89000 |
| Social Campaigns | 44000 | 72000 |
:::

::: lineChart
| Month | Active Users | Paid Subscribers |
| :--- | :--- | :--- |
| Jan | 12000 | 1400 |
| Feb | 14500 | 1750 |
| Mar | 18200 | 2300 |
| Apr | 22400 | 3100 |
| May | 28900 | 4250 |
| Jun | 36500 | 5800 |
:::

::: pieChart
| Plan Tier | Accounts |
| :--- | :--- |
| Free Starter | 5400 |
| Pro Developer | 2800 |
| Team Workspace | 1200 |
| Enterprise Custom | 450 |
:::

[Download CSV Reports](action:download_csv){secondary} [Refresh Analytics Feed](action:refresh){primary}`
  },
  booking_wizard: {
    title: "Progressive Intake Booking Wizard",
    description: "Three-stage intake wizard (criteria intake -> option selection -> confirmation) without pre-fabricated assumptions.",
    mdui: `@step("intake")
@specialty("Primary Care")
@visitType("In-Person")
@provider("Dr. Sarah Jenkins, MD")
@timeSlot("Tomorrow at 10:00 AM")
@patientName("")

::: hero
# \u{1FA7A} HealthConnect Appointment Scheduling
Secure provider scheduling and intake assistant.
:::

::: card if: @step == "intake"
### Step 1 of 3: Consultation Details
Please specify your consultation requirements to view matching providers.

??? specialty
typeOf: segmented
options: ["Primary Care", "Cardiology", "Dermatology", "Pediatrics"]
label: Care Specialty
???

??? visitType
typeOf: segmented
options: ["In-Person", "Telehealth Video"]
label: Consultation Type
???

??? patientName
typeOf: text
required: true
placeholder: Enter Full Legal Name
label: Patient Name *(Required)*
???

[Find Available Providers](action:submit; action:set:step="selection"){primary}
:::

::: card if: @step == "selection"
### Step 2 of 3: Choose Provider & Time Slot
Select an available doctor and appointment time for **{{ specialty }}** ({{ visitType }}).

??? provider
typeOf: segmented
style: menu
options: ["Dr. Sarah Jenkins, MD (Family Medicine)", "Dr. Marcus Patel, MD (Internal Medicine)", "Dr. Emily Chen, DO (Preventive Care)"]
label: Healthcare Provider
???

::: row
??? appointmentDate
typeOf: segmented
options: ["Tomorrow", "Wednesday", "Thursday"]
label: Date
???

??? timeSlot
typeOf: segmented
options: ["10:00 AM", "2:30 PM", "4:15 PM"]
label: Time
???
:::

[\u2190 Back to Details](action:set:step="intake"){secondary} = [Confirm Appointment](action:set:step="confirmed"){primary}
:::

::: card if: @step == "confirmed"
### \u{1F389} Appointment Confirmed!
Your consultation has been reserved in the clinic calendar.

* **Patient**: {{ patientName | "Registered Patient" }}
* **Specialty**: {{ specialty }}
* **Provider**: **{{ provider }}**
* **Time**: **{{ timeSlot }}**
* **Format**: {{ visitType }}
* **Confirmation Code**: \`HC-8942-TX\`

[\u{1F4C5} Add to Google Calendar](https://calendar.google.com/calendar/render?action=TEMPLATE&text=Doctor+Appointment+-+Dr.+Sarah+Jenkins&details=Appointment+for+{{ patientName }}+with+{{ provider }}&location=Austin+Regional+Medical+Center,+Suite+420){primary, target: _blank} = [Modify Appointment](action:set:step="intake"){secondary}
:::`
  }
};

// src/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function resolveBundle() {
  const forceCdn = process.env.AMDUI_FORCE_CDN === "true";
  const cdnVersion = process.env.AMDUI_CDN_VERSION || "latest";
  const cdnJsUrl = process.env.AMDUI_CDN_JS_URL || `https://cdn.jsdelivr.net/npm/@a-mdui/web@${cdnVersion}/dist/a-mdui.bundle.js`;
  const cdnCssUrl = process.env.AMDUI_CDN_CSS_URL || `https://cdn.jsdelivr.net/npm/@a-mdui/web@${cdnVersion}/dist/a-mdui.bundle.css`;
  if (!forceCdn) {
    const possibleRoots = [
      path.resolve(__dirname, "./assets"),
      path.resolve(__dirname, "../dist/assets"),
      path.resolve(__dirname, "../../dist"),
      path.resolve(__dirname, "../../../dist"),
      "/opt/homebrew/lib/amdui/assets",
      path.resolve(process.cwd(), "dist"),
      path.resolve(process.cwd(), "packages/antigravity-plugin/mcp/assets"),
      path.resolve(process.cwd(), "packages/mcp/dist/assets")
    ];
    for (const root of possibleRoots) {
      const jsPath = path.join(root, "a-mdui.bundle.js");
      const cssPath = path.join(root, "a-mdui.bundle.css");
      if (fs.existsSync(jsPath) && fs.existsSync(cssPath)) {
        try {
          const js = fs.readFileSync(jsPath, "utf-8");
          const css = fs.readFileSync(cssPath, "utf-8");
          if (js.length > 0 && css.length > 0) {
            return { mode: "inline", js, css };
          }
        } catch {
        }
      }
    }
  }
  return {
    mode: "cdn",
    jsUrl: cdnJsUrl,
    cssUrl: cdnCssUrl
  };
}
var ssePort = 4388;
var sseClients = [];
var activeStreamBuffers = /* @__PURE__ */ new Map();
function broadcastStreamChunk(chunk, streamId) {
  const payload = JSON.stringify({ type: "chunk", chunk, streamId });
  const data = `data: ${payload}

`;
  sseClients.forEach((res) => {
    try {
      res.write(data);
    } catch (_) {
    }
  });
  if (ssePort !== 4388) {
    try {
      const req = http.request({
        hostname: "localhost",
        port: 4388,
        path: "/api/stream",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }, () => {
      });
      req.on("error", () => {
      });
      req.write(payload);
      req.end();
    } catch (_) {
    }
  }
}
function broadcastStreamEnd(streamId) {
  const payload = JSON.stringify({ type: "end", streamId });
  const data = `data: ${payload}

`;
  sseClients.forEach((res) => {
    try {
      res.write(data);
    } catch (_) {
    }
  });
  if (ssePort !== 4388) {
    try {
      const req = http.request({
        hostname: "localhost",
        port: 4388,
        path: "/api/stream",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }, () => {
      });
      req.on("error", () => {
      });
      req.write(payload);
      req.end();
    } catch (_) {
    }
  }
}
function startSseServer(portToTry = 4388) {
  const srv = http.createServer((req, res) => {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (req.method === "OPTIONS") {
      res.writeHead(204, corsHeaders);
      return res.end();
    }
    const url = new URL(req.url || "/", `http://localhost:${portToTry}`);
    if (url.pathname === "/api/stream" && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        ...corsHeaders
      });
      res.write(": connected\n\n");
      sseClients.push(res);
      req.on("close", () => {
        const idx = sseClients.indexOf(res);
        if (idx !== -1) sseClients.splice(idx, 1);
      });
      return;
    }
    if (url.pathname === "/api/stream" && req.method === "POST") {
      let body = "";
      req.on("data", (d) => {
        body += d;
      });
      req.on("end", () => {
        try {
          const payload = JSON.parse(body || "{}");
          const dataStr = `data: ${JSON.stringify(payload)}

`;
          sseClients.forEach((c) => {
            try {
              c.write(dataStr);
            } catch (_) {
            }
          });
          res.writeHead(200, { "Content-Type": "application/json", ...corsHeaders });
          res.end(JSON.stringify({ ok: true, subscribers: sseClients.length }));
        } catch (e) {
          res.writeHead(400, corsHeaders);
          res.end(JSON.stringify({ error: e?.message }));
        }
      });
      return;
    }
    res.writeHead(404, corsHeaders);
    res.end("Not Found");
  });
  srv.on("error", (err) => {
    if (err.code === "EADDRINUSE" && portToTry === 4388) {
      startSseServer(4389);
    }
  });
  srv.listen(portToTry, "127.0.0.1", () => {
    ssePort = portToTry;
  });
}
try {
  startSseServer(4388);
} catch (_) {
}
var server = new Server(
  {
    name: "amdui-mcp-server",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {},
      prompts: {}
    }
  }
);
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "render_mdui",
        description: 'Renders A-MarkdownUI (.mdui) markup into a live interactive UI widget inside Antigravity IDE chat (via <agent-embed>) or the side-pane artifact viewer. For transactional tasks (e.g. bookings, appointments, checkout, onboarding, surveys), generate a Progressive Intake Wizard (@step("intake") -> selection -> confirmed) rather than pre-populating fabricated end-state assumptions.',
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The raw A-MDUI (.mdui) document markup to render."
            },
            title: {
              type: "string",
              description: "Optional display title for the widget header.",
              default: "A-MarkdownUI Component"
            },
            theme: {
              type: "string",
              enum: ["dark", "default", "fintech", "sunset", "nordic", "amethyst"],
              description: "Color theme preset for the rendered widget.",
              default: "dark"
            },
            targetDir: {
              type: "string",
              description: "Optional directory path where the HTML artifact should be saved (e.g. Antigravity conversation artifact directory). Defaults to a persistent temporary folder."
            },
            includeMarkdown: {
              type: "boolean",
              description: "Whether to include the raw markdown code block in the tool response. Defaults to false (only the interactive component is returned).",
              default: false
            }
          },
          required: ["content"]
        }
      },
      {
        name: "stream_mdui",
        description: 'Drives progressive live streaming into Antigravity IDE chat or side-pane. Use action="init" to mount an instantaneous live streaming harness (<agent-embed>), action="chunk" to progressively stream token chunks in real time, and action="end" to finalize and seal the component.',
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["init", "chunk", "end"],
              description: 'Streaming lifecycle phase: "init" creates live mount, "chunk" broadcasts tokens, "end" finalizes.'
            },
            streamId: {
              type: "string",
              description: "Unique stream identifier. Defaults to timestamp."
            },
            chunk: {
              type: "string",
              description: 'The markdown token chunk to append (required when action="chunk").'
            },
            initialContent: {
              type: "string",
              description: "Optional initial markdown content when initializing stream."
            },
            title: {
              type: "string",
              description: "Optional display title for the streaming widget.",
              default: "Live A-MDUI Stream"
            },
            theme: {
              type: "string",
              enum: ["dark", "default", "fintech", "sunset", "nordic", "amethyst", "light"],
              description: "Color theme preset for the streaming widget.",
              default: "dark"
            }
          },
          required: ["action"]
        }
      },
      {
        name: "validate_mdui",
        description: "Fast static validation and linter for .mdui markup. Verifies balanced ::: container blocks, ??? input fields, @state variables, and {{ }} expressions.",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The .mdui markup text to validate."
            }
          },
          required: ["content"]
        }
      },
      {
        name: "get_mdui_template",
        description: "Retrieves a production-ready .mdui template (booking_wizard, flight_booking, dashboard, checkout, charts).",
        inputSchema: {
          type: "object",
          properties: {
            template: {
              type: "string",
              enum: ["booking_wizard", "flight_booking", "dashboard", "checkout", "charts"],
              description: "The key name of the template to retrieve."
            }
          },
          required: ["template"]
        }
      }
    ]
  };
});
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "amdui_authoring_guide",
        description: "System prompt teaching the LLM how to author valid, rich, autonomous .mdui screens."
      }
    ]
  };
});
server.setRequestHandler(GetPromptRequestSchema, async (request2) => {
  const { name } = request2.params;
  if (name === "amdui_authoring_guide") {
    return {
      description: "System prompt instructions for authoring .mdui documents",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
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
- Single-screen dashboards should only be used for read-only telemetry, reports, or charts where data already exists.`
          }
        }
      ]
    };
  }
  throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
});
server.setRequestHandler(CallToolRequestSchema, async (request2) => {
  const { name, arguments: args } = request2.params;
  if (name === "render_mdui") {
    let rawContent = String(args?.content || args?.markdown || "").trim();
    const title = String(args?.title || "A-MarkdownUI Component");
    const ALLOWED_THEMES = ["dark", "default", "fintech", "sunset", "nordic", "amethyst", "light"];
    const rawTheme = String(args?.theme || "dark").toLowerCase().trim();
    const safeTheme = ALLOWED_THEMES.includes(rawTheme) ? rawTheme : "dark";
    const targetDir = args?.targetDir ? String(args.targetDir) : "";
    const fenceMatch = rawContent.match(/^```(?:mdui|markdown)?\s*\n([\s\S]*?)\n```\s*$/i);
    if (fenceMatch) {
      rawContent = fenceMatch[1].trim();
    }
    let outDir = "";
    const conversationArtifactDir = process.env.ANTIGRAVITY_APP_DATA_DIR && process.env.ANTIGRAVITY_CONVERSATION_ID ? path.join(process.env.ANTIGRAVITY_APP_DATA_DIR, "brain", process.env.ANTIGRAVITY_CONVERSATION_ID) : null;
    if (targetDir) {
      const resolvedTarget = path.resolve(targetDir);
      const allowedRoots = [
        process.cwd(),
        process.env.ANTIGRAVITY_ARTIFACT_DIR ? path.resolve(process.env.ANTIGRAVITY_ARTIFACT_DIR) : null,
        conversationArtifactDir,
        path.join(os.homedir(), ".gemini/antigravity"),
        os.tmpdir()
      ].filter(Boolean);
      const isAllowed = allowedRoots.some((root) => resolvedTarget === root || resolvedTarget.startsWith(root + path.sep));
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
        outDir = path.join(os.tmpdir(), "antigravity-mdui-artifacts");
      }
    }
    fs.mkdirSync(outDir, { recursive: true });
    const mduiFilename = `component_${Date.now()}.mdui`;
    const mduiArtifactPath = path.join(outDir, mduiFilename);
    fs.writeFileSync(mduiArtifactPath, rawContent, "utf-8");
    let themePath = path.join(__dirname, "theme.css");
    if (!fs.existsSync(themePath)) {
      const candidateThemeDirs = [
        __dirname,
        path.join(__dirname, ".."),
        path.join(__dirname, "src"),
        path.join(__dirname, "dist"),
        "/opt/homebrew/lib/amdui",
        path.join(process.cwd(), "packages/antigravity-plugin/mcp"),
        path.join(process.cwd(), "packages/mcp/dist"),
        path.join(process.cwd(), "packages/mcp/src")
      ];
      for (const dir of candidateThemeDirs) {
        const candidate = path.join(dir, "theme.css");
        if (fs.existsSync(candidate)) {
          themePath = candidate;
          break;
        }
      }
    }
    const userThemeCss = fs.existsSync(themePath) ? fs.readFileSync(themePath, "utf-8") : "";
    const widgetHtmlFilename = `mdui_widget_${Date.now()}.html`;
    const widgetHtmlPath = path.join(outDir, widgetHtmlFilename);
    const bundle = resolveBundle();
    const bundleCss = bundle.mode === "inline" ? bundle.css || "" : `@import url("${bundle.cssUrl}");`;
    const bundleJs = bundle.mode === "inline" ? bundle.js || "" : `// Dynamic load via CDN
var s=document.createElement("script");s.src="${bundle.jsUrl}";document.head.appendChild(s);`;
    const htmlContent = `<!DOCTYPE html>
<html lang="en" class="${safeTheme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    /* A-MDUI Core Stylesheet */
    ${bundleCss}
    /* User Customizable Theme Stylesheet (${path.basename(themePath)}) */
    ${userThemeCss}
    /* Flush layout & Auto-Height */
    html, body {
      background: var(--mdui-color-background, #0f172a);
      color: var(--mdui-color-text, #f8fafc);
      font-family: var(--mdui-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif);
      margin: 0;
      padding: 14px;
      min-height: 120px;
      overflow-x: hidden;
      overflow-y: visible;
      box-sizing: border-box;
      width: 100%;
      -webkit-user-select: text !important;
      user-select: text !important;
    }
    a-mdui {
      display: block;
      min-height: 120px;
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
      top: 8px;
      right: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 50;
      opacity: 0.8;
      transition: opacity 0.2s ease;
    }
    .antigravity-card:hover .mdui-widget-toolbar {
      opacity: 1;
    }
    .mdui-toolbar-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 9px;
      font-size: 11px;
      font-weight: 500;
      border-radius: var(--mdui-radius-button, 6px);
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid var(--mdui-color-border, rgba(255, 255, 255, 0.14));
      color: var(--mdui-color-text-muted, #94a3b8);
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
    }
    .mdui-toolbar-btn:hover {
      color: var(--mdui-color-text, #f8fafc);
      background: rgba(30, 41, 59, 0.9);
      border-color: rgba(56, 189, 248, 0.5);
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
  <script>
    ${bundleJs}
  </script>
</head>
<body class="bg-transparent antialiased">
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
    <a-mdui theme="${safeTheme}" id="app-view">${escapeHtml(rawContent)}</a-mdui>
  </div>
  <script>
    function showToast(message, type = "success") {
      let toast = document.getElementById("amdui-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "amdui-toast";
        toast.style.cssText = "position:fixed;bottom:16px;left:50%;transform:translateX(-50%) translateY(20px);padding:8px 18px;border-radius:24px;font-size:12px;font-weight:600;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.5);display:flex;align-items:center;gap:6px;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);opacity:0;pointer-events:none;";
        document.body.appendChild(toast);
      }
      if (type === "success") {
        toast.style.background = "#059669";
        toast.style.color = "#ffffff";
        toast.style.border = "1px solid rgba(52, 211, 153, 0.4)";
      } else {
        toast.style.background = "#2563eb";
        toast.style.color = "#ffffff";
        toast.style.border = "1px solid rgba(96, 165, 250, 0.4)";
      }
      toast.textContent = message;
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%) translateY(20px)";
      }, 3500);
    }

    async function initMdui() {
      if (typeof customElements !== "undefined" && customElements.whenDefined) {
        try { await customElements.whenDefined("a-mdui"); } catch (_) {}
      }
      const view = document.getElementById("app-view");
      const raw = ${JSON.stringify(rawContent)};
      if (view) {
        if (!view.content || view.content !== raw) {
          try { delete view.content; } catch (_) {}
          view.content = raw;
        }

        view.addEventListener("submit", (e) => {
          showToast("\u2713 Form submitted locally", "success");
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "a-mdui:submit", source: "a-mdui", detail: e.detail || {} }, "*");
          }
        });

        view.addEventListener("action", (e) => {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "a-mdui:action", source: "a-mdui", detail: e.detail || {} }, "*");
          }
        });

        function notifyHeight() {
          const h = Math.ceil(document.documentElement.scrollHeight || document.body.scrollHeight || 160);
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "resize", height: h }, "*");
            window.parent.postMessage({ type: "antigravity:resize", height: h }, "*");
          }
        }
        if (typeof ResizeObserver !== "undefined") {
          const ro = new ResizeObserver(() => notifyHeight());
          ro.observe(document.body);
          ro.observe(view);
        }
        window.addEventListener("load", notifyHeight);
        notifyHeight();
        setTimeout(notifyHeight, 60);
        setTimeout(notifyHeight, 200);
        setTimeout(notifyHeight, 600);

        const rawContentStr = ${JSON.stringify(rawContent)};
        async function copyText(text) {
          if (!text) return false;
          if (navigator.clipboard) {
            try { await navigator.clipboard.writeText(text); return true; } catch (_) {}
          }
          const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
          const scrollX = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.top = scrollY + "px";
          ta.style.left = scrollX + "px";
          ta.style.width = "1px";
          ta.style.height = "1px";
          ta.style.padding = "0";
          ta.style.border = "none";
          ta.style.outline = "none";
          ta.style.background = "transparent";
          ta.style.opacity = "0.01";
          ta.style.pointerEvents = "none";
          document.body.appendChild(ta);
          ta.focus({ preventScroll: true });
          ta.select();
          let ok = false;
          try { ok = document.execCommand("copy"); } catch (_) {}
          document.body.removeChild(ta);
          if (window.scrollY !== scrollY || window.scrollX !== scrollX) {
            window.scrollTo(scrollX, scrollY);
          }
          return ok;
        }

        let cachedSelectedText = "";
        const copyBtn = document.getElementById("copy-btn");
        if (copyBtn) {
          copyBtn.addEventListener("mousedown", () => {
            const sel = window.getSelection();
            const text = sel ? sel.toString().trim() : "";
            if (text) cachedSelectedText = text;
          });
          copyBtn.addEventListener("click", async () => {
            const sel = window.getSelection();
            const selText = (sel ? sel.toString().trim() : "") || cachedSelectedText;
            const textToCopy = selText || rawContentStr;
            const success = await copyText(textToCopy);
            if (success) {
              const btnText = copyBtn.querySelector(".btn-text");
              const orig = btnText ? btnText.textContent : "Copy";
              copyBtn.classList.add("copied");
              if (btnText) btnText.textContent = selText ? "Selection Copied!" : "Copied!";
              showToast(selText ? "\u2713 Selection copied to clipboard" : "\u2713 Full content copied to clipboard", "success");
              setTimeout(() => {
                copyBtn.classList.remove("copied");
                if (btnText) btnText.textContent = orig;
              }, 2000);
            } else {
              showToast("Failed to copy to clipboard", "info");
            }
          });
        }

        document.addEventListener("copy", (e) => {
          const sel = window.getSelection();
          const selText = (sel ? sel.toString() : "") || cachedSelectedText;
          if (selText && e.clipboardData) {
            e.clipboardData.setData("text/plain", selText);
            showToast("\u2713 Text copied to clipboard", "success");
          }
        });

        window.addEventListener("keydown", (e) => {
          if ((e.metaKey || e.ctrlKey) && (e.key === "c" || e.key === "C")) {
            const sel = window.getSelection();
            const selText = (sel ? sel.toString() : "") || cachedSelectedText;
            if (selText) {
              e.stopPropagation();
              let copied = false;
              try { copied = document.execCommand("copy"); } catch (_) {}
              if (!copied && navigator.clipboard) {
                navigator.clipboard.writeText(selText).then(() => {
                  showToast("\u2713 Text copied to clipboard", "success");
                }).catch(() => {});
                return;
              }
              if (copied) {
                showToast("\u2713 Text copied to clipboard", "success");
              }
            }
          }
        }, true);

        const bubble = document.getElementById("selection-bubble");
        const bubbleCopyBtn = document.getElementById("bubble-copy-btn");
        if (bubble) {
          bubble.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
          });
        }

        document.addEventListener("mouseup", (e) => {
          setTimeout(() => {
            const sel = window.getSelection();
            const text = sel ? sel.toString().trim() : "";
            if (text && bubble && !bubble.contains(e.target)) {
              cachedSelectedText = text;
              try {
                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  bubble.style.top = Math.max(10, rect.top) + "px";
                  bubble.style.left = (rect.left + rect.width / 2) + "px";
                  bubble.style.display = "block";
                }
              } catch (_) {}
            } else if (bubble && !bubble.contains(e.target)) {
              bubble.style.display = "none";
            }
          }, 10);
        });

        if (bubbleCopyBtn) {
          bubbleCopyBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const textToCopy = cachedSelectedText || (window.getSelection() ? window.getSelection().toString().trim() : "");
            if (textToCopy) {
              const success = await copyText(textToCopy);
              if (success) {
                showToast("\u2713 Selection copied to clipboard", "success");
                if (bubble) bubble.style.display = "none";
              }
            }
          });
        }
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initMdui);
    } else {
      initMdui();
    }
  </script>
</body>
</html>`;
    fs.writeFileSync(widgetHtmlPath, htmlContent, "utf-8");
    const docLines = rawContent.split("\n").length;
    const docBytes = Buffer.byteLength(rawContent, "utf-8");
    const includeMarkdown = args?.includeMarkdown === true || process.env.AMDUI_INCLUDE_MARKDOWN === "true";
    const markdownSection = includeMarkdown ? `
#### Component Structure:
\`\`\`mdui
${rawContent}
\`\`\`
` : "";
    return {
      content: [
        {
          type: "text",
          text: `### A-MDUI Interactive UI Component Rendered

<agent-embed src="file://${widgetHtmlPath}"></agent-embed>

* **Interactive Component (Open in Browser)**: [Open in Browser](file://${widgetHtmlPath})
* **A-MDUI Source Document**: [${mduiFilename}](file://${mduiArtifactPath})
* **Customizable Stylesheet**: [theme.css](file://${themePath})
* **Theme**: \`${safeTheme}\` \xB7 **Size**: ${docLines} lines (${docBytes} bytes)${markdownSection}

> **CRITICAL FOR AI ASSISTANT:**
> - Present your response EXCLUSIVELY through the interactive component.
> - In Antigravity IDE: Output ONLY the \`<agent-embed src="file://${widgetHtmlPath}"></agent-embed>\` tag. Do NOT write duplicate markdown explanations, bullet lists, or tables in chat outside the component.
> - In Gemini Desktop: Output ONLY the clickable link \`[Open Interactive Component](file://${widgetHtmlPath})\` with at most 1 concise sentence. Never dump duplicate markdown text in chat.`
        }
      ]
    };
  }
  if (name === "stream_mdui") {
    const action = String(args?.action || "init").toLowerCase().trim();
    const streamId = String(args?.streamId || `stream_${Date.now()}`);
    const chunk = String(args?.chunk || "");
    const initialContent = String(args?.initialContent || "");
    const title = String(args?.title || "Live A-MDUI Stream");
    const ALLOWED_THEMES = ["dark", "default", "fintech", "sunset", "nordic", "amethyst", "light"];
    const rawTheme = String(args?.theme || "dark").toLowerCase().trim();
    const safeTheme = ALLOWED_THEMES.includes(rawTheme) ? rawTheme : "dark";
    if (action === "chunk") {
      const existing = activeStreamBuffers.get(streamId) || "";
      activeStreamBuffers.set(streamId, existing + chunk);
      broadcastStreamChunk(chunk, streamId);
      return {
        content: [
          {
            type: "text",
            text: `\u2713 Delivered stream chunk for session \`${streamId}\` (${chunk.length} bytes)`
          }
        ]
      };
    }
    if (action === "end") {
      broadcastStreamEnd(streamId);
      const finalContent = activeStreamBuffers.get(streamId) || "";
      activeStreamBuffers.delete(streamId);
      let outDir2 = path.join(os.tmpdir(), "antigravity-mdui-artifacts");
      if (process.env.ANTIGRAVITY_ARTIFACT_DIR && fs.existsSync(process.env.ANTIGRAVITY_ARTIFACT_DIR)) {
        outDir2 = path.resolve(process.env.ANTIGRAVITY_ARTIFACT_DIR);
      }
      fs.mkdirSync(outDir2, { recursive: true });
      const mduiFilename = `component_${streamId}.mdui`;
      const mduiArtifactPath = path.join(outDir2, mduiFilename);
      fs.writeFileSync(mduiArtifactPath, finalContent, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: `\u2713 Stream session \`${streamId}\` finalized and saved to [${mduiFilename}](file://${mduiArtifactPath}).`
          }
        ]
      };
    }
    activeStreamBuffers.set(streamId, initialContent);
    let outDir = path.join(os.tmpdir(), "antigravity-mdui-artifacts");
    if (process.env.ANTIGRAVITY_ARTIFACT_DIR && fs.existsSync(process.env.ANTIGRAVITY_ARTIFACT_DIR)) {
      outDir = path.resolve(process.env.ANTIGRAVITY_ARTIFACT_DIR);
    }
    fs.mkdirSync(outDir, { recursive: true });
    const widgetHtmlFilename = `stream_widget_${streamId}.html`;
    const widgetHtmlPath = path.join(outDir, widgetHtmlFilename);
    let themePath = path.join(__dirname, "theme.css");
    const userThemeCss = fs.existsSync(themePath) ? fs.readFileSync(themePath, "utf-8") : "";
    const bundle = resolveBundle();
    const bundleCss = bundle.mode === "inline" ? bundle.css || "" : `@import url("${bundle.cssUrl}");`;
    const bundleJs = bundle.mode === "inline" ? bundle.js || "" : "";
    const streamHtml = `<!DOCTYPE html>
<html lang="en" class="${safeTheme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    ${bundleCss}
    ${userThemeCss}
    html, body {
      background: var(--mdui-color-background, #0f172a);
      color: var(--mdui-color-text, #f8fafc);
      font-family: var(--mdui-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      margin: 0;
      padding: 14px;
      min-height: 120px;
      overflow-x: hidden;
      overflow-y: visible;
      box-sizing: border-box;
      width: 100%;
    }
    a-mdui { display: block; min-height: 120px; }
    .stream-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-family: monospace;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 4px;
      padding: 2px 8px;
      margin-bottom: 8px;
    }
    .stream-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #38bdf8;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
  </style>
  <script>
    window.__AMDUI_SSE_PORT__ = ${ssePort};
    ${bundleJs}
  </script>
</head>
<body class="bg-transparent antialiased">
  <div class="stream-indicator" id="stream-indicator">
    <span class="stream-dot"></span>
    <span id="stream-text">Live Streaming Session Active</span>
  </div>
  <a-mdui theme="${safeTheme}" id="app-view">${escapeHtml(initialContent)}</a-mdui>
  <script>
    (function() {
      const view = document.getElementById("app-view");
      const indicator = document.getElementById("stream-indicator");
      const indicatorText = document.getElementById("stream-text");

      function notifyHeight() {
        const h = Math.ceil(document.documentElement.scrollHeight || document.body.scrollHeight || 160);
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "resize", height: h }, "*");
          window.parent.postMessage({ type: "antigravity:resize", height: h }, "*");
        }
      }

      try {
        const sseUrl = "http://localhost:" + ${ssePort} + "/api/stream";
        const evtSource = new EventSource(sseUrl);
        evtSource.onmessage = function(event) {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "chunk" && typeof data.chunk === "string") {
              if (view && typeof view.appendStreamChunk === "function") {
                view.appendStreamChunk(data.chunk);
              }
              notifyHeight();
            } else if (data.type === "end") {
              if (view && typeof view.endStream === "function") {
                view.endStream();
              }
              if (indicator) {
                indicator.style.color = "#4ade80";
                indicator.style.borderColor = "rgba(74, 222, 128, 0.3)";
                indicator.style.background = "rgba(74, 222, 128, 0.1)";
                const dot = indicator.querySelector(".stream-dot");
                if (dot) dot.style.background = "#4ade80";
              }
              if (indicatorText) indicatorText.textContent = "Stream Finalized \u2713";
              notifyHeight();
              evtSource.close();
            }
          } catch (_) {}
        };
      } catch (_) {}

      window.addEventListener("message", function(e) {
        if (!e.data || typeof e.data !== "object") return;
        if (e.data.type === "a-mdui:stream-chunk" && typeof e.data.chunk === "string") {
          if (view && typeof view.appendStreamChunk === "function") {
            view.appendStreamChunk(e.data.chunk);
          }
          notifyHeight();
        } else if (e.data.type === "a-mdui:stream-end") {
          if (view && typeof view.endStream === "function") {
            view.endStream();
          }
          notifyHeight();
        }
      });

      if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(notifyHeight).observe(document.body);
      }
      window.addEventListener("load", notifyHeight);
      setTimeout(notifyHeight, 100);
      setInterval(notifyHeight, 400);
    })();
  </script>
</body>
</html>`;
    fs.writeFileSync(widgetHtmlPath, streamHtml, "utf-8");
    return {
      content: [
        {
          type: "text",
          text: `### A-MDUI Live Streaming Mount Initialized

<agent-embed src="file://${widgetHtmlPath}"></agent-embed>

* **Streaming Session**: \`${streamId}\`
* **Port**: \`${ssePort}\`
* **Interactive Mount**: [Open Live Stream](file://${widgetHtmlPath})`
        }
      ]
    };
  }
  if (name === "validate_mdui") {
    const content = String(args?.content || "");
    const errors = [];
    const warnings = [];
    if (content.trim().length === 0) {
      errors.push("Document content is empty.");
    }
    const containerOpens = (content.match(/^[ \t]*:::[ \t]+[a-zA-Z0-9_-]+/gm) || []).length;
    const containerCloses = (content.match(/^[ \t]*:::[ \t]*$/gm) || []).length;
    if (containerOpens !== containerCloses) {
      errors.push(`Container block mismatch: ${containerOpens} opened, but ${containerCloses} closed.`);
    }
    const inputOpens = (content.match(/^[ \t]*\?\?\?[ \t]+[a-zA-Z0-9_]+/gm) || []).length;
    const inputCloses = (content.match(/^[ \t]*\?\?\?[ \t]*$/gm) || []).length;
    if (inputOpens !== inputCloses) {
      errors.push(`Input block mismatch: ${inputOpens} opened, but ${inputCloses} closed with '???'`);
    }
    const exprOpens = (content.match(/\{\{/g) || []).length;
    const exprCloses = (content.match(/\}\}/g) || []).length;
    if (exprOpens !== exprCloses) {
      errors.push(`Expression interpolation mismatch: ${exprOpens} opened with '{{', but ${exprCloses} closed with '}}'.`);
    }
    const codeFences = (content.match(/^```/gm) || []).length;
    if (codeFences % 2 !== 0) {
      errors.push(`Unclosed code fence block: found odd number (${codeFences}) of \`\`\` delimiters.`);
    }
    if (content.includes("::: grid") && content.includes("::: card if:")) {
      warnings.push(
        "Notice: Mutually exclusive conditional cards (e.g. '::: card if: @tab == ...') should be stacked directly without an enclosing '::: grid' to prevent column squashing."
      );
    }
    const isValid = errors.length === 0;
    return {
      content: [
        {
          type: "text",
          text: isValid ? `\u2713 **Valid A-MDUI Document**
* ${containerOpens} container(s)
* ${inputOpens} interactive input(s)
${warnings.length > 0 ? "\n" + warnings.map((w) => `* \u26A0\uFE0F ${w}`).join("\n") : ""}` : `\u274C **A-MDUI Syntax Errors Found**:
${errors.map((e) => `- ${e}`).join("\n")}${warnings.length > 0 ? "\n\nWarnings:\n" + warnings.map((w) => `- ${w}`).join("\n") : ""}`
        }
      ]
    };
  }
  if (name === "get_mdui_template") {
    const key = String(args?.template || "flight_booking");
    const tpl = TEMPLATES[key];
    if (!tpl) {
      throw new McpError(ErrorCode.InvalidParams, `Unknown template '${key}'. Available: ${Object.keys(TEMPLATES).join(", ")}`);
    }
    return {
      content: [
        {
          type: "text",
          text: `### Template: ${tpl.title}
*${tpl.description}*

\`\`\`mdui
${tpl.mdui}
\`\`\``
        }
      ]
    };
  }
  throw new McpError(ErrorCode.MethodNotFound, `Unknown tool '${name}'`);
});
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch((err) => {
  console.error("Fatal MCP Server Error:", err);
  process.exit(1);
});
export {
  broadcastStreamChunk,
  broadcastStreamEnd
};
