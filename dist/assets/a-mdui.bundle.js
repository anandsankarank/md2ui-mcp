"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // packages/core/dist/index.js
  var dist_exports = {};
  __export(dist_exports, {
    AccordionHandler: () => AccordionHandler,
    ActionHandler: () => ActionHandler,
    ActionLinkHandler: () => ActionLinkHandler,
    BlockquoteHandler: () => BlockquoteHandler,
    CodeBlockHandler: () => CodeBlockHandler,
    ConditionalHandler: () => ConditionalHandler,
    DataVariableHandler: () => DataVariableHandler,
    DateParser: () => DateParser,
    DividerHandler: () => DividerHandler,
    EmptyLineHandler: () => EmptyLineHandler,
    ExpressionEvaluator: () => ExpressionEvaluator,
    FootnoteDefinitionHandler: () => FootnoteDefinitionHandler,
    GroupHandler: () => GroupHandler,
    HeaderHandler: () => HeaderHandler,
    ImageHandler: () => ImageHandler,
    ListHandler: () => ListHandler,
    LoopHandler: () => LoopHandler,
    MarkdownActionHelper: () => MarkdownActionHelper,
    MarkdownCustomBody: () => MarkdownCustomBody,
    MarkdownGroupHelper: () => MarkdownGroupHelper,
    MarkdownHandlerRegistry: () => MarkdownHandlerRegistry,
    MarkdownInlineHandler: () => MarkdownInlineHandler,
    MarkdownInputHandler: () => MarkdownInputHandler,
    MarkdownInputParser: () => MarkdownInputParser,
    MarkdownMetricDeltaParser: () => MarkdownMetricDeltaParser,
    MarkdownPanelHandler: () => MarkdownPanelHandler,
    MarkdownRuleExprParser: () => MarkdownRuleExprParser,
    MarkdownSAXParser: () => MarkdownSAXParser,
    MarkdownUIAccumulator: () => MarkdownUIAccumulator,
    MarkdownValidationEngine: () => MarkdownValidationEngine,
    MediaHandler: () => MediaHandler,
    ParagraphHandler: () => ParagraphHandler,
    RuleDefinitionHandler: () => RuleDefinitionHandler,
    TableRowHandler: () => TableRowHandler,
    TemplateInterpolator: () => TemplateInterpolator,
    createSafeRegExp: () => createSafeRegExp,
    evaluateRuleExpr: () => evaluateRuleExpr,
    flattenVariables: () => flattenVariables,
    getRenderNodeKind: () => getRenderNodeKind,
    nextDeterministicId: () => nextDeterministicId,
    resetDeterministicIds: () => resetDeterministicIds,
    resolveRenderNode: () => resolveRenderNode,
    resolveVariablePath: () => resolveVariablePath,
    themeToCssVariables: () => themeToCssVariables,
    unwrapVariable: () => unwrapVariable,
    wrapVariable: () => wrapVariable
  });

  // packages/core/dist/entity/MarkdownVariable.js
  function wrapVariable(val) {
    if (val === null || val === void 0) {
      return { type: "string", value: "" };
    }
    if (typeof val === "string") {
      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(val)) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return { type: "date", value: d };
        }
      }
      return { type: "string", value: val };
    }
    if (typeof val === "number") {
      return { type: "number", value: val };
    }
    if (typeof val === "boolean") {
      return { type: "bool", value: val };
    }
    if (val instanceof Date) {
      return { type: "date", value: val };
    }
    if (Array.isArray(val)) {
      return { type: "array", value: val.map(wrapVariable) };
    }
    if (typeof val === "object") {
      const obj = {};
      for (const [k, v] of Object.entries(val)) {
        obj[k] = wrapVariable(v);
      }
      return { type: "object", value: obj };
    }
    return { type: "string", value: String(val) };
  }
  function unwrapVariable(v) {
    switch (v.type) {
      case "string":
      case "number":
      case "bool":
      case "date":
        return v.value;
      case "array":
        return v.value.map(unwrapVariable);
      case "object": {
        const res = {};
        for (const [k, val] of Object.entries(v.value)) {
          res[k] = unwrapVariable(val);
        }
        return res;
      }
    }
  }
  function flattenVariables(obj, prefix = "") {
    const flattened = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      flattened[fullKey] = value;
      if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, flattenVariables(value, fullKey));
      }
    }
    return flattened;
  }
  function resolveVariablePath(state, path) {
    if (path in state) {
      return state[path];
    }
    const cleanPath = path.startsWith("@") ? path.slice(1) : path;
    if (cleanPath in state) {
      return state[cleanPath];
    }
    const parts = cleanPath.split(".");
    let current = state;
    for (const part of parts) {
      if (!current || typeof current !== "object") {
        return void 0;
      }
      const idxMatch = part.match(/^(\w+)\[([^\]]+)\]$/);
      if (idxMatch) {
        const arrKey = idxMatch[1];
        const indexOrId = idxMatch[2];
        const arr = current[arrKey];
        if (Array.isArray(arr)) {
          if (!isNaN(Number(indexOrId))) {
            current = arr[Number(indexOrId)];
          } else {
            current = arr.find((item) => item && (item.id === indexOrId || String(item.id) === String(indexOrId) || item.key === indexOrId));
          }
        } else if (arr && typeof arr === "object") {
          current = arr[indexOrId];
        } else {
          return void 0;
        }
        continue;
      }
      if (part in current) {
        current = current[part];
      } else {
        return void 0;
      }
    }
    return current;
  }

  // packages/core/dist/entity/MarkdownRuleExpr.js
  function evaluateRuleExpr(expr, state, contextField) {
    switch (expr.kind) {
      case "and":
        return evaluateRuleExpr(expr.left, state, contextField) && evaluateRuleExpr(expr.right, state, contextField);
      case "or":
        return evaluateRuleExpr(expr.left, state, contextField) || evaluateRuleExpr(expr.right, state, contextField);
      case "not":
        return !evaluateRuleExpr(expr.expr, state, contextField);
      case "booleanLiteral":
        return expr.value;
      case "empty": {
        const field = expr.field || contextField;
        if (!field)
          return false;
        const val = resolveVariablePath(state, field);
        return val === void 0 || val === null || val === "" || Array.isArray(val) && val.length === 0;
      }
      case "matches": {
        const field = expr.field || contextField;
        if (!field)
          return false;
        const val = resolveVariablePath(state, field);
        return expr.pattern.test(String(val ?? ""));
      }
      case "regexMismatchEmptySafe": {
        const field = expr.field || contextField;
        if (!field)
          return false;
        const val = resolveVariablePath(state, field);
        if (val === void 0 || val === null || val === "")
          return false;
        return !expr.pattern.test(String(val));
      }
      case "lengthCompare": {
        const field = expr.field || contextField;
        if (!field)
          return false;
        const val = resolveVariablePath(state, field);
        const len = Array.isArray(val) ? val.length : String(val ?? "").length;
        let targetLen;
        if (typeof expr.target === "object" && "field" in expr.target) {
          const otherVal = resolveVariablePath(state, expr.target.field);
          targetLen = Array.isArray(otherVal) ? otherVal.length : String(otherVal ?? "").length;
        } else {
          targetLen = expr.target;
        }
        switch (expr.op) {
          case "<":
            return len < targetLen;
          case "<=":
            return len <= targetLen;
          case ">":
            return len > targetLen;
          case ">=":
            return len >= targetLen;
          case "==":
            return len === targetLen;
          case "!=":
            return len !== targetLen;
          default:
            return false;
        }
      }
      case "compareFields": {
        const lhs = resolveVariablePath(state, expr.lhs);
        let rhs = expr.rhs;
        if (typeof expr.rhs === "string" && (expr.rhs in state || resolveVariablePath(state, expr.rhs) !== void 0)) {
          rhs = resolveVariablePath(state, expr.rhs);
        }
        if (Array.isArray(lhs) || Array.isArray(rhs)) {
          if (expr.op === "==" || expr.op === "=") {
            if (Array.isArray(lhs) && Array.isArray(rhs)) {
              return lhs.some((item) => rhs.some((r) => String(r).trim() === String(item).trim()));
            }
            if (Array.isArray(lhs)) {
              return lhs.some((item) => String(item).trim() === String(rhs ?? "").trim());
            }
            if (Array.isArray(rhs)) {
              return rhs.some((item) => String(item).trim() === String(lhs ?? "").trim());
            }
          }
          if (expr.op === "!=") {
            if (Array.isArray(lhs) && Array.isArray(rhs)) {
              return !lhs.some((item) => rhs.some((r) => String(r).trim() === String(item).trim()));
            }
            if (Array.isArray(lhs)) {
              return !lhs.some((item) => String(item).trim() === String(rhs ?? "").trim());
            }
            if (Array.isArray(rhs)) {
              return !rhs.some((item) => String(item).trim() === String(lhs ?? "").trim());
            }
          }
        }
        switch (expr.op) {
          case "==":
          case "=":
            return String(lhs ?? "") === String(rhs ?? "");
          case "!=":
            return String(lhs ?? "") !== String(rhs ?? "");
          case "<":
            return Number(lhs) < Number(rhs);
          case "<=":
            return Number(lhs) <= Number(rhs);
          case ">":
            return Number(lhs) > Number(rhs);
          case ">=":
            return Number(lhs) >= Number(rhs);
          default:
            return false;
        }
      }
      case "truthy": {
        if (expr.field === "true")
          return true;
        if (expr.field === "false")
          return false;
        const field = expr.field === "empty" && contextField ? contextField : expr.field;
        if (expr.field === "empty") {
          const val2 = resolveVariablePath(state, field);
          return val2 === void 0 || val2 === null || val2 === "" || Array.isArray(val2) && val2.length === 0;
        }
        const val = resolveVariablePath(state, field);
        if (val === void 0 || val === null || val === false || val === "" || val === 0)
          return false;
        if (Array.isArray(val))
          return val.length > 0;
        return true;
      }
      case "equals": {
        const field = expr.field === "length" && contextField ? contextField : expr.field;
        const val = resolveVariablePath(state, field);
        if (expr.field === "length" && !isNaN(Number(expr.value))) {
          const len = Array.isArray(val) ? val.length : String(val ?? "").length;
          return len === Number(expr.value);
        }
        if (Array.isArray(val)) {
          return val.some((item) => String(item).trim() === expr.value.trim());
        }
        return String(val ?? "").trim() === expr.value.trim();
      }
      case "notEquals": {
        const field = expr.field === "length" && contextField ? contextField : expr.field;
        const val = resolveVariablePath(state, field);
        if (expr.field === "length" && !isNaN(Number(expr.value))) {
          const len = Array.isArray(val) ? val.length : String(val ?? "").length;
          return len !== Number(expr.value);
        }
        if (Array.isArray(val)) {
          return !val.some((item) => String(item).trim() === expr.value.trim());
        }
        return String(val ?? "").trim() !== expr.value.trim();
      }
      case "equalsField": {
        const lhs = resolveVariablePath(state, expr.lhs);
        const rhs = resolveVariablePath(state, expr.rhs);
        if (Array.isArray(lhs) || Array.isArray(rhs)) {
          if (Array.isArray(lhs) && Array.isArray(rhs)) {
            return lhs.some((item) => rhs.some((r) => String(r).trim() === String(item).trim()));
          }
          if (Array.isArray(lhs)) {
            return lhs.some((item) => String(item).trim() === String(rhs ?? "").trim());
          }
          if (Array.isArray(rhs)) {
            return rhs.some((item) => String(item).trim() === String(lhs ?? "").trim());
          }
        }
        return String(lhs ?? "") === String(rhs ?? "");
      }
      case "notEqualsField": {
        const lhs = resolveVariablePath(state, expr.lhs);
        const rhs = resolveVariablePath(state, expr.rhs);
        if (Array.isArray(lhs) || Array.isArray(rhs)) {
          if (Array.isArray(lhs) && Array.isArray(rhs)) {
            return !lhs.some((item) => rhs.some((r) => String(r).trim() === String(item).trim()));
          }
          if (Array.isArray(lhs)) {
            return !lhs.some((item) => String(item).trim() === String(rhs ?? "").trim());
          }
          if (Array.isArray(rhs)) {
            return !rhs.some((item) => String(item).trim() === String(lhs ?? "").trim());
          }
        }
        return String(lhs ?? "") !== String(rhs ?? "");
      }
      case "inSet": {
        const field = expr.field || contextField;
        if (!field)
          return false;
        const val = resolveVariablePath(state, field);
        if (Array.isArray(val)) {
          return val.some((item) => expr.values.some((v) => v.trim() === String(item).trim()));
        }
        const strVal = String(val ?? "").trim();
        return expr.values.some((v) => v.trim() === strVal);
      }
      case "notInSet": {
        const field = expr.field || contextField;
        if (!field)
          return false;
        const val = resolveVariablePath(state, field);
        if (Array.isArray(val)) {
          return !val.some((item) => expr.values.some((v) => v.trim() === String(item).trim()));
        }
        const strVal = String(val ?? "").trim();
        return !expr.values.some((v) => v.trim() === strVal);
      }
      case "regexMatch": {
        const val = resolveVariablePath(state, expr.field);
        return expr.pattern.test(String(val ?? ""));
      }
      case "numericLT": {
        const field = expr.field === "length" && contextField ? contextField : expr.field;
        const rawVal = resolveVariablePath(state, field);
        if (expr.field === "length") {
          const len = Array.isArray(rawVal) ? rawVal.length : String(rawVal ?? "").length;
          return len < expr.value;
        }
        const val = Number(rawVal);
        return !isNaN(val) && val < expr.value;
      }
      case "numericGT": {
        const field = expr.field === "length" && contextField ? contextField : expr.field;
        const rawVal = resolveVariablePath(state, field);
        if (expr.field === "length") {
          const len = Array.isArray(rawVal) ? rawVal.length : String(rawVal ?? "").length;
          return len > expr.value;
        }
        const val = Number(rawVal);
        return !isNaN(val) && val > expr.value;
      }
      case "numericLTE": {
        const field = expr.field === "length" && contextField ? contextField : expr.field;
        const rawVal = resolveVariablePath(state, field);
        if (expr.field === "length") {
          const len = Array.isArray(rawVal) ? rawVal.length : String(rawVal ?? "").length;
          return len <= expr.value;
        }
        const val = Number(rawVal);
        return !isNaN(val) && val <= expr.value;
      }
      case "numericGTE": {
        const field = expr.field === "length" && contextField ? contextField : expr.field;
        const rawVal = resolveVariablePath(state, field);
        if (expr.field === "length") {
          const len = Array.isArray(rawVal) ? rawVal.length : String(rawVal ?? "").length;
          return len >= expr.value;
        }
        const val = Number(rawVal);
        return !isNaN(val) && val >= expr.value;
      }
      case "countEQ": {
        const val = resolveVariablePath(state, expr.field);
        if (Array.isArray(val))
          return val.length === expr.count;
        if (typeof val === "string")
          return val.length === expr.count;
        return false;
      }
      case "moduloEquals": {
        const val = Number(resolveVariablePath(state, expr.field));
        return !isNaN(val) && val % expr.mod === expr.value;
      }
      case "countCompare": {
        const field = expr.field === "length" && contextField ? contextField : expr.field;
        const val = resolveVariablePath(state, field);
        const len = Array.isArray(val) ? val.length : typeof val === "string" ? val.length : 0;
        switch (expr.op) {
          case "=":
          case "==":
            return len === expr.count;
          case "!=":
            return len !== expr.count;
          case "<":
            return len < expr.count;
          case "<=":
            return len <= expr.count;
          case ">":
            return len > expr.count;
          case ">=":
            return len >= expr.count;
          default:
            return false;
        }
      }
      case "moduloCompare": {
        const val = Number(resolveVariablePath(state, expr.field));
        if (isNaN(val))
          return false;
        const rem = val % expr.mod;
        if (expr.op === "!=")
          return rem !== expr.value;
        return rem === expr.value;
      }
    }
  }

  // packages/core/dist/entity/MarkdownBlockType.js
  function getRenderNodeKind(node) {
    return node.kind;
  }
  function resolveRenderNode(block) {
    let styleTarget;
    if (block.group?.style) {
      styleTarget = { kind: "container", archetype: block.group.style };
    } else if (block.action?.style) {
      styleTarget = { kind: "button", style: block.action.style };
    } else if (block.accordionStyle) {
      styleTarget = { kind: "accordion", style: block.accordionStyle };
    } else if (block.input?.typeOf) {
      styleTarget = { kind: "input", widget: block.input.typeOf };
    }
    let spacingKey;
    if (block.kind === "heading" && block.level) {
      spacingKey = { type: "headingLevel", level: block.level };
    } else if (styleTarget) {
      const styleName = "archetype" in styleTarget ? styleTarget.archetype : "style" in styleTarget ? styleTarget.style : "widget" in styleTarget ? styleTarget.widget : styleTarget.name;
      spacingKey = { type: "kindAndStyle", kind: block.kind, style: styleName };
    } else {
      spacingKey = { type: "bareKind", kind: block.kind };
    }
    return {
      kind: block.kind,
      id: block.id,
      styleTarget,
      spacingKey,
      block
    };
  }

  // packages/core/dist/entity/MarkdownMetricDelta.js
  var MarkdownMetricDeltaParser = class {
    /**
     * Parses trailing {...} attribute from a heading line.
     * e.g. "### $128,450 {+14.2%}"
     * e.g. "### 1.18% {-0.4% good}"
     * e.g. "### 42ms {-18ms good period=\"vs previous 30 days\"}"
     */
    static parse(line) {
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (!headingMatch)
        return null;
      const level = headingMatch[1].length;
      const content = headingMatch[2].trim();
      const braceMatch = content.match(/^(.*?)\s*\{([^}]+)\}$/);
      if (!braceMatch)
        return null;
      const numeral = braceMatch[1].trim();
      const attrs = braceMatch[2].trim();
      let period;
      const periodMatch = attrs.match(/period=(?:"([^"]*)"|'([^']*)'|(\S+))/);
      if (periodMatch) {
        period = periodMatch[1] ?? periodMatch[2] ?? periodMatch[3];
      }
      const cleanAttrs = attrs.replace(/period=(?:"[^"]*"|'[^']*'|\S+)/g, "").trim();
      const tokens = cleanAttrs.split(/\s+/).filter(Boolean);
      if (tokens.length === 0)
        return null;
      let delta = tokens[0];
      let isStatusBadge = false;
      let badgeClass = "";
      if (delta.startsWith(".")) {
        badgeClass = delta.slice(1).toLowerCase();
        const recognized = ["success", "destructive", "danger", "warning", "info", "primary", "neutral", "good", "bad"];
        if (recognized.includes(badgeClass)) {
          isStatusBadge = true;
        } else {
          return null;
        }
      } else if (delta.startsWith("#") || delta.includes(":")) {
        return null;
      }
      if (isStatusBadge) {
        let badgeStyle2 = "neutral";
        let sentiment2 = "neutral";
        if (badgeClass === "success" || badgeClass === "good") {
          badgeStyle2 = "success";
          sentiment2 = "positive";
        } else if (badgeClass === "destructive" || badgeClass === "danger" || badgeClass === "bad") {
          badgeStyle2 = "destructive";
          sentiment2 = "negative";
        } else if (badgeClass === "warning") {
          badgeStyle2 = "warning";
          sentiment2 = "neutral";
        } else if (badgeClass === "info" || badgeClass === "primary") {
          badgeStyle2 = "info";
          sentiment2 = "neutral";
        }
        const deltaLabel = tokens[1] || badgeClass;
        return {
          numeral,
          delta: deltaLabel,
          arrow: "",
          sentiment: sentiment2,
          badgeStyle: badgeStyle2,
          period,
          level
        };
      }
      const modifiers = tokens.slice(1).map((t) => t.toLowerCase());
      const isNeutral = delta.toLowerCase() === "neutral" || delta === "0" || delta === "0%" || delta === "0.0%";
      const isNegativeDelta = delta.startsWith("-");
      const isPositiveDelta = delta.startsWith("+");
      const isGood = modifiers.includes("good") || modifiers.includes("invert") || modifiers.includes("positive");
      const isBad = modifiers.includes("bad") || modifiers.includes("destructive") || modifiers.includes("negative");
      let arrow = "\u2192";
      let sentiment = "neutral";
      let badgeStyle = "neutral";
      if (isNeutral) {
        arrow = "\u2192";
        delta = "0.0%";
        sentiment = "neutral";
        badgeStyle = "neutral";
      } else if (isNegativeDelta) {
        arrow = "\u2193";
        if (isGood) {
          sentiment = "positive";
          badgeStyle = "success";
        } else {
          sentiment = "negative";
          badgeStyle = "destructive";
        }
      } else if (isPositiveDelta) {
        arrow = "\u2191";
        if (isBad) {
          sentiment = "negative";
          badgeStyle = "destructive";
        } else {
          sentiment = "positive";
          badgeStyle = "success";
        }
      }
      const badgeOverride = modifiers.find((m) => m.startsWith("badge:"));
      if (badgeOverride) {
        const b = badgeOverride.split(":")[1];
        if (["success", "destructive", "neutral", "warning", "info"].includes(b)) {
          badgeStyle = b;
        }
      }
      return {
        numeral,
        delta,
        arrow,
        sentiment,
        badgeStyle,
        period,
        level
      };
    }
  };

  // packages/core/dist/entity/MarkdownAction.js
  var MarkdownActionHelper = class {
    static parseSingleTrigger(raw) {
      let trimmed = raw.trim().replace(/^<|>$/g, "").trim();
      if (trimmed.startsWith("action:")) {
        trimmed = trimmed.slice(7).trim();
      }
      if (trimmed.startsWith("set:")) {
        const body = trimmed.slice(4).trim();
        const assignments = {};
        const regex = /([^;=,]+)\s*=\s*([^;]+?)(?=(?:[,;]\s*[\w.]+\s*=|$))/g;
        let match;
        while ((match = regex.exec(body)) !== null) {
          const k = match[1].trim();
          const v = match[2].trim();
          assignments[k] = v;
        }
        return { type: "set", payload: body, assignments };
      }
      if (trimmed.startsWith("copy:") || trimmed.startsWith("clipboard:")) {
        return { type: "copy", payload: trimmed.replace(/^(copy|clipboard):/, "").trim() };
      }
      if (trimmed.startsWith("toggle:")) {
        return { type: "toggle", payload: trimmed.slice(7).trim() };
      }
      if (trimmed.startsWith("clear:")) {
        return { type: "clear", payload: trimmed.slice(6).trim() };
      }
      if (trimmed.startsWith("delete:") || trimmed.startsWith("remove:") || trimmed.startsWith("remove-item:")) {
        return { type: "delete", payload: trimmed.replace(/^(delete|remove|remove-item):/, "").trim() };
      }
      if (trimmed.startsWith("insert:") || trimmed.startsWith("push:") || trimmed.startsWith("insert-item:")) {
        return { type: "insert", payload: trimmed.replace(/^(insert|push|insert-item):/, "").trim() };
      }
      if (trimmed.startsWith("openExample:")) {
        return { type: "openExample", payload: trimmed.slice(12).trim() };
      }
      if (trimmed.startsWith("submit:") || trimmed.startsWith("submit(") || trimmed === "submit") {
        let payload = trimmed.replace(/^submit:?/, "").trim();
        const parenMatch = payload.match(/^\(([^)]*)\)$/);
        if (parenMatch) {
          payload = parenMatch[1].trim();
        }
        return { type: "submit", payload };
      }
      if (trimmed.startsWith("open-panel:") || trimmed.startsWith("panel:")) {
        return { type: "open-panel", payload: trimmed.replace(/^(open-panel|panel):/, "").trim().replace(/^>>>\s*/, "") };
      }
      if (trimmed.startsWith(">>>")) {
        return { type: "open-panel", payload: trimmed.replace(/^>>>\s*/, "").trim() };
      }
      if (trimmed.startsWith("event:")) {
        return { type: "event", payload: trimmed.slice(6).trim() };
      }
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("open-url:") || trimmed.startsWith("url:")) {
        return { type: "url", payload: trimmed.replace(/^(open-url|url):/, "").trim() };
      }
      return { type: "action", payload: trimmed };
    }
    /**
     * Parses trigger strings like:
     * "action:submitOrder"
     * "event:checkoutStarted"
     * "open-panel:receiptPanel"
     * "set: step = 2, status = 'active'"
     * "action:open-panel:deliveryPolicy; set:shippingOption=shipGround"
     */
    static parseTrigger(raw) {
      let trimmed = raw.trim().replace(/^<|>$/g, "").trim();
      if (trimmed.startsWith("action:")) {
        trimmed = trimmed.slice(7).trim();
      }
      const parts = [];
      let current = "";
      let inQuote = false;
      let quoteChar = "";
      let parenDepth = 0;
      for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        if ((char === '"' || char === "'") && (i === 0 || trimmed[i - 1] !== "\\")) {
          if (!inQuote) {
            inQuote = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuote = false;
          }
        } else if (!inQuote) {
          if (char === "(")
            parenDepth++;
          else if (char === ")")
            parenDepth--;
        }
        if (char === ";" && !inQuote && parenDepth === 0) {
          if (current.trim())
            parts.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      if (current.trim())
        parts.push(current.trim());
      if (parts.length <= 1) {
        return this.parseSingleTrigger(trimmed);
      }
      const subTriggers = parts.map((p) => this.parseSingleTrigger(p));
      const mergedAssignments = {};
      for (const st of subTriggers) {
        if (st.assignments) {
          Object.assign(mergedAssignments, st.assignments);
        }
      }
      const primary = subTriggers.find((t) => t.type === "open-panel" || t.type === "submit") || subTriggers[0];
      return {
        type: primary.type,
        payload: primary.payload,
        assignments: Object.keys(mergedAssignments).length > 0 ? mergedAssignments : void 0,
        triggers: subTriggers
      };
    }
    /**
     * Parses style token inside {...}
     * e.g. "{primary, icon: gear}" or "{destructive}" or "{app:pillWithIcon}"
     */
    static parseStyleAttributes(attrStr) {
      const clean = attrStr.replace(/^\{|\}$/g, "").trim();
      let style = "secondary";
      let icon;
      const attributes = {};
      if (!clean) {
        return { style, icon, attributes };
      }
      const hasCommas = /(?:^|[^"']),(?:[^"']|$)/.test(clean);
      if (hasCommas) {
        const parts = [];
        let cur = "";
        let inQuote = null;
        for (let i = 0; i < clean.length; i++) {
          const ch = clean[i];
          if ((ch === '"' || ch === "'") && (i === 0 || clean[i - 1] !== "\\")) {
            if (!inQuote)
              inQuote = ch;
            else if (inQuote === ch)
              inQuote = null;
            cur += ch;
          } else if (ch === "," && !inQuote) {
            if (cur.trim())
              parts.push(cur.trim());
            cur = "";
          } else {
            cur += ch;
          }
        }
        if (cur.trim())
          parts.push(cur.trim());
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const eqIdx = part.search(/[:=]/);
          if (eqIdx !== -1) {
            const k = part.slice(0, eqIdx).trim();
            const rawV = part.slice(eqIdx + 1).trim();
            const v = rawV.replace(/^["']|["']$/g, "");
            attributes[k] = v;
            if (k === "style")
              style = v;
            else if (k === "icon")
              icon = v;
          } else {
            if (i === 0) {
              style = part;
            } else {
              attributes[part] = "true";
            }
          }
        }
      } else {
        const regex = /([\w-]+)\s*[:=]\s*(?:"([^"]*)"|'([^']*)'|(\S+))|(\S+)/g;
        let match;
        let isFirst = true;
        while ((match = regex.exec(clean)) !== null) {
          if (match[1]) {
            const k = match[1];
            const v = match[2] ?? match[3] ?? match[4];
            attributes[k] = v;
            if (k === "style")
              style = v;
            else if (k === "icon")
              icon = v;
          } else if (match[5]) {
            const flag = match[5].trim();
            if (flag) {
              if (isFirst && !["disabled", "loading", "active"].includes(flag)) {
                style = flag;
              } else {
                attributes[flag] = "true";
              }
            }
          }
          isFirst = false;
        }
      }
      return { style, icon, attributes };
    }
  };

  // packages/core/dist/utility/DeterministicId.js
  var counters = /* @__PURE__ */ new Map();
  function resetDeterministicIds() {
    counters.clear();
  }
  function nextDeterministicId(prefix) {
    const next = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, next);
    return `${prefix}-${next}`;
  }

  // packages/core/dist/entity/MarkdownInput.js
  var MarkdownInputParser = class _MarkdownInputParser {
    static canonicalTypeOf(name) {
      const lower = name.toLowerCase();
      switch (lower) {
        case "string":
          return "text";
        case "bool":
        case "boolean":
        case "switch":
          return "toggle";
        case "multiline":
          return "textarea";
        case "date-picker":
          return "datepicker";
        case "multi-selection":
        case "multiselect":
          return "selections";
        case "single-selection":
        case "select":
        case "radio":
          return "singleSelection";
        case "range":
          return "slider";
        case "meter":
        case "progressbar":
          return "progress";
        case "searchable-picker":
          return "searchablePicker";
        default:
          return name;
      }
    }
    /**
     * Infers widget typeOf from type attribute according to SYNTAX.md §Type Inference.
     */
    static inferTypeOf(type) {
      const t = (type || "").toLowerCase().trim();
      switch (t) {
        case "string":
        case "text":
        case "email":
        case "phone":
        case "tel":
        case "number":
        case "decimal":
          return "text";
        case "multiline":
          return "textarea";
        case "date":
        case "date-picker":
        case "datepicker":
          return "datepicker";
        case "boolean":
        case "bool":
        case "toggle":
        case "switch":
          return "toggle";
        case "slider":
        case "range":
          return "slider";
        case "segmented":
          return "segmented";
        case "progress":
        case "meter":
        case "progressbar":
          return "progress";
        case "selections":
        case "multiselect":
        case "multi-selection":
          return "selections";
        case "singleselection":
        case "single-selection":
        case "select":
        case "radio":
          return "singleSelection";
        case "searchablepicker":
        case "searchable-picker":
          return "searchablePicker";
        default:
          return t || "text";
      }
    }
    /**
     * Parses a single-line input declaration:
     * e.g. ??? text "Full Name" placeholder="Jane Doe" required
     * e.g. ??? userEmail: email "Work Email"
     * e.g. ??? id=custom_pass password "Security PIN" secure
     * e.g. ??? number "Quantity" min=1 max=99 default=1
     * e.g. ??? toggle "Enable Notifications" default=true
     * e.g. ??? segmented "Billing" options=["Monthly", "Annually"] default="Monthly"
     * e.g. ??? licenseNumber "Enter License Number" disabled:!hasLicense
     */
    static parseSingleLine(line) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("???"))
        return null;
      let rest = trimmed.slice(3).trim();
      if (!rest || rest === "")
        return null;
      let explicitId;
      const idKeyMatch = rest.match(/^id=([a-zA-Z0-9_\-.[\]{}]+)\s+/);
      if (idKeyMatch) {
        explicitId = idKeyMatch[1];
        rest = rest.slice(idKeyMatch[0].length).trim();
      } else {
        const colonIdMatch = rest.match(/^([a-zA-Z0-9_\-.[\]{}]+):\s+/);
        if (colonIdMatch) {
          explicitId = colonIdMatch[1];
          rest = rest.slice(colonIdMatch[0].length).trim();
        }
      }
      const knownTypes = [
        "text",
        "email",
        "password",
        "number",
        "phone",
        "date",
        "toggle",
        "slider",
        "textarea",
        "datepicker",
        "date-picker",
        "selections",
        "multi-selection",
        "singleSelection",
        "single-selection",
        "segmented",
        "progress",
        "searchablePicker",
        "searchable-picker"
      ];
      let typeOf = "text";
      const firstWordMatch = rest.match(/^([a-zA-Z0-9_\-.[\]{}]+)\s+/);
      if (firstWordMatch) {
        const candidate = firstWordMatch[1];
        if (knownTypes.includes(candidate)) {
          typeOf = _MarkdownInputParser.canonicalTypeOf(candidate);
          rest = rest.slice(firstWordMatch[0].length).trim();
        } else if (!explicitId) {
          explicitId = candidate;
          rest = rest.slice(firstWordMatch[0].length).trim();
          const nextWordMatch = rest.match(/^([a-zA-Z0-9_\-]+)\s+/);
          if (nextWordMatch && knownTypes.includes(nextWordMatch[1])) {
            typeOf = _MarkdownInputParser.canonicalTypeOf(nextWordMatch[1]);
            rest = rest.slice(nextWordMatch[0].length).trim();
          }
        }
      }
      let label = "";
      const labelMatch = rest.match(/^(?:"([^"]*)"|'([^']*)')/);
      if (labelMatch) {
        label = labelMatch[1] ?? labelMatch[2] ?? "";
        rest = rest.slice(labelMatch[0].length).trim();
      }
      if (rest.length > 0) {
        const afterTypeMatch = rest.match(/^([a-zA-Z0-9_\-]+)(?:\s+|$)/);
        if (afterTypeMatch && knownTypes.includes(afterTypeMatch[1])) {
          typeOf = afterTypeMatch[1];
          rest = rest.slice(afterTypeMatch[0].length).trim();
        }
      }
      let id = explicitId;
      if (!id) {
        if (label) {
          id = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        } else {
          id = nextDeterministicId("input");
        }
      }
      const attributes = {};
      const rules = [];
      let required;
      let secure = typeOf === "password";
      let disabled = false;
      let disabledExpr;
      let placeholder;
      let defaultValue = void 0;
      let min;
      let max;
      let step;
      let lines;
      let group;
      let options;
      let style;
      let notesPanelId;
      const tokens = this.parseAttributeTokens(rest);
      for (const token of tokens) {
        if (token.key === "secure") {
          secure = true;
        } else if (token.key === "required") {
          required = token.value !== void 0 ? token.value ? token.value.replace(/^['"]|['"]$/g, "") : true : true;
        } else if (token.key === "disabled") {
          if (token.value) {
            disabledExpr = token.value;
          } else {
            disabled = true;
          }
        } else if (token.key.startsWith("disabled:")) {
          disabledExpr = token.key.slice(9) + (token.value ? `=${token.value}` : "");
        } else if (token.key === "placeholder") {
          placeholder = token.value;
        } else if (token.key === "default" || token.key === "defaultValue") {
          let val = token.value;
          if (typeof val === "string") {
            val = val.replace(/^['"]|['"]$/g, "");
          }
          defaultValue = val === "true" ? true : val === "false" ? false : !isNaN(Number(val)) && val !== "" ? Number(val) : val;
        } else if (token.key === "min") {
          min = !isNaN(Number(token.value)) ? Number(token.value) : token.value;
        } else if (token.key === "max") {
          max = !isNaN(Number(token.value)) ? Number(token.value) : token.value;
        } else if (token.key === "step") {
          step = Number(token.value);
        } else if (token.key === "lines") {
          lines = Number(token.value);
        } else if (token.key === "group") {
          group = token.value;
        } else if (token.key === "style") {
          style = token.value;
        } else if (token.key === "notes" && token.value?.startsWith(">>>")) {
          notesPanelId = token.value.slice(3).trim();
        } else if (token.key === "options") {
          if (token.value) {
            try {
              options = JSON.parse(token.value.replace(/'/g, '"'));
            } catch {
              options = token.value.replace(/^\[|\]$/g, "").split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
            }
          }
        } else if (token.key === "rule") {
          if (token.value) {
            const ruleParts = token.value.split("->").map((s) => s.trim());
            rules.push({ expr: ruleParts[0], message: ruleParts[1]?.replace(/^['"]|['"]$/g, "") || "Validation failed" });
          }
        } else {
          attributes[token.key] = token.value ?? "true";
        }
      }
      return {
        id,
        typeOf,
        label: label || id,
        placeholder,
        defaultValue,
        min,
        max,
        step,
        lines,
        group,
        options,
        style,
        secure,
        required,
        rules,
        disabled,
        disabledExpr,
        notesPanelId,
        attributes
      };
    }
    static parseAttributeTokens(input) {
      const tokens = [];
      let i = 0;
      const len = input.length;
      while (i < len) {
        while (i < len && /\s/.test(input[i]))
          i++;
        if (i >= len)
          break;
        let key = "";
        while (i < len && !/\s|[:=]/.test(input[i])) {
          key += input[i++];
        }
        if (key === "disabled" && i < len && input[i] === ":") {
          i++;
          while (i < len && /\s/.test(input[i]))
            i++;
          let value = "";
          while (i < len && !/\s/.test(input[i])) {
            value += input[i++];
          }
          tokens.push({ key: "disabled", value });
          continue;
        }
        if (i < len && (input[i] === ":" || input[i] === "=")) {
          i++;
          while (i < len && /\s/.test(input[i]))
            i++;
          if (i >= len) {
            tokens.push({ key });
            break;
          }
          let value = "";
          if (input[i] === '"' || input[i] === "'") {
            const quote = input[i++];
            while (i < len) {
              if (input[i] === "\\" && i + 1 < len) {
                i++;
                value += input[i++];
              } else if (input[i] === quote) {
                i++;
                break;
              } else {
                value += input[i++];
              }
            }
          } else if (input[i] === "[") {
            let depth = 0;
            let inQuote = null;
            while (i < len) {
              const ch = input[i++];
              value += ch;
              if (inQuote) {
                if (ch === "\\" && i < len) {
                  value += input[i++];
                } else if (ch === inQuote) {
                  inQuote = null;
                }
              } else {
                if (ch === '"' || ch === "'") {
                  inQuote = ch;
                } else if (ch === "[") {
                  depth++;
                } else if (ch === "]") {
                  depth--;
                  if (depth === 0)
                    break;
                }
              }
            }
          } else {
            while (i < len && !/\s/.test(input[i])) {
              value += input[i++];
            }
          }
          tokens.push({ key, value });
        } else {
          tokens.push({ key });
        }
      }
      return tokens;
    }
  };

  // packages/core/dist/entity/MarkdownGroup.js
  var MarkdownGroupHelper = class {
    /**
     * Splits single-line container content on `|` only when `|` is a cell separator
     * (outside `{{ ... }}`, `[...](...)`, quotes, and not `||` or `\|`).
     */
    static splitSingleLineCells(content) {
      const cells = [];
      let current = "";
      let inQuote = null;
      let interpDepth = 0;
      let bracketDepth = 0;
      let parenDepth = 0;
      for (let i = 0; i < content.length; i++) {
        const ch = content[i];
        if (ch === "\\" && i + 1 < content.length) {
          current += ch + content[i + 1];
          i++;
          continue;
        }
        if ((ch === '"' || ch === "'") && interpDepth === 0) {
          if (inQuote === null) {
            inQuote = ch;
          } else if (inQuote === ch) {
            inQuote = null;
          }
          current += ch;
          continue;
        }
        if (!inQuote) {
          if (ch === "{" && content[i + 1] === "{") {
            interpDepth++;
            current += "{{";
            i++;
            continue;
          }
          if (ch === "}" && content[i + 1] === "}" && interpDepth > 0) {
            interpDepth--;
            current += "}}";
            i++;
            continue;
          }
          if (interpDepth === 0) {
            if (ch === "[")
              bracketDepth++;
            else if (ch === "]" && bracketDepth > 0)
              bracketDepth--;
            else if (ch === "(")
              parenDepth++;
            else if (ch === ")" && parenDepth > 0)
              parenDepth--;
          }
        }
        if (ch === "|" && !inQuote && interpDepth === 0 && bracketDepth === 0 && parenDepth === 0 && content[i + 1] !== "|" && (i === 0 || content[i - 1] !== "|")) {
          cells.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      if (current.trim().length > 0 || cells.length > 0) {
        cells.push(current.trim());
      }
      return cells;
    }
    static parseFence(line) {
      const trimmed = line.trim();
      const content = trimmed.replace(/^:::\s*/, "").trim();
      if (!content) {
        return {
          id: nextDeterministicId("group"),
          style: "plain",
          compoundStyles: ["plain"],
          isCustomStyle: false,
          attributes: {}
        };
      }
      let singleLineContent;
      const cleanContent = content.replace(/\s*:::\s*$/, "");
      let mainHeader = cleanContent;
      const splitCells = this.splitSingleLineCells(cleanContent);
      if (splitCells.length >= 2) {
        singleLineContent = cleanContent;
      }
      const tokens = [];
      let curToken = "";
      let inQuote = null;
      for (let ci = 0; ci < mainHeader.length; ci++) {
        const ch = mainHeader[ci];
        if ((ch === '"' || ch === "'") && (inQuote === null || inQuote === ch)) {
          inQuote = inQuote === null ? ch : null;
          curToken += ch;
        } else if (/\s/.test(ch) && !inQuote) {
          if (curToken) {
            tokens.push(curToken);
            curToken = "";
          }
        } else {
          curToken += ch;
        }
      }
      if (curToken)
        tokens.push(curToken);
      while (tokens.length > 1 && (tokens[0].endsWith(",") || tokens[0].endsWith("+") || tokens[1].startsWith(",") || tokens[1].startsWith("+"))) {
        tokens[0] = tokens[0] + tokens.splice(1, 1)[0];
      }
      const first = tokens[0] || "plain";
      let style = "plain";
      let id = "";
      const attributes = {};
      let condition;
      const knownArchetypes = [
        "card",
        "positive-card",
        "negative-card",
        "neutral-card",
        "table-view",
        "list",
        "hero",
        "carousel",
        "grid",
        "auto",
        "flow",
        "row",
        "column",
        "plain",
        "spacer",
        "skeleton",
        "live-content",
        "chart",
        "bar-chart",
        "horizontal-bar-chart",
        "line-chart",
        "area-chart",
        "point-chart",
        "scatter-chart",
        "pie-chart",
        "donut-chart",
        "progress-chart",
        "progress",
        // CamelCase variants for backwards compatibility
        "positiveCard",
        "negativeCard",
        "neutralCard",
        "tableview",
        "liveContent",
        "barChart",
        "horizontalBarChart",
        "lineChart",
        "areaChart",
        "pointChart",
        "scatterChart",
        "pieChart",
        "donutChart",
        "progressChart"
      ];
      const isCompound = first.includes("+") || first.includes(",");
      const isNamespaced = first.includes(":") && !first.startsWith("if:") && !first.startsWith("unless:");
      const isKnown = knownArchetypes.includes(first) || knownArchetypes.includes(first.toLowerCase());
      let startIdx = 1;
      style = first;
      if (tokens[1] && !tokens[1].includes("=") && !tokens[1].includes(":") && !tokens[1].startsWith("{")) {
        if (first.toLowerCase() === "spacer" && /^\d+(px|pt|rem)?$/.test(tokens[1])) {
          attributes.height = tokens[1];
          id = nextDeterministicId("spacer");
          startIdx = 2;
        } else {
          id = tokens[1];
          startIdx = 2;
        }
      } else {
        id = nextDeterministicId("group");
      }
      const cleanCondition = (raw, stripClosingParen) => {
        let c = raw.trim();
        if (stripClosingParen && c.endsWith(")")) {
          c = c.slice(0, -1).trim();
        }
        if (c.startsWith('"') && c.endsWith('"') || c.startsWith("'") && c.endsWith("'")) {
          const inner = c.slice(1, -1);
          if (!inner.includes(c[0])) {
            c = inner.trim();
          }
        }
        return c;
      };
      for (let ti = startIdx; ti < tokens.length; ti++) {
        let token = tokens[ti];
        let hadLeadingParen = false;
        if (token.startsWith("{") && token.endsWith("}") || token.startsWith("(") && token.endsWith(")")) {
          token = token.slice(1, -1);
        } else if (token.startsWith("(")) {
          token = token.slice(1);
          hadLeadingParen = true;
        }
        if (token === "if:" || token === "if=") {
          if (ti + 1 < tokens.length) {
            const firstCondToken = tokens[++ti];
            if (firstCondToken.startsWith('"') || firstCondToken.startsWith("'")) {
              condition = cleanCondition(firstCondToken, hadLeadingParen);
            } else {
              const condParts = [firstCondToken];
              while (ti + 1 < tokens.length && !tokens[ti + 1].startsWith("{") && !tokens[ti + 1].endsWith(":") && !/^[a-zA-Z0-9_-]+[:=]/.test(tokens[ti + 1])) {
                condParts.push(tokens[++ti]);
              }
              condition = cleanCondition(condParts.join(" "), hadLeadingParen);
            }
          }
        } else if (token.startsWith("if:") || token.startsWith("if=")) {
          const firstCond = token.slice(3);
          if (firstCond.startsWith('"') || firstCond.startsWith("'")) {
            condition = cleanCondition(firstCond, hadLeadingParen);
          } else {
            const condParts = [firstCond];
            while (ti + 1 < tokens.length && !tokens[ti + 1].startsWith("{") && !tokens[ti + 1].endsWith(":") && !/^[a-zA-Z0-9_-]+[:=]/.test(tokens[ti + 1])) {
              condParts.push(tokens[++ti]);
            }
            condition = cleanCondition(condParts.join(" "), hadLeadingParen);
          }
        } else if (token === "unless:" || token === "unless=") {
          if (ti + 1 < tokens.length) {
            const firstCondToken = tokens[++ti];
            if (firstCondToken.startsWith('"') || firstCondToken.startsWith("'")) {
              condition = `!(${cleanCondition(firstCondToken, hadLeadingParen)})`;
            } else {
              const condParts = [firstCondToken];
              while (ti + 1 < tokens.length && !tokens[ti + 1].startsWith("{") && !tokens[ti + 1].endsWith(":") && !/^[a-zA-Z0-9_-]+[:=]/.test(tokens[ti + 1])) {
                condParts.push(tokens[++ti]);
              }
              condition = `!(${cleanCondition(condParts.join(" "), hadLeadingParen)})`;
            }
          }
        } else if (token.startsWith("unless:") || token.startsWith("unless=")) {
          const firstCond = token.slice(7);
          if (firstCond.startsWith('"') || firstCond.startsWith("'")) {
            condition = `!(${cleanCondition(firstCond, hadLeadingParen)})`;
          } else {
            const condParts = [firstCond];
            while (ti + 1 < tokens.length && !tokens[ti + 1].startsWith("{") && !tokens[ti + 1].endsWith(":") && !/^[a-zA-Z0-9_-]+[:=]/.test(tokens[ti + 1])) {
              condParts.push(tokens[++ti]);
            }
            condition = `!(${cleanCondition(condParts.join(" "), hadLeadingParen)})`;
          }
        } else if (token.endsWith(":") && ti + 1 < tokens.length) {
          const k = token.slice(0, -1);
          const v = tokens[++ti].replace(/^['"]|['"]$/g, "").replace(/\)+$/, "");
          if (k === "id")
            id = v;
          attributes[k] = v;
        } else if (token.includes("=")) {
          const eq = token.indexOf("=");
          const k = token.slice(0, eq);
          const v = token.slice(eq + 1).replace(/^['"]|['"]$/g, "").replace(/\)+$/, "");
          if (k === "id")
            id = v;
          attributes[k] = v;
        } else if (token.includes(":")) {
          const colon = token.indexOf(":");
          const k = token.slice(0, colon);
          const v = token.slice(colon + 1).replace(/^['"]|['"]$/g, "").replace(/\)+$/, "");
          if (k === "id")
            id = v;
          attributes[k] = v;
        } else {
          const cleanTok = token.replace(/\)+$/, "");
          attributes[cleanTok] = "true";
        }
      }
      const compoundStyles = style.split(/[+,]/).map((s) => s.trim()).filter(Boolean);
      const isCustomStyle = !isKnown && !compoundStyles.every((s) => knownArchetypes.includes(s) || knownArchetypes.includes(s.toLowerCase()));
      if (condition && !attributes.if) {
        attributes.if = condition;
      }
      return {
        id,
        style,
        compoundStyles,
        condition,
        isCustomStyle,
        attributes,
        singleLineContent
      };
    }
  };

  // packages/core/dist/entity/MarkdownTheme.js
  function themeToCssVariables(theme) {
    const vars = {};
    if (theme.colors) {
      if (theme.colors.primary)
        vars["--mdui-color-primary"] = theme.colors.primary;
      if (theme.colors.primaryHover)
        vars["--mdui-color-primary-hover"] = theme.colors.primaryHover;
      if (theme.colors.primaryText)
        vars["--mdui-color-primary-text"] = theme.colors.primaryText;
      if (theme.colors.secondary)
        vars["--mdui-color-secondary"] = theme.colors.secondary;
      if (theme.colors.secondaryHover)
        vars["--mdui-color-secondary-hover"] = theme.colors.secondaryHover;
      if (theme.colors.secondaryText)
        vars["--mdui-color-secondary-text"] = theme.colors.secondaryText;
      if (theme.colors.destructive)
        vars["--mdui-color-destructive"] = theme.colors.destructive;
      if (theme.colors.destructiveHover)
        vars["--mdui-color-destructive-hover"] = theme.colors.destructiveHover;
      if (theme.colors.destructiveText)
        vars["--mdui-color-destructive-text"] = theme.colors.destructiveText;
      if (theme.colors.background)
        vars["--mdui-color-background"] = theme.colors.background;
      if (theme.colors.surface)
        vars["--mdui-color-surface"] = theme.colors.surface;
      if (theme.colors.surfaceSubtle)
        vars["--mdui-color-surface-subtle"] = theme.colors.surfaceSubtle;
      if (theme.colors.border)
        vars["--mdui-color-border"] = theme.colors.border;
      if (theme.colors.borderSubtle)
        vars["--mdui-color-border-subtle"] = theme.colors.borderSubtle;
      if (theme.colors.text)
        vars["--mdui-color-text"] = theme.colors.text;
      if (theme.colors.textMuted)
        vars["--mdui-color-text-muted"] = theme.colors.textMuted;
      if (theme.colors.textTertiary)
        vars["--mdui-color-text-tertiary"] = theme.colors.textTertiary;
      if (theme.colors.success)
        vars["--mdui-color-success"] = theme.colors.success;
      if (theme.colors.successBackground)
        vars["--mdui-color-success-bg"] = theme.colors.successBackground;
      if (theme.colors.successBorder)
        vars["--mdui-color-success-border"] = theme.colors.successBorder;
      if (theme.colors.warning)
        vars["--mdui-color-warning"] = theme.colors.warning;
      if (theme.colors.warningBackground)
        vars["--mdui-color-warning-bg"] = theme.colors.warningBackground;
      if (theme.colors.warningBorder)
        vars["--mdui-color-warning-border"] = theme.colors.warningBorder;
      if (theme.colors.accent)
        vars["--mdui-color-accent"] = theme.colors.accent;
      if (theme.colors.cardBackground)
        vars["--mdui-color-card-bg"] = theme.colors.cardBackground;
      if (theme.colors.codeBackground)
        vars["--mdui-color-code-bg"] = theme.colors.codeBackground;
      if (theme.colors.codeText)
        vars["--mdui-color-code-text"] = theme.colors.codeText;
    }
    if (theme.typography) {
      if (theme.typography.fontFamily)
        vars["--mdui-font-family"] = theme.typography.fontFamily;
      if (theme.typography.fontFamilyMono)
        vars["--mdui-font-mono"] = theme.typography.fontFamilyMono;
      if (theme.typography.fontSizeBase)
        vars["--mdui-font-size-base"] = theme.typography.fontSizeBase;
      if (theme.typography.lineHeight)
        vars["--mdui-line-height"] = theme.typography.lineHeight;
      if (theme.typography.h1Size)
        vars["--mdui-font-size-h1"] = theme.typography.h1Size;
      if (theme.typography.h2Size)
        vars["--mdui-font-size-h2"] = theme.typography.h2Size;
      if (theme.typography.h3Size)
        vars["--mdui-font-size-h3"] = theme.typography.h3Size;
      if (theme.typography.h4Size)
        vars["--mdui-font-size-h4"] = theme.typography.h4Size;
      if (theme.typography.h5Size)
        vars["--mdui-font-size-h5"] = theme.typography.h5Size;
      if (theme.typography.h6Size)
        vars["--mdui-font-size-h6"] = theme.typography.h6Size;
    }
    if (theme.spacing) {
      if (theme.spacing.base)
        vars["--mdui-spacing"] = theme.spacing.base;
      if (theme.spacing.xs)
        vars["--mdui-spacing-xs"] = theme.spacing.xs;
      if (theme.spacing.sm)
        vars["--mdui-spacing-sm"] = theme.spacing.sm;
      if (theme.spacing.md)
        vars["--mdui-spacing-md"] = theme.spacing.md;
      if (theme.spacing.lg)
        vars["--mdui-spacing-lg"] = theme.spacing.lg;
      if (theme.spacing.xl)
        vars["--mdui-spacing-xl"] = theme.spacing.xl;
      if (theme.spacing.maxParagraphWidth)
        vars["--mdui-max-paragraph-width"] = theme.spacing.maxParagraphWidth;
      if (theme.spacing.maxInputWidth)
        vars["--mdui-max-input-width"] = theme.spacing.maxInputWidth;
    }
    if (theme.radii) {
      if (theme.radii.card)
        vars["--mdui-radius-card"] = theme.radii.card;
      if (theme.radii.button)
        vars["--mdui-radius-button"] = theme.radii.button;
      if (theme.radii.input)
        vars["--mdui-radius-input"] = theme.radii.input;
      if (theme.radii.badge)
        vars["--mdui-radius-badge"] = theme.radii.badge;
      if (theme.radii.code)
        vars["--mdui-radius-code"] = theme.radii.code;
    }
    if (theme.shadows) {
      if (theme.shadows.sm)
        vars["--mdui-shadow-sm"] = theme.shadows.sm;
      if (theme.shadows.md)
        vars["--mdui-shadow-md"] = theme.shadows.md;
      if (theme.shadows.lg)
        vars["--mdui-shadow-lg"] = theme.shadows.lg;
      if (theme.shadows.card)
        vars["--mdui-shadow-card"] = theme.shadows.card;
    }
    return vars;
  }

  // packages/core/dist/utility/DateParser.js
  var SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var LONG_MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  var DateParser = class {
    static parse(input) {
      if (input === void 0 || input === null || input === "")
        return null;
      if (input instanceof Date)
        return isNaN(input.getTime()) ? null : input;
      if (typeof input === "number") {
        if (isNaN(input))
          return null;
        const ms = input > 1e8 && input < 1e11 ? input * 1e3 : input;
        const d = new Date(ms);
        return isNaN(d.getTime()) ? null : d;
      }
      const trimmed = String(input).trim();
      if (!trimmed)
        return null;
      const lower = trimmed.toLowerCase();
      const now = /* @__PURE__ */ new Date();
      if (lower === "today" || lower === "now") {
        return now;
      }
      if (lower === "tomorrow") {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      }
      if (lower === "yesterday") {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
      }
      if (/^\d+(\.\d+)?$/.test(trimmed)) {
        const num = Number(trimmed);
        const ms = num > 1e8 && num < 1e11 ? num * 1e3 : num;
        const d = new Date(ms);
        return isNaN(d.getTime()) ? null : d;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [year, month, day] = trimmed.split("-").map(Number);
        return new Date(year, month - 1, day);
      }
      const parsed = new Date(trimmed);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    static format(date, pattern = "MMM d, yyyy") {
      if (!date || isNaN(date.getTime()))
        return "";
      const y = date.getFullYear();
      const yy = String(y).slice(-2);
      const monthIdx = date.getMonth();
      const M = String(monthIdx + 1);
      const MM = M.padStart(2, "0");
      const MMM = SHORT_MONTHS[monthIdx];
      const MMMM = LONG_MONTHS[monthIdx];
      const dNum = date.getDate();
      const d = String(dNum);
      const dd = d.padStart(2, "0");
      const H24 = date.getHours();
      const HH = String(H24).padStart(2, "0");
      const h12 = H24 % 12 === 0 ? 12 : H24 % 12;
      const h = String(h12);
      const hh = h.padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      const ampm = H24 >= 12 ? "PM" : "AM";
      const tokens = {
        yyyy: String(y),
        yy,
        MMMM,
        MMM,
        MM,
        M,
        dd,
        d,
        HH,
        hh,
        h,
        mm,
        ss,
        a: ampm
      };
      return pattern.replace(/yyyy|yy|MMMM|MMM|MM|M|dd|d|HH|hh|h|mm|ss|a/g, (match) => tokens[match] ?? match);
    }
  };

  // packages/core/dist/utility/MarkdownCustomBody.js
  var MarkdownCustomBody = class {
    raw;
    constructor(raw = "") {
      this.raw = raw;
    }
    /**
     * Raw lines preserving exact whitespace and empty lines.
     */
    get lines() {
      return this.raw.split("\n");
    }
    /**
     * Cleaned line arrays filtering empty lines and comment markers (#, //).
     */
    get trimmedLines() {
      return this.lines.map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("//"));
    }
    /**
     * Pre-parsed dictionary from lines matching `key: value`.
     */
    get keyValues() {
      const dict = {};
      for (const line of this.trimmedLines) {
        const idx = line.indexOf(":");
        if (idx !== -1) {
          const key = line.slice(0, idx).trim();
          const value = line.slice(idx + 1).trim();
          dict[key] = value;
        }
      }
      return dict;
    }
    /**
     * 2D matrix of delimited rows (CSV, TSV, or pipe-delimited).
     */
    table(delimiter) {
      const lines = this.trimmedLines;
      if (lines.length === 0)
        return [];
      let delim = delimiter;
      if (!delim) {
        const firstLine = lines[0];
        if (firstLine.includes("|"))
          delim = "|";
        else if (firstLine.includes("	"))
          delim = "	";
        else if (firstLine.includes(","))
          delim = ",";
        else
          delim = " ";
      }
      return lines.map((line) => {
        let parts = line.split(delim);
        if (delim === "|") {
          if (parts[0].trim() === "")
            parts.shift();
          if (parts.length > 0 && parts[parts.length - 1].trim() === "")
            parts.pop();
        }
        return parts.map((p) => p.trim());
      });
    }
    /**
     * Safe JSON deserialization.
     */
    decodeJSON() {
      try {
        const trimmed = this.raw.trim();
        if (!trimmed)
          return null;
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    }
  };

  // packages/core/dist/utility/ExpressionEvaluator.js
  var ExpressionEvaluator = class {
    /**
     * Safely evaluates mathematical, logical, and computed MDUI expressions.
     * e.g.:
     *   "headphonePrice * headphoneQty + cablePrice * cableQty + walletPrice * walletQty"
     *   "subtotal * 8.25%"
     *   "case(shippingOption, shipExpress: 15.00, shipSameDay: 25.00, 0.00)"
     *   "totalTasks > 0 ? round((completedTasks * 100) / totalTasks) : 0"
     */
    static evaluate(expr, state) {
      if (!expr || typeof expr !== "string")
        return expr;
      const trimmed = expr.trim();
      if (!trimmed)
        return "";
      if (trimmed in state) {
        return state[trimmed];
      }
      try {
        const tokens = this.tokenize(trimmed);
        if (tokens.length === 0)
          return "";
        const parser = new ExprParser(tokens, state);
        return parser.parse();
      } catch {
        const direct = resolveVariablePath(state, trimmed);
        if (direct !== void 0)
          return direct;
        if (!isNaN(Number(trimmed)) && trimmed !== "")
          return Number(trimmed);
        if (trimmed === "true")
          return true;
        if (trimmed === "false")
          return false;
        return trimmed.replace(/^['"]|['"]$/g, "");
      }
    }
    static tokenize(input) {
      const tokens = [];
      let i = 0;
      const len = input.length;
      while (i < len) {
        const ch = input[i];
        if (/\s/.test(ch)) {
          i++;
          continue;
        }
        if (ch === '"' || ch === "'") {
          const quote = ch;
          let str = "";
          i++;
          while (i < len && input[i] !== quote) {
            if (input[i] === "\\" && i + 1 < len) {
              i++;
              str += input[i];
            } else {
              str += input[i];
            }
            i++;
          }
          i++;
          tokens.push(quote + str + quote);
          continue;
        }
        const two = input.slice(i, i + 2);
        if (["==", "!=", "<=", ">=", "||", "&&"].includes(two)) {
          tokens.push(two);
          i += 2;
          continue;
        }
        if (["+", "-", "*", "/", "%", "?", ":", "(", ")", ",", "<", ">", "!"].includes(ch)) {
          tokens.push(ch);
          i++;
          continue;
        }
        if (/\d/.test(ch) || ch === "." && i + 1 < len && /\d/.test(input[i + 1])) {
          let numStr = "";
          while (i < len && (/[\d.]/.test(input[i]) || input[i] === "%")) {
            numStr += input[i];
            if (input[i] === "%") {
              i++;
              break;
            }
            i++;
          }
          tokens.push(numStr);
          continue;
        }
        if (/[a-zA-Z_$]/.test(ch)) {
          let ident = "";
          while (i < len && (/[a-zA-Z0-9_$.]/.test(input[i]) || input[i] === "-" && (ident === "loop" || ident.startsWith("loop-")))) {
            ident += input[i];
            i++;
          }
          tokens.push(ident);
          continue;
        }
        i++;
      }
      return tokens;
    }
  };
  var ExprParser = class {
    tokens;
    state;
    pos = 0;
    constructor(tokens, state) {
      this.tokens = tokens;
      this.state = state;
    }
    parse() {
      const val = this.parseTernary();
      return val;
    }
    peek() {
      return this.tokens[this.pos];
    }
    consume(expected) {
      const cur = this.tokens[this.pos];
      if (expected !== void 0 && cur !== expected) {
        throw new Error(`Expected '${expected}', got '${cur}'`);
      }
      this.pos++;
      return cur;
    }
    parseTernary() {
      let cond = this.parseLogicalOr();
      if (this.peek() === "?") {
        this.consume("?");
        const trueBranch = this.parseTernary();
        this.consume(":");
        const falseBranch = this.parseTernary();
        return Boolean(cond) ? trueBranch : falseBranch;
      }
      return cond;
    }
    parseLogicalOr() {
      let left = this.parseLogicalAnd();
      while (this.peek() === "||" || this.peek()?.toLowerCase() === "or") {
        this.consume();
        const right = this.parseLogicalAnd();
        left = Boolean(left) || Boolean(right);
      }
      return left;
    }
    parseLogicalAnd() {
      let left = this.parseEquality();
      while (this.peek() === "&&" || this.peek()?.toLowerCase() === "and") {
        this.consume();
        const right = this.parseEquality();
        left = Boolean(left) && Boolean(right);
      }
      return left;
    }
    parseEquality() {
      let left = this.parseRelational();
      while (this.peek() === "==" || this.peek() === "!=") {
        const op = this.consume();
        const right = this.parseRelational();
        if (op === "==")
          left = left == right;
        else
          left = left != right;
      }
      return left;
    }
    parseRelational() {
      let left = this.parseAdditive();
      while (["<", "<=", ">", ">="].includes(this.peek() || "")) {
        const op = this.consume();
        const right = this.parseAdditive();
        const numL = Number(left);
        const numR = Number(right);
        if (!isNaN(numL) && !isNaN(numR)) {
          if (op === "<")
            left = numL < numR;
          else if (op === "<=")
            left = numL <= numR;
          else if (op === ">")
            left = numL > numR;
          else if (op === ">=")
            left = numL >= numR;
        } else {
          if (op === "<")
            left = String(left) < String(right);
          else if (op === "<=")
            left = String(left) <= String(right);
          else if (op === ">")
            left = String(left) > String(right);
          else if (op === ">=")
            left = String(left) >= String(right);
        }
      }
      return left;
    }
    parseAdditive() {
      let left = this.parseMultiplicative();
      while (this.peek() === "+" || this.peek() === "-") {
        const op = this.consume();
        const right = this.parseMultiplicative();
        const numL = Number(left);
        const numR = Number(right);
        if (op === "+") {
          if (typeof left === "string" || typeof right === "string") {
            if (!isNaN(numL) && !isNaN(numR) && left !== "" && right !== "") {
              left = numL + numR;
            } else {
              left = String(left) + String(right);
            }
          } else {
            left = (isNaN(numL) ? 0 : numL) + (isNaN(numR) ? 0 : numR);
          }
        } else {
          left = (isNaN(numL) ? 0 : numL) - (isNaN(numR) ? 0 : numR);
        }
      }
      return left;
    }
    parseMultiplicative() {
      let left = this.parseUnary();
      while (this.peek() === "*" || this.peek() === "/" || this.peek() === "%") {
        const op = this.consume();
        const right = this.parseUnary();
        const numL = Number(left);
        const numR = Number(right);
        if (op === "*") {
          left = (isNaN(numL) ? 0 : numL) * (isNaN(numR) ? 0 : numR);
        } else if (op === "/") {
          left = numR !== 0 ? (isNaN(numL) ? 0 : numL) / numR : 0;
        } else if (op === "%") {
          left = numR !== 0 ? (isNaN(numL) ? 0 : numL) % numR : 0;
        }
      }
      return left;
    }
    parseUnary() {
      const cur = this.peek();
      if (cur === "!") {
        this.consume("!");
        return !this.parseUnary();
      }
      if (cur === "-") {
        this.consume("-");
        const val = this.parseUnary();
        return -Number(val);
      }
      if (cur === "+") {
        this.consume("+");
        return Number(this.parseUnary());
      }
      return this.parsePrimary();
    }
    parsePrimary() {
      const token = this.peek();
      if (!token)
        return void 0;
      if (token === "(") {
        this.consume("(");
        const val = this.parseTernary();
        this.consume(")");
        return val;
      }
      if (/^\d+(\.\d+)?%?$/.test(token)) {
        this.consume();
        if (token.endsWith("%")) {
          return parseFloat(token.slice(0, -1)) / 100;
        }
        return parseFloat(token);
      }
      if (token.startsWith('"') && token.endsWith('"') || token.startsWith("'") && token.endsWith("'")) {
        this.consume();
        return token.slice(1, -1);
      }
      if (token === "true") {
        this.consume();
        return true;
      }
      if (token === "false") {
        this.consume();
        return false;
      }
      if (token === "null") {
        this.consume();
        return null;
      }
      this.consume();
      if (this.peek() === "(") {
        return this.parseFunctionCall(token);
      }
      return this.resolveIdentifier(token);
    }
    parseFunctionCall(fnName) {
      this.consume("(");
      const lower = fnName.toLowerCase();
      if (lower === "case") {
        return this.parseCaseFunction();
      }
      const args = [];
      if (this.peek() !== ")") {
        args.push(this.parseTernary());
        while (this.peek() === ",") {
          this.consume(",");
          args.push(this.parseTernary());
        }
      }
      this.consume(")");
      switch (lower) {
        case "round":
          return Math.round(Number(args[0]));
        case "floor":
          return Math.floor(Number(args[0]));
        case "ceil":
          return Math.ceil(Number(args[0]));
        case "abs":
          return Math.abs(Number(args[0]));
        case "min":
          return Math.min(...args.map((a) => Number(a)));
        case "max":
          return Math.max(...args.map((a) => Number(a)));
        default:
          return args[0];
      }
    }
    /**
     * Handles: case(shippingOption, shipExpress: 15.00, shipSameDay: 25.00, 0.00)
     * and string returns: case(shippingOption, shipExpress: 'Express...', 'Standard Ground')
     */
    parseCaseFunction() {
      const targetVal = this.parseTernary();
      const targetStr = String(targetVal ?? "").toLowerCase().trim();
      let matchedVal = void 0;
      let fallbackVal = void 0;
      let foundMatch = false;
      while (this.peek() === ",") {
        this.consume(",");
        const keyToken = this.parseTernary();
        if (this.peek() === ":") {
          this.consume(":");
          const branchVal = this.parseTernary();
          const branchKeyStr = String(keyToken ?? "").toLowerCase().trim();
          if (!foundMatch && (branchKeyStr === targetStr || targetStr === "" && branchKeyStr === "default")) {
            matchedVal = branchVal;
            foundMatch = true;
          }
        } else {
          fallbackVal = keyToken;
        }
      }
      this.consume(")");
      if (foundMatch)
        return matchedVal;
      return fallbackVal;
    }
    resolveIdentifier(name) {
      if (name.includes(".")) {
        const parts = name.split(".");
        const prop = parts[parts.length - 1];
        const rootPath = parts.slice(0, -1).join(".");
        const target = resolveVariablePath(this.state, rootPath) ?? this.state[rootPath];
        if (Array.isArray(target)) {
          if (prop === "count" || prop === "length") {
            return target.length;
          }
          if (prop === "completedCount") {
            return target.filter((item) => item && item.isCompleted).length;
          }
          if (prop === "pendingCount") {
            return target.filter((item) => item && !item.isCompleted).length;
          }
        }
      }
      const val = resolveVariablePath(this.state, name);
      if (val !== void 0)
        return val;
      if (this.state[name] !== void 0)
        return this.state[name];
      return name;
    }
  };

  // packages/core/dist/utility/TemplateInterpolator.js
  var KNOWN_FILTER_NAMES = /* @__PURE__ */ new Set([
    "currency",
    "number",
    "decimal",
    "percent",
    "relative",
    "relativetime",
    "countdown",
    "date",
    "date-short",
    "date-long",
    "date-time",
    "phone",
    "uppercase",
    "upper",
    "lowercase",
    "lower",
    "capitalize",
    "list",
    "display",
    "text"
  ]);
  var TemplateInterpolator = class {
    /**
     * Cache for numeric-seconds countdown anchors per state object so a plain number
     * of seconds (e.g. `300`) counts down from first observation rather than reading as 1970.
     */
    static countdownAnchors = /* @__PURE__ */ new WeakMap();
    /**
     * Interpolates expressions inside {{ ... }} within a text string.
     * Uses a balanced scanner so expressions containing `}` (e.g. object literals)
     * or trailing style blocks (`{{ expr }{.bold}`) are matched accurately.
     */
    static interpolate(text, state) {
      if (!text || !text.includes("{{"))
        return text;
      let result = "";
      let i = 0;
      const len = text.length;
      while (i < len) {
        const start = text.indexOf("{{", i);
        if (start === -1) {
          result += text.slice(i);
          break;
        }
        result += text.slice(i, start);
        let cursor = start + 2;
        let braceDepth = 0;
        let inQuote = null;
        let endIdx = -1;
        while (cursor < len) {
          const ch = text[cursor];
          if (inQuote) {
            if (ch === "\\" && cursor + 1 < len) {
              cursor += 2;
              continue;
            }
            if (ch === inQuote) {
              inQuote = null;
            }
            cursor++;
            continue;
          }
          if (ch === '"' || ch === "'") {
            inQuote = ch;
            cursor++;
            continue;
          }
          if (ch === "{") {
            braceDepth++;
            cursor++;
            continue;
          }
          if (ch === "}") {
            if (braceDepth > 0) {
              braceDepth--;
              cursor++;
              continue;
            }
            if (text[cursor + 1] === "}") {
              endIdx = cursor;
              i = cursor + 2;
              break;
            }
            if (text[cursor + 1] === "{") {
              const closeStyle = text.indexOf("}", cursor + 2);
              if (closeStyle !== -1) {
                endIdx = cursor;
                i = text[closeStyle + 1] === "}" ? closeStyle + 2 : closeStyle + 1;
                break;
              }
            }
          }
          cursor++;
        }
        if (endIdx === -1) {
          result += text.slice(start);
          break;
        }
        const rawExpr = text.slice(start + 2, endIdx).trim();
        result += this.evaluateExpression(rawExpr, state);
      }
      return result;
    }
    /**
     * Splits an interpolation expression on top-level `|` (ignoring `||` logical OR inside expressions,
     * unless `||` is used as the empty-fallback format separator before a filter token).
     */
    static splitSegments(exprStr) {
      const segments = [];
      let current = "";
      let inQuote = null;
      let braceDepth = 0;
      let parenDepth = 0;
      for (let i = 0; i < exprStr.length; i++) {
        const ch = exprStr[i];
        if (inQuote) {
          if (ch === "\\" && i + 1 < exprStr.length) {
            current += ch + exprStr[++i];
            continue;
          }
          if (ch === inQuote)
            inQuote = null;
          current += ch;
          continue;
        }
        if (ch === '"' || ch === "'") {
          inQuote = ch;
          current += ch;
          continue;
        }
        if (ch === "{" || ch === "[")
          braceDepth++;
        else if (ch === "}" || ch === "]")
          braceDepth = Math.max(0, braceDepth - 1);
        else if (ch === "(")
          parenDepth++;
        else if (ch === ")")
          parenDepth = Math.max(0, parenDepth - 1);
        if (ch === "|" && braceDepth === 0 && parenDepth === 0) {
          if (exprStr[i + 1] === "|") {
            const rest = exprStr.slice(i + 2).trim();
            const firstFilterCand = rest.split("|")[0].trim();
            if (this.isKnownFilter(firstFilterCand)) {
              segments.push(current.trim());
              segments.push("");
              current = "";
              i++;
              continue;
            }
            current += "||";
            i++;
            continue;
          }
          segments.push(current.trim());
          current = "";
          continue;
        }
        current += ch;
      }
      segments.push(current.trim());
      return segments;
    }
    static isKnownFilter(filterStr) {
      if (!filterStr)
        return false;
      const trimmed = filterStr.trim();
      if (trimmed.includes("#"))
        return true;
      const colonIdx = trimmed.indexOf(":");
      const name = (colonIdx !== -1 ? trimmed.slice(0, colonIdx) : trimmed).trim().toLowerCase();
      return KNOWN_FILTER_NAMES.has(name);
    }
    /**
     * Evaluates an inner expression with optional pipes/filters and arithmetic:
     * e.g. "user.name | Guest"
     * e.g. "price * qty | currency"
     * e.g. "lastSync | relativeTime"
     */
    static evaluateExpression(exprStr, state) {
      const parts = this.splitSegments(exprStr);
      const mainExpr = parts[0];
      const filters = parts.slice(1);
      let val = ExpressionEvaluator.evaluate(mainExpr, state);
      if (val === void 0 || typeof val === "string" && val === mainExpr && resolveVariablePath(state, mainExpr) === void 0) {
        val = void 0;
      }
      for (const filter of filters) {
        if (filter === "")
          continue;
        val = this.applyFilter(val, filter, mainExpr, state);
      }
      if (val === void 0 || val === null) {
        return "";
      }
      if (Array.isArray(val)) {
        return `[${val.join(",")}]`;
      }
      if (typeof val === "object") {
        try {
          return JSON.stringify(val);
        } catch {
          return String(val);
        }
      }
      return String(val);
    }
    /**
     * Applies formatting filters. If the filter is not a known function name,
     * it is treated as a default fallback value (e.g. `{{user.name | Guest}}`).
     */
    static applyFilter(val, filterStr, exprKey, state) {
      const trimmedFilter = filterStr.trim();
      const isValEmpty = val === void 0 || val === null || val === "";
      if (trimmedFilter.includes("#") && !trimmedFilter.startsWith("#")) {
        if (isValEmpty)
          return val;
        return this.applyHashMask(String(val), trimmedFilter);
      }
      if (trimmedFilter.startsWith("#") && /^#[#\-().\s]+$/.test(trimmedFilter)) {
        if (isValEmpty)
          return val;
        return this.applyHashMask(String(val), trimmedFilter);
      }
      const colonIdx = trimmedFilter.indexOf(":");
      const name = (colonIdx !== -1 ? trimmedFilter.slice(0, colonIdx) : trimmedFilter).trim();
      const argStr = colonIdx !== -1 ? trimmedFilter.slice(colonIdx + 1).trim() : "";
      const lower = name.toLowerCase();
      switch (lower) {
        case "currency": {
          const num = Number(val);
          if (isValEmpty || isNaN(num))
            return val;
          let symbol = "$";
          if (argStr && !argStr.startsWith(".") && !argStr.includes(",")) {
            symbol = argStr;
          }
          return `${symbol}${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        case "number":
        case "decimal": {
          const num = Number(val);
          if (isValEmpty || isNaN(num))
            return val;
          if (argStr && /^\d+$/.test(argStr)) {
            const decimals = Number(argStr);
            return num.toLocaleString("en-US", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals
            });
          }
          return num.toLocaleString("en-US");
        }
        case "percent": {
          const num = Number(val);
          if (isValEmpty || isNaN(num))
            return val;
          const pct = Math.abs(num) <= 1 && num !== 0 ? num * 100 : num;
          if (Number.isInteger(pct)) {
            return `${pct}%`;
          }
          return `${Number(pct.toFixed(1))}%`;
        }
        case "phone": {
          if (isValEmpty)
            return val;
          return this.formatPhone(String(val));
        }
        case "relative":
        case "relativetime": {
          if (isValEmpty)
            return val;
          const date = DateParser.parse(val);
          if (!date)
            return val;
          return this.formatRelativeTime(date);
        }
        case "countdown": {
          if (isValEmpty)
            return val;
          const targetDate = this.resolveCountdownTarget(val, exprKey, state);
          if (!targetDate)
            return val;
          return this.formatCountdown(targetDate);
        }
        case "date": {
          if (isValEmpty)
            return val;
          const date = DateParser.parse(val);
          if (!date)
            return val;
          return DateParser.format(date, argStr || "MMM d, yyyy");
        }
        case "date-short": {
          if (isValEmpty)
            return val;
          const date = DateParser.parse(val);
          if (!date)
            return val;
          return DateParser.format(date, "M/d/yy");
        }
        case "date-long": {
          if (isValEmpty)
            return val;
          const date = DateParser.parse(val);
          if (!date)
            return val;
          return DateParser.format(date, "MMMM d, yyyy");
        }
        case "date-time": {
          if (isValEmpty)
            return val;
          const date = DateParser.parse(val);
          if (!date)
            return val;
          return DateParser.format(date, "MMM d, yyyy, h:mm a");
        }
        case "uppercase":
        case "upper":
          return String(val ?? "").toUpperCase();
        case "lowercase":
        case "lower":
          return String(val ?? "").toLowerCase();
        case "capitalize": {
          const str = String(val ?? "");
          return str.charAt(0).toUpperCase() + str.slice(1);
        }
        case "list": {
          return Array.isArray(val) ? val.join(", ") : String(val ?? "");
        }
        case "display":
        case "text": {
          if (Array.isArray(val))
            return val.join(", ");
          return String(val ?? "");
        }
        default:
          if (isValEmpty) {
            const unquoted = trimmedFilter.replace(/^['"]|['"]$/g, "");
            const colonMatch = unquoted.match(/:(\.[a-zA-Z]+|[a-zA-Z]+)(?:,(\.[a-zA-Z]+|[a-zA-Z]+))?$/);
            if (colonMatch) {
              return unquoted.slice(0, colonMatch.index).trim();
            }
            return unquoted;
          }
          return val;
      }
    }
    static resolveCountdownTarget(val, exprKey, state) {
      if (val instanceof Date)
        return isNaN(val.getTime()) ? null : val;
      const num = typeof val === "number" ? val : typeof val === "string" && /^\d+(\.\d+)?$/.test(val.trim()) ? Number(val.trim()) : NaN;
      if (!isNaN(num)) {
        if (num <= 1e8) {
          if (state && typeof state === "object") {
            let map = this.countdownAnchors.get(state);
            if (!map) {
              map = /* @__PURE__ */ new Map();
              this.countdownAnchors.set(state, map);
            }
            const cacheKey = `${exprKey || "__anon__"}:${num}`;
            let targetMs = map.get(cacheKey);
            if (targetMs === void 0) {
              targetMs = Date.now() + num * 1e3;
              map.set(cacheKey, targetMs);
            }
            return new Date(targetMs);
          }
          return new Date(Date.now() + num * 1e3);
        }
        return DateParser.parse(num);
      }
      return DateParser.parse(val);
    }
    static formatPhone(raw) {
      const digits = raw.replace(/\D/g, "");
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      if (digits.length === 11 && digits.startsWith("1")) {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
      return raw;
    }
    static applyHashMask(raw, mask) {
      const clean = raw.replace(/[^a-zA-Z0-9]/g, "");
      let idx = 0;
      let out = "";
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === "#") {
          if (idx < clean.length) {
            out += clean[idx++];
          } else {
            break;
          }
        } else {
          if (idx < clean.length) {
            out += mask[i];
          }
        }
      }
      return out;
    }
    static formatRelativeTime(date) {
      const now = Date.now();
      const diffMs = now - date.getTime();
      const diffSec = Math.round(diffMs / 1e3);
      if (Math.abs(diffSec) < 5) {
        return "just now";
      }
      if (diffSec < 0) {
        const futureSec = Math.abs(diffSec);
        if (futureSec < 60)
          return `in ${futureSec}s`;
        const futureMin = Math.floor(futureSec / 60);
        if (futureMin < 60)
          return `in ${futureMin}m`;
        const futureHour = Math.floor(futureMin / 60);
        if (futureHour < 24)
          return `in ${futureHour}h`;
        const futureDays = Math.floor(futureHour / 24);
        return `in ${futureDays}d`;
      }
      if (diffSec < 60)
        return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60)
        return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24)
        return `${diffHour}h ago`;
      const diffDays = Math.floor(diffHour / 24);
      return `${diffDays}d ago`;
    }
    static formatCountdown(targetDate) {
      const now = Date.now();
      const diffMs = targetDate.getTime() - now;
      if (diffMs <= 0)
        return "00:00";
      const totalSec = Math.ceil(diffMs / 1e3);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor(totalSec % 3600 / 60);
      const s = totalSec % 60;
      if (h > 0) {
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      }
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
  };

  // packages/core/dist/parser/handlers/MarkdownPanelHandler.js
  var MarkdownPanelHandler = class {
    priority = 1;
    name = "MarkdownPanelHandler";
    activePanel = null;
    buffer = [];
    canHandle(line, _context) {
      const trimmed = line.trim();
      if (this.activePanel)
        return true;
      return trimmed.startsWith(">>>");
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (this.activePanel) {
        if (trimmed === ">>>") {
          let bodyLines = this.buffer;
          const separatorIdx = this.buffer.findIndex((l) => {
            const t = l.trim();
            return t === "---" || t === "***";
          });
          if (separatorIdx !== -1) {
            const frontmatterLines = this.buffer.slice(0, separatorIdx);
            bodyLines = this.buffer.slice(separatorIdx + 1);
            for (const fmLine of frontmatterLines) {
              const trimmedFm = fmLine.trim();
              if (!trimmedFm)
                continue;
              const colonIdx = trimmedFm.indexOf(":");
              if (colonIdx !== -1) {
                const key = trimmedFm.slice(0, colonIdx).trim();
                const val = trimmedFm.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, "");
                if (key === "title") {
                  this.activePanel.title = val;
                } else if (key === "displayMode" || key === "type") {
                  this.activePanel.type = val;
                  this.activePanel.displayMode = val;
                  this.activePanel.attributes["displayMode"] = val;
                } else {
                  this.activePanel.attributes[key] = val;
                }
              }
            }
          } else {
            let fmCount = 0;
            for (let i = 0; i < this.buffer.length; i++) {
              const trimmedLine = this.buffer[i].trim();
              if (!trimmedLine) {
                if (fmCount > 0) {
                  const frontmatterLines = this.buffer.slice(0, i);
                  bodyLines = this.buffer.slice(i + 1);
                  for (const fmLine of frontmatterLines) {
                    const colonIdx = fmLine.indexOf(":");
                    if (colonIdx !== -1) {
                      const key = fmLine.slice(0, colonIdx).trim();
                      const val = fmLine.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, "");
                      if (key === "title") {
                        this.activePanel.title = val;
                      } else if (key === "displayMode" || key === "type") {
                        this.activePanel.type = val;
                        this.activePanel.attributes["displayMode"] = val;
                      } else {
                        this.activePanel.attributes[key] = val;
                      }
                    }
                  }
                }
                break;
              }
              if (/^[a-zA-Z0-9_-]+\s*:/.test(trimmedLine)) {
                fmCount++;
              } else {
                break;
              }
            }
          }
          this.activePanel.content = bodyLines.join("\n");
          context.emitTag({
            name: "panel",
            isStart: false,
            panel: this.activePanel,
            attributes: {
              id: this.activePanel.id,
              type: this.activePanel.type,
              title: this.activePanel.title,
              ...this.activePanel.attributes
            }
          });
          this.activePanel = null;
          this.buffer = [];
          return true;
        }
        this.buffer.push(line);
        return true;
      }
      if (trimmed.startsWith(">>>")) {
        context.closeImplicitBlocks();
        const content = trimmed.slice(3).trim();
        const parts = content.split(/\s+/);
        const idOrType = parts[0] || nextDeterministicId("panel");
        const title = parts.slice(1).join(" ").replace(/^['"]|['"]$/g, "");
        this.activePanel = {
          id: idOrType,
          type: ["sheet", "page", "alert", "actionSheet"].includes(idOrType) ? idOrType : "sheet",
          title: title || void 0,
          content: "",
          attributes: {}
        };
        this.buffer = [];
        context.emitTag({
          name: "panel",
          isStart: true,
          panel: this.activePanel,
          attributes: { id: this.activePanel.id, type: this.activePanel.type, title: this.activePanel.title }
        });
        return true;
      }
      return false;
    }
    finalize(context) {
      if (this.activePanel) {
        this.handle(">>>", context);
      }
    }
    reset() {
      this.activePanel = null;
      this.buffer = [];
    }
  };

  // packages/core/dist/parser/handlers/LoopHandler.js
  var LoopHandler = class {
    priority = 2;
    name = "LoopHandler";
    loopStack = [];
    canHandle(line, _context) {
      const trimmed = line.trim();
      return trimmed.startsWith("~~~");
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (trimmed === "~~~") {
        if (this.loopStack.length > 0) {
          context.closeImplicitBlocks();
          const top = this.loopStack.pop();
          context.emitTag({
            name: "loop",
            isStart: false,
            attributes: { dataset: top.dataset, alias: top.alias }
          });
          return true;
        }
        return false;
      }
      if (trimmed.startsWith("~~~")) {
        context.closeImplicitBlocks();
        const match = trimmed.match(/^~~~\s+([\w.]+)\s+as\s+([\w.]+)/i);
        let dataset = "";
        let alias = "item";
        if (match) {
          dataset = match[1];
          alias = match[2];
        } else {
          dataset = trimmed.slice(3).trim();
          alias = "item";
        }
        this.loopStack.push({ dataset, alias });
        context.emitTag({
          name: "loop",
          isStart: true,
          attributes: { dataset, alias }
        });
        return true;
      }
      return false;
    }
    finalize(context) {
      while (this.loopStack.length > 0) {
        this.handle("~~~", context);
      }
    }
    reset() {
      this.loopStack = [];
    }
  };

  // packages/core/dist/parser/handlers/DataVariableHandler.js
  var DataVariableHandler = class {
    priority = 3;
    name = "DataVariableHandler";
    activeKey = null;
    buffer = [];
    openParens = 0;
    canHandle(line, _context) {
      const trimmed = line.trim();
      if (this.activeKey)
        return true;
      return /^@[\w.]+\s*\(/.test(trimmed);
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (this.activeKey) {
        this.buffer.push(line);
        this.countParens(line);
        if (this.openParens <= 0) {
          this.commitVariable(context);
        }
        return true;
      }
      const match = trimmed.match(/^@([\w.]+)\s*\((.*)$/);
      if (match) {
        this.activeKey = match[1];
        const rest = match[2];
        this.buffer = [rest];
        this.openParens = 1;
        this.countParens(rest);
        if (this.openParens <= 0) {
          this.commitVariable(context);
        }
        return true;
      }
      return false;
    }
    countParens(str) {
      for (let i = 0; i < str.length; i++) {
        if (str[i] === "(")
          this.openParens++;
        else if (str[i] === ")")
          this.openParens--;
      }
    }
    commitVariable(context) {
      if (!this.activeKey)
        return;
      let fullStr = this.buffer.join("\n").trim();
      if (fullStr.endsWith(")")) {
        fullStr = fullStr.slice(0, -1).trim();
      }
      let parsedVal = fullStr;
      try {
        parsedVal = JSON.parse(fullStr);
      } catch {
        if (fullStr === "true")
          parsedVal = true;
        else if (fullStr === "false")
          parsedVal = false;
        else if (!isNaN(Number(fullStr)) && fullStr !== "")
          parsedVal = Number(fullStr);
        else if (fullStr.startsWith("[") && fullStr.endsWith("]")) {
          parsedVal = fullStr.slice(1, -1).split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
        } else {
          const stateProxy = new Proxy({}, {
            get: (_, prop) => context.getVariable(prop),
            has: (_, prop) => context.getVariable(prop) !== void 0
          });
          const hasOperatorsOrCalls = /[+\-*/%?:<>=]|case\(|round\(|floor\(|ceil\(|\.count|\.length|\.completedCount|\.pendingCount/.test(fullStr);
          const referencesExistingVar = Boolean(context.getVariable(fullStr) !== void 0);
          if (hasOperatorsOrCalls || referencesExistingVar) {
            const existingComputed = context.getVariable("__computed_vars__") || {};
            existingComputed[this.activeKey] = fullStr;
            context.setVariable("__computed_vars__", { ...existingComputed });
            const evalRes = ExpressionEvaluator.evaluate(fullStr, stateProxy);
            if (evalRes !== void 0) {
              parsedVal = evalRes;
            } else {
              parsedVal = fullStr.replace(/^['"]|['"]$/g, "");
            }
          } else {
            parsedVal = fullStr.replace(/^['"]|['"]$/g, "");
          }
        }
      }
      if (context.getVariable(this.activeKey) === void 0) {
        context.setVariable(this.activeKey, parsedVal);
        if (parsedVal && typeof parsedVal === "object" && !Array.isArray(parsedVal)) {
          const flattened = flattenVariables(parsedVal, this.activeKey);
          for (const [k, v] of Object.entries(flattened)) {
            if (context.getVariable(k) === void 0) {
              context.setVariable(k, v);
            }
          }
        }
      }
      this.activeKey = null;
      this.buffer = [];
      this.openParens = 0;
    }
    finalize(context) {
      if (this.activeKey) {
        this.commitVariable(context);
      }
    }
    reset() {
      this.activeKey = null;
      this.buffer = [];
      this.openParens = 0;
    }
  };

  // packages/core/dist/parser/handlers/RuleDefinitionHandler.js
  var RuleDefinitionHandler = class {
    priority = 4;
    name = "RuleDefinitionHandler";
    canHandle(line, _context) {
      return line.trim().startsWith("///");
    }
    handle(line, context) {
      const trimmed = line.trim().slice(3).trim();
      if (!trimmed)
        return false;
      const arrowIdx = trimmed.indexOf("->");
      const colonIdx = trimmed.indexOf(":");
      let field = "";
      let rule = "";
      if (colonIdx !== -1 && (arrowIdx === -1 || colonIdx < arrowIdx)) {
        field = trimmed.slice(0, colonIdx).trim();
        rule = trimmed.slice(colonIdx + 1).trim();
      } else if (arrowIdx !== -1) {
        const exprPart = trimmed.slice(0, arrowIdx).trim();
        const fnMatch = exprPart.match(/^!?\s*(?:empty|length|matches)\s*\(\s*([a-zA-Z0-9_.\-]+)\s*[),]/);
        const idMatch = exprPart.match(/^([a-zA-Z_][a-zA-Z0-9_.\-]*)/);
        field = (fnMatch?.[1] || idMatch?.[1] || "__doc__").trim();
        rule = trimmed;
      } else {
        return false;
      }
      if (field && rule) {
        const existing = context.getVariable("__rules__") || {};
        if (!existing[field])
          existing[field] = [];
        existing[field].push(rule);
        context.setVariable("__rules__", existing);
        return true;
      }
      return false;
    }
  };

  // packages/core/dist/parser/handlers/MediaHandler.js
  var MediaHandler = class {
    priority = 6;
    name = "MediaHandler";
    inMediaBlock = false;
    currentKind = "video";
    currentUrl = "";
    currentTitle = "";
    currentAttributes = {};
    canHandle(line, _context) {
      const trimmed = line.trim();
      if (this.inMediaBlock)
        return true;
      if (!trimmed.startsWith(":::"))
        return false;
      const after = trimmed.slice(3).trim().toLowerCase();
      return after.startsWith("video") || after.startsWith("audio") || after.startsWith("embed");
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (this.inMediaBlock) {
        if (trimmed === ":::") {
          this.emitMedia(context);
          this.inMediaBlock = false;
          return true;
        }
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
          this.currentUrl = trimmed;
          return true;
        }
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx !== -1) {
          const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
          const rawVal = trimmed.slice(colonIdx + 1).trim();
          const cleanVal = rawVal.replace(/^["']|["']$/g, "");
          if (key === "title" || key === "caption") {
            this.currentTitle = cleanVal;
          } else if (key === "url" || key === "src") {
            this.currentUrl = cleanVal;
          } else if (key === "http" || key === "https") {
            this.currentUrl = trimmed;
          } else {
            this.currentAttributes[key] = cleanVal;
          }
          return true;
        }
        const lower2 = trimmed.toLowerCase();
        if (lower2 === "loop" || lower2 === "autoplay" || lower2 === "muted" || lower2 === "controls") {
          this.currentAttributes[lower2] = "true";
        } else if (!this.currentTitle && trimmed) {
          this.currentTitle = trimmed;
        }
        return true;
      }
      if (!trimmed.startsWith(":::"))
        return false;
      const after = trimmed.slice(3).trim();
      const lower = after.toLowerCase();
      let kind = "video";
      let prefixLen = 5;
      if (lower.startsWith("video")) {
        kind = "video";
        prefixLen = 5;
      } else if (lower.startsWith("audio")) {
        kind = "audio";
        prefixLen = 5;
      } else if (lower.startsWith("embed")) {
        kind = "embed";
        prefixLen = 5;
      } else {
        return false;
      }
      let remainder = after.slice(prefixLen).trim();
      let isSingleLine = false;
      if (remainder.endsWith(":::")) {
        remainder = remainder.slice(0, -3).trim();
        isSingleLine = true;
      }
      const attributes = this.parseAttributes(remainder);
      let url = attributes["src"] || attributes["url"] || "";
      let title = attributes["title"] || attributes["caption"] || "";
      if (!url && remainder) {
        const tokens = remainder.split(/\s+/).filter(Boolean);
        const first = tokens[0];
        if (first && !first.includes("=")) {
          url = first.replace(/^["']|["']$/g, "");
        }
      }
      if (isSingleLine) {
        context.closeImplicitBlocks();
        this.emitMediaTag(context, kind, url, title, attributes);
        return true;
      }
      context.closeImplicitBlocks();
      this.inMediaBlock = true;
      this.currentKind = kind;
      this.currentUrl = url;
      this.currentTitle = title;
      this.currentAttributes = attributes;
      return true;
    }
    isOpen() {
      return this.inMediaBlock;
    }
    close(context) {
      if (this.inMediaBlock) {
        this.emitMedia(context);
        this.inMediaBlock = false;
      }
      return [];
    }
    emitMedia(context) {
      this.emitMediaTag(context, this.currentKind, this.currentUrl, this.currentTitle, this.currentAttributes);
    }
    emitMediaTag(context, kind, url, title, attributes) {
      const mediaAttrs = {
        mediaType: kind,
        url,
        alt: title,
        ...attributes
      };
      context.emitTag({
        name: "media",
        isStart: true,
        attributes: mediaAttrs
      });
      context.emitTag({
        name: "media",
        isStart: false,
        attributes: mediaAttrs
      });
    }
    parseAttributes(raw) {
      const attrs = {};
      const regex = /(\w[\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
      let match;
      while ((match = regex.exec(raw)) !== null) {
        const key = match[1].toLowerCase();
        const val = match[2] ?? match[3] ?? match[4] ?? "";
        attrs[key] = val;
      }
      return attrs;
    }
  };

  // packages/core/dist/parser/handlers/MarkdownInputHandler.js
  var MarkdownInputHandler = class {
    priority = 5;
    name = "MarkdownInputHandler";
    activeInput = null;
    inNotes = false;
    notesBuffer = [];
    canHandle(line, _context) {
      const trimmed = line.trim();
      if (this.activeInput)
        return true;
      return trimmed.startsWith("???");
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (this.activeInput) {
        const isClosingInput = trimmed === "???";
        const isFenceInterrupt = trimmed === ":::" || trimmed.startsWith(":::") || trimmed.startsWith("###") || trimmed.startsWith("===") || trimmed.startsWith("???") && trimmed !== "???" || trimmed.startsWith("!!!");
        if (isClosingInput || isFenceInterrupt) {
          if (this.notesBuffer.length > 0) {
            this.activeInput.notes = this.notesBuffer.join("\n").trim();
          }
          const input = {
            id: this.activeInput.id || nextDeterministicId("input"),
            typeOf: this.activeInput.typeOf || "text",
            label: this.activeInput.label || this.activeInput.id || "",
            placeholder: this.activeInput.placeholder,
            defaultValue: this.activeInput.defaultValue,
            min: this.activeInput.min,
            max: this.activeInput.max,
            step: this.activeInput.step,
            lines: this.activeInput.lines,
            group: this.activeInput.group,
            options: this.activeInput.options,
            style: this.activeInput.style,
            secure: this.activeInput.secure,
            required: this.activeInput.required,
            rules: this.activeInput.rules || [],
            disabled: this.activeInput.disabled,
            disabledExpr: this.activeInput.disabledExpr,
            notes: this.activeInput.notes,
            notesPanelId: this.activeInput.notesPanelId,
            attributes: this.activeInput.attributes || {}
          };
          context.emitTag({
            name: "input",
            isStart: false,
            input,
            attributes: { id: input.id }
          });
          this.activeInput = null;
          this.inNotes = false;
          this.notesBuffer = [];
          if (isClosingInput) {
            return true;
          }
          return false;
        }
        if (trimmed === "---") {
          this.inNotes = true;
          return true;
        }
        if (this.inNotes) {
          this.notesBuffer.push(line);
          return true;
        }
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx !== -1) {
          const key = trimmed.slice(0, colonIdx).trim();
          const value = trimmed.slice(colonIdx + 1).trim();
          if (key === "label")
            this.activeInput.label = value.replace(/^['"]|['"]$/g, "");
          else if (key === "widget" || key === "typeOf") {
            const lowerVal = value.toLowerCase().trim();
            if (lowerVal === "email")
              this.activeInput.typeOf = "email";
            else if (lowerVal === "phone" || lowerVal === "tel")
              this.activeInput.typeOf = "phone";
            else
              this.activeInput.typeOf = MarkdownInputParser.inferTypeOf(value);
          } else if (key === "type") {
            if (!this.activeInput.attributes)
              this.activeInput.attributes = {};
            this.activeInput.attributes.type = value;
            const lowerVal = value.toLowerCase().trim();
            if (lowerVal === "email")
              this.activeInput.typeOf = "email";
            else if (lowerVal === "phone" || lowerVal === "tel")
              this.activeInput.typeOf = "phone";
            else
              this.activeInput.typeOf = MarkdownInputParser.inferTypeOf(value);
          } else if (key === "placeholder")
            this.activeInput.placeholder = value.replace(/^['"]|['"]$/g, "");
          else if (key === "default" || key === "defaultValue")
            this.activeInput.defaultValue = value;
          else if (key === "min")
            this.activeInput.min = Number(value);
          else if (key === "max")
            this.activeInput.max = Number(value);
          else if (key === "step")
            this.activeInput.step = Number(value);
          else if (key === "lines")
            this.activeInput.lines = Number(value);
          else if (key === "group")
            this.activeInput.group = value;
          else if (key === "style")
            this.activeInput.style = value;
          else if (key === "secure")
            this.activeInput.secure = value === "true";
          else if (key === "disabled") {
            if (value.startsWith("!")) {
              this.activeInput.disabledExpr = value;
            } else if (value === "true") {
              this.activeInput.disabled = true;
            } else {
              this.activeInput.disabledExpr = value;
            }
          } else if (key === "required") {
            if (!value || value === "true") {
              this.activeInput.required = true;
            } else if (value === "false") {
              this.activeInput.required = false;
            } else {
              this.activeInput.required = value.replace(/^['"]|['"]$/g, "");
            }
          } else if (key === "notes" && value.startsWith(">>>")) {
            this.activeInput.notesPanelId = value.slice(3).trim();
          } else if (key === "options") {
            try {
              this.activeInput.options = JSON.parse(value.replace(/'/g, '"'));
            } catch {
              this.activeInput.options = value.replace(/^\[|\]$/g, "").split(",").map((s) => s.trim());
            }
          } else if (key === "rule") {
            const parts = value.split("->").map((s) => s.trim());
            if (!this.activeInput.rules)
              this.activeInput.rules = [];
            this.activeInput.rules.push({ expr: parts[0], message: parts[1]?.replace(/^['"]|['"]$/g, "") || "Invalid" });
          } else {
            if (!this.activeInput.attributes)
              this.activeInput.attributes = {};
            this.activeInput.attributes[key] = value;
          }
        }
        return true;
      }
      const rest = trimmed.slice(3).trim();
      const isMultiLineStart = rest.length > 0 && !rest.includes('"') && !rest.includes("'") && !rest.includes("=") && !rest.includes(" ") && !rest.includes(":");
      if (isMultiLineStart) {
        context.closeImplicitBlocks();
        this.activeInput = {
          id: rest,
          typeOf: "text",
          label: rest,
          rules: [],
          attributes: {}
        };
        this.inNotes = false;
        this.notesBuffer = [];
        context.emitTag({
          name: "input",
          isStart: true,
          attributes: { id: rest }
        });
        return true;
      }
      const parsed = MarkdownInputParser.parseSingleLine(line);
      if (parsed) {
        context.closeImplicitBlocks();
        context.emitTag({
          name: "input",
          isStart: true,
          input: parsed,
          attributes: { id: parsed.id }
        });
        context.emitTag({
          name: "input",
          isStart: false,
          input: parsed,
          attributes: { id: parsed.id }
        });
        return true;
      }
      return false;
    }
    finalize(context) {
      if (this.activeInput) {
        this.handle("???", context);
      }
    }
    reset() {
      this.activeInput = null;
      this.inNotes = false;
      this.notesBuffer = [];
    }
  };

  // packages/core/dist/parser/handlers/AccordionHandler.js
  var AccordionHandler = class {
    priority = 6;
    name = "AccordionHandler";
    currentAccordion = null;
    canHandle(line, _context) {
      const trimmed = line.trim();
      if (trimmed.startsWith("^^^"))
        return true;
      if (this.currentAccordion) {
        if (trimmed === "vvv")
          return true;
        if (this.currentAccordion.inZone === "propertyOrDefault") {
          if (trimmed.startsWith("style:"))
            return true;
          if (trimmed === "---")
            return true;
        }
      }
      return false;
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (trimmed === "^^^") {
        if (this.currentAccordion) {
          context.closeImplicitBlocks();
          const acc = this.currentAccordion;
          this.currentAccordion = null;
          context.emitTag({
            name: "accordion",
            isStart: false,
            attributes: {
              id: acc.id,
              title: acc.title,
              style: acc.style,
              accordionStyle: acc.accordionStyle,
              open: acc.isOpen ? "true" : "false"
            }
          });
          return true;
        }
        return false;
      }
      if (trimmed.startsWith("^^^")) {
        if (this.currentAccordion) {
          context.closeImplicitBlocks();
          const prev = this.currentAccordion;
          this.currentAccordion = null;
          context.emitTag({
            name: "accordion",
            isStart: false,
            attributes: {
              id: prev.id,
              title: prev.title,
              style: prev.style,
              accordionStyle: prev.accordionStyle,
              open: prev.isOpen ? "true" : "false"
            }
          });
        }
        context.closeImplicitBlocks();
        const rest = trimmed.slice(3).trim();
        const isOpen = /\s+open$/i.test(rest);
        const cleanRest = rest.replace(/\s+open$/i, "").trim();
        let id = cleanRest;
        let title = "";
        const colonIdx = cleanRest.indexOf(":");
        if (colonIdx !== -1) {
          id = cleanRest.slice(0, colonIdx).trim();
          title = cleanRest.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, "");
        }
        if (!id) {
          id = nextDeterministicId("acc");
        }
        this.currentAccordion = {
          id,
          title,
          style: "chevron",
          accordionStyle: "chevron",
          isOpen,
          inZone: "propertyOrDefault"
        };
        context.emitTag({
          name: "accordion",
          isStart: true,
          attributes: {
            id,
            title,
            style: "chevron",
            accordionStyle: "chevron",
            open: isOpen ? "true" : "false"
          }
        });
        return true;
      }
      if (this.currentAccordion && this.currentAccordion.inZone === "propertyOrDefault") {
        if (trimmed.startsWith("style:")) {
          const rawStyle = trimmed.slice(6).trim();
          this.currentAccordion.style = rawStyle;
          this.currentAccordion.accordionStyle = rawStyle.toLowerCase() === "showmore" ? "showMore" : rawStyle;
          return true;
        }
        if (trimmed === "---") {
          this.currentAccordion.inZone = "default";
          return true;
        }
      }
      if (trimmed === "vvv" && this.currentAccordion) {
        context.closeImplicitBlocks();
        this.currentAccordion.inZone = "expanded";
        context.emitTag({
          name: "accordion",
          isStart: true,
          attributes: { isZone: true, zone: "expanded" }
        });
        return true;
      }
      return false;
    }
    finalize(context) {
      if (this.currentAccordion) {
        this.handle("^^^", context);
      }
    }
    reset() {
      this.currentAccordion = null;
    }
  };

  // packages/core/dist/parser/handlers/ConditionalHandler.js
  var ConditionalHandler = class {
    priority = 7;
    name = "ConditionalHandler";
    conditionalStack = [];
    canHandle(line, _context) {
      const trimmed = line.trim();
      if (trimmed.startsWith("|||"))
        return true;
      if (this.conditionalStack.length > 0) {
        const top = this.conditionalStack[this.conditionalStack.length - 1];
        if (trimmed === "else:" || trimmed === "else")
          return true;
        if (top.isSwitch) {
          if (/^case\b/i.test(trimmed))
            return true;
          if (/^default:?$/i.test(trimmed))
            return true;
          if (/^after:\s*/i.test(trimmed))
            return true;
          if (/^announce:\s*/i.test(trimmed))
            return true;
          if (/^transition:\s*/i.test(trimmed))
            return true;
          if (trimmed === "---")
            return true;
          if (/^\[(?:after:\s*)?[\d.]+\s*(?:s|ms)\s*->\s*[\w.]+\]$/i.test(trimmed))
            return true;
        }
      }
      return false;
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (trimmed === "|||") {
        if (this.conditionalStack.length > 0) {
          context.closeImplicitBlocks();
          const top = this.conditionalStack.pop();
          context.emitTag({
            name: "conditional",
            isStart: false,
            attributes: { condition: top.condition, isSwitch: top.isSwitch, switchVariable: top.isSwitch ? top.condition : void 0 }
          });
          return true;
        }
        return false;
      }
      if (trimmed.startsWith("|||")) {
        let content = trimmed.slice(3).trim();
        const isBranchLine = this.conditionalStack.length > 0 && /^(?:case|default|else:?)\s*$/i.test(content);
        if (!isBranchLine) {
          context.closeImplicitBlocks();
          if (/^(?:else\s+if|elif)\s+/i.test(content)) {
            content = content.replace(/^(?:else\s+if|elif)\s+/i, "").trim();
            if (this.conditionalStack.length > 0 && !this.conditionalStack[this.conditionalStack.length - 1].isSwitch) {
              const prev = this.conditionalStack.pop();
              context.emitTag({
                name: "conditional",
                isStart: false,
                attributes: { condition: prev.condition, isSwitch: false }
              });
            }
          } else if (this.conditionalStack.length > 0 && !this.conditionalStack[this.conditionalStack.length - 1].isSwitch && !this.conditionalStack[this.conditionalStack.length - 1].inElse && this.isSameVariableEqualityChain(this.conditionalStack[this.conditionalStack.length - 1].condition, content)) {
            const prev = this.conditionalStack.pop();
            context.emitTag({
              name: "conditional",
              isStart: false,
              attributes: { condition: prev.condition, isSwitch: false }
            });
          }
          const isSwitch = content.startsWith("switch ") || content.startsWith("switch:");
          let condition = isSwitch ? content.replace(/^switch:?\s*/, "").trim() : content;
          let inlineAnnounce;
          if (!isSwitch) {
            const bracketMatch = condition.match(/\[announce:\s*["']?([^"'\],]+)["']?\]/i);
            if (bracketMatch) {
              inlineAnnounce = bracketMatch[1].trim();
              condition = condition.replace(/\[announce:\s*["']?[^"'\],]+["']?\]/i, "").trim();
            }
          }
          this.conditionalStack.push({
            condition,
            isSwitch,
            inElse: false
          });
          context.emitTag({
            name: "conditional",
            isStart: true,
            attributes: { condition, isSwitch, switchVariable: isSwitch ? condition : void 0, announce: inlineAnnounce }
          });
          return true;
        }
      }
      if (this.conditionalStack.length > 0) {
        const top = this.conditionalStack[this.conditionalStack.length - 1];
        const branchTrimmed = trimmed.startsWith("|||") ? trimmed.slice(3).trim() : trimmed;
        if (!top.isSwitch && /^announce:\s*/i.test(branchTrimmed)) {
          const rawAnnounce = branchTrimmed.replace(/^announce:\s*/i, "").trim();
          const announceVal = rawAnnounce.replace(/^['"]|['"]$/g, "");
          context.emitTag({
            name: "conditional",
            isStart: true,
            attributes: {
              isBranchAttr: true,
              announce: announceVal
            }
          });
          return true;
        }
        if (top.isSwitch && branchTrimmed === "---") {
          return true;
        }
        if (top.isSwitch && /^transition:\s*/i.test(branchTrimmed)) {
          return true;
        }
        if (top.isSwitch) {
          const bracketAfterMatch = branchTrimmed.match(/^\[(?:after:\s*)?([\d.]+\s*(?:s|ms)\s*->\s*[\w.]+)\]$/i);
          if (bracketAfterMatch) {
            context.emitTag({
              name: "conditional",
              isStart: true,
              attributes: {
                isBranchAttr: true,
                after: bracketAfterMatch[1].trim()
              }
            });
            return true;
          }
        }
        if (top.isSwitch && /^case\b/i.test(branchTrimmed)) {
          context.closeImplicitBlocks();
          const caseMatch = branchTrimmed.match(/^case:?\s+([^:\[]+)(?:\[(.*?)\])?(?::)?$/i);
          let caseVal = caseMatch ? caseMatch[1].trim().replace(/^['"]|['"]$/g, "") : branchTrimmed.replace(/^case:?\s*/i, "").trim().replace(/:$/, "");
          let afterAttr;
          let announceAttr;
          if (caseMatch && caseMatch[2]) {
            const attrStr = caseMatch[2];
            const afterM = attrStr.match(/after:\s*([^\],]+)/i) || attrStr.match(/([\d.]+\s*(?:s|ms)\s*->\s*[\w.]+)/i);
            if (afterM)
              afterAttr = afterM[1].trim();
            const annM = attrStr.match(/announce:\s*["']?([^"'\],]+)["']?/i);
            if (annM)
              announceAttr = annM[1].trim();
          }
          context.emitTag({
            name: "conditional",
            isStart: true,
            attributes: {
              isBranch: true,
              branch: "case",
              value: caseVal,
              after: afterAttr,
              announce: announceAttr
            }
          });
          return true;
        }
        if (top.isSwitch && /^after:\s*/i.test(branchTrimmed)) {
          const afterVal = branchTrimmed.replace(/^after:\s*/i, "").trim();
          context.emitTag({
            name: "conditional",
            isStart: true,
            attributes: {
              isBranchAttr: true,
              after: afterVal
            }
          });
          return true;
        }
        if (top.isSwitch && /^announce:\s*/i.test(branchTrimmed)) {
          const rawAnnounce = branchTrimmed.replace(/^announce:\s*/i, "").trim();
          const announceVal = rawAnnounce.replace(/^['"]|['"]$/g, "");
          context.emitTag({
            name: "conditional",
            isStart: true,
            attributes: {
              isBranchAttr: true,
              announce: announceVal
            }
          });
          return true;
        }
        if (top.isSwitch && /^default:?$/i.test(branchTrimmed)) {
          context.closeImplicitBlocks();
          context.emitTag({
            name: "conditional",
            isStart: true,
            attributes: {
              isBranch: true,
              branch: "default"
            }
          });
          return true;
        }
        if (!top.isSwitch && (branchTrimmed === "else:" || branchTrimmed === "else")) {
          if (!top.inElse) {
            context.closeImplicitBlocks();
            top.inElse = true;
            context.emitTag({
              name: "conditional",
              isStart: true,
              attributes: { isBranch: true, branch: "else" }
            });
            return true;
          }
        }
      }
      return false;
    }
    finalize(context) {
      while (this.conditionalStack.length > 0) {
        this.handle("|||", context);
      }
    }
    reset() {
      this.conditionalStack = [];
    }
    isSameVariableEqualityChain(prevExpr, nextExpr) {
      if (prevExpr.includes("{{") || nextExpr.includes("{{"))
        return false;
      const v1 = this.extractEqualityVariable(prevExpr);
      const v2 = this.extractEqualityVariable(nextExpr);
      return !!v1 && v1 === v2;
    }
    extractEqualityVariable(expr) {
      const eqIdx = expr.indexOf("==");
      if (eqIdx < 0)
        return null;
      let lhs = expr.slice(0, eqIdx).trim();
      if (lhs.startsWith("@"))
        lhs = lhs.slice(1).trim();
      if (!lhs || !/^[\w.]+$/.test(lhs))
        return null;
      return lhs;
    }
  };

  // packages/core/dist/parser/handlers/ActionHandler.js
  var ActionHandler = class {
    priority = 8;
    name = "ActionHandler";
    inAction = false;
    actionId = "";
    triggerRaw = "";
    style = "secondary";
    inContent = false;
    attributes = {};
    contentBuffer = [];
    canHandle(line, _context) {
      const trimmed = line.trim();
      if (this.inAction)
        return true;
      return trimmed.startsWith("!!!");
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (this.inAction) {
        if (trimmed === "!!!") {
          const action = {
            id: this.actionId,
            label: this.contentBuffer.join("\n").trim() || this.actionId,
            trigger: MarkdownActionHelper.parseTrigger(this.triggerRaw),
            style: this.style,
            icon: this.attributes.icon,
            attributes: this.attributes
          };
          context.emitTag({
            name: "action",
            isStart: false,
            action,
            text: action.label,
            attributes: { id: action.id, style: action.style }
          });
          this.inAction = false;
          this.inContent = false;
          this.contentBuffer = [];
          this.attributes = {};
          return true;
        }
        if (trimmed === "---") {
          this.inContent = true;
          return true;
        }
        if (this.inContent) {
          this.contentBuffer.push(line);
          return true;
        }
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx !== -1) {
          const key = trimmed.slice(0, colonIdx).trim();
          const value = trimmed.slice(colonIdx + 1).trim();
          if (key === "trigger") {
            this.triggerRaw = value;
          } else if (key === "style") {
            this.style = value;
          } else {
            this.attributes[key] = value;
          }
        }
        return true;
      }
      if (trimmed.startsWith("!!!")) {
        context.closeImplicitBlocks();
        this.actionId = trimmed.slice(3).trim() || nextDeterministicId("action");
        this.inAction = true;
        this.inContent = false;
        this.triggerRaw = "";
        this.style = "secondary";
        this.attributes = {};
        this.contentBuffer = [];
        context.emitTag({
          name: "action",
          isStart: true,
          attributes: { id: this.actionId }
        });
        return true;
      }
      return false;
    }
    finalize(context) {
      if (this.inAction) {
        this.handle("!!!", context);
      }
    }
    reset() {
      this.inAction = false;
      this.inContent = false;
      this.actionId = "";
      this.triggerRaw = "";
      this.style = "secondary";
      this.attributes = {};
      this.contentBuffer = [];
    }
  };

  // packages/core/dist/parser/handlers/CodeBlockHandler.js
  var CodeBlockHandler = class {
    priority = 1;
    name = "CodeBlockHandler";
    inCode = false;
    language = "";
    buffer = [];
    canHandle(line, _context) {
      const trimmed = line.trim();
      if (this.inCode)
        return true;
      return trimmed.startsWith("```");
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (this.inCode) {
        if (trimmed.startsWith("```")) {
          this.inCode = false;
          context.emitTag({
            name: "codeBlock",
            isStart: false,
            text: this.buffer.join("\n"),
            attributes: { language: this.language }
          });
          this.buffer = [];
          return true;
        }
        this.buffer.push(line);
        return true;
      }
      if (trimmed.startsWith("```")) {
        context.closeImplicitBlocks();
        this.language = trimmed.slice(3).trim();
        this.inCode = true;
        this.buffer = [];
        context.emitTag({
          name: "codeBlock",
          isStart: true,
          attributes: { language: this.language }
        });
        return true;
      }
      return false;
    }
    finalize(context) {
      if (this.inCode) {
        this.handle("```", context);
      }
    }
    reset() {
      this.inCode = false;
      this.language = "";
      this.buffer = [];
    }
  };

  // packages/core/dist/parser/handlers/EmptyLineHandler.js
  var EmptyLineHandler = class {
    priority = 10;
    name = "EmptyLineHandler";
    canHandle(line, _context) {
      return line.trim().length === 0;
    }
    handle(_line, context) {
      context.closeImplicitBlocks();
      return true;
    }
  };

  // packages/core/dist/parser/handlers/BlockquoteHandler.js
  var BlockquoteHandler = class {
    priority = 11;
    name = "BlockquoteHandler";
    inQuote = false;
    buffer = [];
    canHandle(line, _context) {
      const trimmed = line.trim();
      return trimmed.startsWith(">");
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (trimmed.startsWith(">")) {
        if (!this.inQuote) {
          context.closeImplicitBlocks();
          this.inQuote = true;
          this.buffer = [];
          context.emitTag({ name: "blockquote", isStart: true });
        }
        const quoteContent = trimmed.replace(/^>\s?/, "");
        this.buffer.push(quoteContent);
        return true;
      }
      if (this.inQuote) {
        this.close(context);
      }
      return false;
    }
    isOpen() {
      return this.inQuote;
    }
    close(context) {
      if (this.inQuote) {
        this.inQuote = false;
        const tag = {
          name: "blockquote",
          isStart: false,
          text: this.buffer.join("\n")
        };
        context.emitTag(tag);
        this.buffer = [];
        return [tag];
      }
      return [];
    }
    reset() {
      this.inQuote = false;
      this.buffer = [];
    }
  };

  // packages/core/dist/parser/handlers/GroupHandler.js
  var GroupHandler = class {
    priority = 12;
    name = "GroupHandler";
    groupStack = [];
    canHandle(line, _context) {
      const trimmed = line.trim();
      if (this.groupStack.length > 0)
        return true;
      return trimmed.startsWith(":::");
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (trimmed === ":::") {
        if (this.groupStack.length > 0) {
          context.closeImplicitBlocks();
          const top = this.groupStack.pop();
          const headerAttrs = this.parseHeaderAttributes(top.headerLines);
          if (headerAttrs.style) {
            if (!top.group.id || top.group.id.startsWith("group_") || top.group.id.startsWith("group-")) {
              top.group.id = top.group.style;
            }
            top.group.style = headerAttrs.style;
            top.group.compoundStyles = headerAttrs.style.split(/[+,]/).map((s) => s.trim()).filter(Boolean);
          }
          if (headerAttrs.id) {
            top.group.id = headerAttrs.id;
          }
          top.group.attributes = { ...top.group.attributes, ...headerAttrs };
          context.emitTag({
            name: "group",
            isStart: false,
            group: top.group,
            text: top.bodyLines.join("\n"),
            attributes: {
              id: top.group.id,
              style: top.group.style,
              compoundStyles: top.group.compoundStyles,
              ...top.group.attributes
            }
          });
        }
        return true;
      }
      if (trimmed.startsWith(":::")) {
        context.closeImplicitBlocks();
        const parsed = MarkdownGroupHelper.parseFence(trimmed);
        if (parsed.singleLineContent) {
          const cells = MarkdownGroupHelper.splitSingleLineCells(parsed.singleLineContent).map((c) => c.trim()).filter(Boolean);
          const firstCell = cells[0];
          const firstParts = firstCell.split(/\s+/);
          const style = firstParts[0];
          cells[0] = firstParts.slice(1).join(" ");
          const singleGroup = {
            id: nextDeterministicId("group"),
            style,
            compoundStyles: style.split(/[+,]/).map((s) => s.trim()).filter(Boolean),
            attributes: {},
            isSingleLine: true,
            singleLineCells: cells
          };
          context.emitTag({
            name: "group",
            isStart: true,
            group: singleGroup,
            attributes: { id: singleGroup.id, style: singleGroup.style, ...singleGroup.condition ? { condition: singleGroup.condition } : {}, isSingleLine: true }
          });
          context.emitTag({
            name: "group",
            isStart: false,
            group: singleGroup,
            text: cells.join(" | "),
            attributes: { id: singleGroup.id, style: singleGroup.style, ...singleGroup.condition ? { condition: singleGroup.condition } : {}, isSingleLine: true }
          });
          return true;
        }
        const group = {
          id: parsed.id,
          style: parsed.style,
          compoundStyles: parsed.compoundStyles,
          condition: parsed.condition,
          isCustomStyle: parsed.isCustomStyle,
          attributes: parsed.attributes
        };
        this.groupStack.push({
          group,
          inHeader: true,
          headerLines: [],
          bodyLines: []
        });
        context.emitTag({
          name: "group",
          isStart: true,
          group,
          attributes: { id: group.id, style: group.style, compoundStyles: group.compoundStyles, ...group.condition ? { condition: group.condition } : {}, ...group.attributes }
        });
        return true;
      }
      if (this.groupStack.length > 0) {
        const current = this.groupStack[this.groupStack.length - 1];
        if (current.inHeader) {
          if (trimmed === "---") {
            current.inHeader = false;
            return true;
          }
          const isAttribute = /^[a-zA-Z0-9_\-]+\s*:\s*.+$/.test(trimmed) && !trimmed.startsWith("[") && !trimmed.startsWith("!") && !trimmed.startsWith("?") && !trimmed.startsWith("#") && !trimmed.startsWith("`") && !trimmed.startsWith(">") && !trimmed.startsWith("|") && !trimmed.startsWith("-");
          if (isAttribute) {
            current.headerLines.push(line);
            return true;
          } else {
            current.inHeader = false;
            return false;
          }
        }
        return false;
      }
      return false;
    }
    parseHeaderAttributes(lines) {
      const attrs = {};
      for (const line of lines) {
        const idx = line.indexOf(":");
        if (idx !== -1) {
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
          attrs[k] = v;
        }
      }
      return attrs;
    }
    finalize(context) {
      while (this.groupStack.length > 0) {
        this.handle(":::", context);
      }
    }
    reset() {
      this.groupStack = [];
    }
  };

  // packages/core/dist/parser/handlers/ListHandler.js
  var ListHandler = class {
    priority = 13;
    name = "ListHandler";
    inList = false;
    isOrdered = false;
    startNumber = 1;
    canHandle(line, _context) {
      const trimmed = line.trim();
      if (/^[\-\*]\s+/.test(trimmed))
        return true;
      if (/^\d+\.\s+/.test(trimmed))
        return true;
      return false;
    }
    handle(line, context) {
      const trimmed = line.trim();
      const isBullet = /^[\-\*]\s+/.test(trimmed);
      const orderMatch = trimmed.match(/^(\d+)\.\s+/);
      if (isBullet || orderMatch) {
        const isCurrOrdered = !isBullet;
        const startNum = orderMatch ? Number(orderMatch[1]) : 1;
        if (!this.inList || this.isOrdered !== isCurrOrdered) {
          if (this.inList) {
            this.close(context);
          }
          context.closeImplicitBlocks(this);
          this.inList = true;
          this.isOrdered = isCurrOrdered;
          this.startNumber = startNum;
          context.emitTag({
            name: "list",
            isStart: true,
            attributes: { isOrdered: this.isOrdered, start: this.startNumber }
          });
        }
        const content = isBullet ? trimmed.replace(/^[\-\*]\s+/, "") : trimmed.replace(/^\d+\.\s+/, "");
        context.emitTag({ name: "listItem", isStart: true });
        context.emitTag({ name: "paragraph", isStart: true, text: content });
        context.emitTag({ name: "paragraph", isStart: false, text: content });
        context.emitTag({ name: "listItem", isStart: false });
        return true;
      }
      return false;
    }
    isOpen() {
      return this.inList;
    }
    close(context) {
      if (this.inList) {
        this.inList = false;
        const tag = {
          name: "list",
          isStart: false,
          attributes: { isOrdered: this.isOrdered, start: this.startNumber }
        };
        context.emitTag(tag);
        return [tag];
      }
      return [];
    }
  };

  // packages/core/dist/parser/handlers/TableRowHandler.js
  var TableRowHandler = class {
    priority = 14;
    name = "TableRowHandler";
    inTable = false;
    headerRow = null;
    alignments = [];
    canHandle(line, _context) {
      const trimmed = line.trim();
      return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.length > 1;
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (!this.canHandle(line, context)) {
        if (this.inTable) {
          this.close(context);
        }
        return false;
      }
      const rawCells = this.splitCells(trimmed.slice(1, -1));
      const isSeparator = rawCells.every((c) => /^:?-+:?$/.test(c));
      if (isSeparator) {
        this.alignments = rawCells.map((c) => {
          const leftColon = c.startsWith(":");
          const rightColon = c.endsWith(":");
          if (leftColon && rightColon)
            return "center";
          if (rightColon)
            return "right";
          return "left";
        });
        return true;
      }
      if (!this.inTable) {
        context.closeImplicitBlocks(this);
        this.inTable = true;
        this.headerRow = rawCells;
        this.alignments = rawCells.map(() => "left");
        context.emitTag({
          name: "table",
          isStart: true,
          attributes: { alignments: this.alignments }
        });
        this.emitRow(rawCells, true, context);
        return true;
      }
      this.emitRow(rawCells, false, context);
      return true;
    }
    emitRow(cells, isHeader, context) {
      context.emitTag({
        name: "tableRow",
        isStart: true,
        attributes: { isHeader }
      });
      for (let i = 0; i < cells.length; i++) {
        const align = this.alignments[i] || "left";
        context.emitTag({
          name: "tableCell",
          isStart: true,
          attributes: { align, isHeader }
        });
        context.emitTag({
          name: "paragraph",
          isStart: true,
          text: cells[i]
        });
        context.emitTag({
          name: "paragraph",
          isStart: false,
          text: cells[i]
        });
        context.emitTag({
          name: "tableCell",
          isStart: false,
          attributes: { align, isHeader }
        });
      }
      context.emitTag({
        name: "tableRow",
        isStart: false,
        attributes: { isHeader }
      });
    }
    splitCells(rowStr) {
      const cells = [];
      let current = "";
      let inCode = false;
      let codeTickCount = 0;
      let escaped = false;
      for (let i = 0; i < rowStr.length; i++) {
        const ch = rowStr[i];
        if (escaped) {
          if (ch === "|") {
            current += "|";
          } else {
            current += "\\" + ch;
          }
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === "`") {
          let count = 1;
          while (i + 1 < rowStr.length && rowStr[i + 1] === "`") {
            count++;
            i++;
          }
          const ticks = "`".repeat(count);
          current += ticks;
          if (!inCode) {
            inCode = true;
            codeTickCount = count;
          } else if (codeTickCount === count) {
            inCode = false;
            codeTickCount = 0;
          }
          continue;
        }
        if (ch === "|" && !inCode) {
          cells.push(current.trim());
          current = "";
          continue;
        }
        current += ch;
      }
      if (escaped)
        current += "\\";
      cells.push(current.trim());
      return cells;
    }
    isOpen() {
      return this.inTable;
    }
    close(context) {
      if (this.inTable) {
        this.inTable = false;
        this.headerRow = null;
        this.alignments = [];
        const tag = { name: "table", isStart: false };
        context.emitTag(tag);
        return [tag];
      }
      return [];
    }
  };

  // packages/core/dist/parser/handlers/FootnoteDefinitionHandler.js
  var FootnoteDefinitionHandler = class {
    priority = 15;
    name = "FootnoteDefinitionHandler";
    canHandle(line, _context) {
      return /^\[\^([a-zA-Z0-9_\-]+)\]:\s+/.test(line.trim());
    }
    handle(line, context) {
      const trimmed = line.trim();
      const match = trimmed.match(/^\[\^([a-zA-Z0-9_\-]+)\]:\s+(.*)$/);
      if (match) {
        const id = match[1];
        const text = match[2];
        context.emitTag({
          name: "footnote",
          isStart: true,
          text,
          attributes: { id }
        });
        context.emitTag({
          name: "footnote",
          isStart: false,
          text,
          attributes: { id }
        });
        return true;
      }
      return false;
    }
  };

  // packages/core/dist/parser/handlers/HeaderHandler.js
  var HeaderHandler = class {
    priority = 16;
    name = "HeaderHandler";
    canHandle(line, _context) {
      return /^#{1,6}\s+/.test(line.trim());
    }
    handle(line, context) {
      context.closeImplicitBlocks();
      const trimmed = line.trim();
      const metric = MarkdownMetricDeltaParser.parse(trimmed);
      if (metric) {
        context.emitTag({
          name: "metric",
          isStart: true,
          metric,
          text: metric.numeral,
          attributes: {
            delta: metric.delta,
            arrow: metric.arrow,
            sentiment: metric.sentiment,
            badgeStyle: metric.badgeStyle,
            period: metric.period,
            level: metric.level
          }
        });
        context.emitTag({
          name: "metric",
          isStart: false,
          metric,
          text: metric.numeral,
          attributes: {
            delta: metric.delta,
            arrow: metric.arrow,
            sentiment: metric.sentiment,
            badgeStyle: metric.badgeStyle,
            period: metric.period,
            level: metric.level
          }
        });
        return true;
      }
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        context.emitTag({
          name: "heading",
          isStart: true,
          text,
          attributes: { level }
        });
        context.emitTag({
          name: "heading",
          isStart: false,
          text,
          attributes: { level }
        });
        return true;
      }
      return false;
    }
  };

  // packages/core/dist/parser/handlers/ImageHandler.js
  var ImageHandler = class _ImageHandler {
    priority = 17;
    name = "ImageHandler";
    static IMAGE_REGEX = /^!\[([^\]]*)\]\(((?:[^()]+|\([^()]*\))*)\)(?:\s*\{([^}]*)\})?$/;
    canHandle(line, _context) {
      const trimmed = line.trim();
      return _ImageHandler.IMAGE_REGEX.test(trimmed);
    }
    handle(line, context) {
      context.closeImplicitBlocks();
      const trimmed = line.trim();
      const match = trimmed.match(_ImageHandler.IMAGE_REGEX);
      if (!match)
        return false;
      const rawAlt = match[1];
      const url = match[2].trim();
      const attrStr = match[3];
      const attributes = {};
      if (attrStr) {
        const attrRegex = /([a-zA-Z0-9_-]+)(?:[:=](?:"([^"]*)"|'([^']*)'|([^\s,{}]+)))?/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
          const key = attrMatch[1];
          const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "true";
          attributes[key] = val;
        }
      }
      if (attributes.shape && !attributes.style) {
        attributes.style = attributes.shape;
      }
      if (attributes.fit && !attributes.objectFit) {
        attributes.objectFit = attributes.fit;
      }
      let mediaType = "image";
      let cleanAlt = rawAlt.trim();
      const videoPrefixMatch = cleanAlt.match(/^video(?::\s*["']?(.*?)["']?)?$/i);
      const audioPrefixMatch = cleanAlt.match(/^audio(?::\s*["']?(.*?)["']?)?$/i);
      const embedPrefixMatch = cleanAlt.match(/^embed(?::\s*["']?(.*?)["']?)?$/i);
      if (videoPrefixMatch) {
        mediaType = "video";
        cleanAlt = videoPrefixMatch[1] || "Video";
      } else if (audioPrefixMatch) {
        mediaType = "audio";
        cleanAlt = audioPrefixMatch[1] || "Audio";
      } else if (embedPrefixMatch) {
        mediaType = "embed";
        cleanAlt = embedPrefixMatch[1] || "Embed";
      } else if (cleanAlt.toLowerCase() === "video") {
        mediaType = "video";
      } else if (cleanAlt.toLowerCase() === "audio") {
        mediaType = "audio";
      } else if (cleanAlt.toLowerCase() === "embed") {
        mediaType = "embed";
      } else {
        const cleanUrl = url.split("?")[0].toLowerCase();
        if (/\.(mp4|mov|m3u8|webm)$/i.test(cleanUrl)) {
          mediaType = "video";
        } else if (/\.(mp3|m4a|wav|aac|ogg)$/i.test(cleanUrl)) {
          mediaType = "audio";
        } else if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i.test(url)) {
          mediaType = "embed";
        }
      }
      if (!cleanAlt) {
        cleanAlt = mediaType === "image" ? "Image" : mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
      }
      const tagAttrs = {
        alt: cleanAlt,
        url,
        mediaType,
        ...attributes
      };
      context.emitTag({
        name: mediaType === "image" ? "image" : "media",
        isStart: true,
        attributes: tagAttrs
      });
      context.emitTag({
        name: mediaType === "image" ? "image" : "media",
        isStart: false,
        attributes: tagAttrs
      });
      return true;
    }
  };

  // packages/core/dist/parser/ActionLinkHandler.js
  var ActionLinkHandler = class {
    priority = 18;
    name = "ActionLinkHandler";
    canHandle(line, _context) {
      const trimmed = line.trim();
      if (!trimmed.includes("[") || !trimmed.includes("]("))
        return false;
      const nonActionContent = trimmed.replace(/\[(?:[^\]]*)\]\((?:[^()]+|\([^()]*\))*\)(?:\{[^}]*\})?/g, "").replace(/\.\.\./g, "").replace(/=/g, "").trim();
      return nonActionContent.length === 0;
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (!this.canHandle(line, context))
        return false;
      context.closeImplicitBlocks();
      const elements = [];
      const regex = /(\[[^\]]*\]\((?:[^()]+|\([^()]*\))*\)(?:\{[^}]*\})?)|\.\.\.|=/g;
      let match;
      while ((match = regex.exec(trimmed)) !== null) {
        const token = match[0];
        if (token === "...") {
          elements.push({ type: "spacer" });
        } else if (token === "=") {
          elements.push({ type: "equal" });
        } else {
          const linkMatch = token.match(/^\[(.*?)\]\(((?:[^()]+|\([^()]*\))*)\)(?:\{(.*?)\})?$/);
          if (linkMatch) {
            const label = linkMatch[1];
            const url = linkMatch[2];
            const attrStr = linkMatch[3] || "";
            const trigger = MarkdownActionHelper.parseTrigger(url);
            const { style, icon, attributes } = MarkdownActionHelper.parseStyleAttributes(attrStr);
            const meaningfulId = attributes.id || (trigger.payload && trigger.payload !== "none" && !trigger.payload.includes(" ") && !trigger.payload.includes("=") && !trigger.payload.includes("{") ? trigger.payload.replace(/[^\w-]/g, "_") : void 0) || (label ? label.trim().toLowerCase().replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "") : void 0) || nextDeterministicId("action");
            elements.push({
              type: "action",
              action: {
                id: meaningfulId,
                label,
                trigger,
                style,
                icon,
                attributes
              }
            });
          }
        }
      }
      if (elements.length === 0)
        return false;
      if (elements.length === 1 && elements[0].type === "action") {
        const act = elements[0].action;
        context.emitTag({
          name: "action",
          isStart: true,
          action: act,
          text: act.label,
          attributes: { id: act.id, style: act.style }
        });
        context.emitTag({
          name: "action",
          isStart: false,
          action: act,
          text: act.label,
          attributes: { id: act.id, style: act.style }
        });
        return true;
      }
      const hasEqual = elements.some((e) => e.type === "equal");
      context.emitTag({
        name: "actionRow",
        isStart: true,
        attributes: { isEqualSplit: hasEqual }
      });
      for (const elem of elements) {
        if (elem.type === "spacer") {
          context.emitTag({
            name: "actionSpacer",
            isStart: true
          });
          context.emitTag({
            name: "actionSpacer",
            isStart: false
          });
        } else if (elem.type === "action") {
          const act = elem.action;
          context.emitTag({
            name: "action",
            isStart: true,
            action: act,
            text: act.label,
            attributes: { id: act.id, style: act.style, equalGrow: hasEqual }
          });
          context.emitTag({
            name: "action",
            isStart: false,
            action: act,
            text: act.label,
            attributes: { id: act.id, style: act.style, equalGrow: hasEqual }
          });
        }
      }
      context.emitTag({
        name: "actionRow",
        isStart: false,
        attributes: { isEqualSplit: hasEqual }
      });
      return true;
    }
  };

  // packages/core/dist/parser/handlers/DividerHandler.js
  var DividerHandler = class {
    priority = 19;
    name = "DividerHandler";
    canHandle(line, _context) {
      const trimmed = line.trim();
      return /^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed) || /^___+$/.test(trimmed) || /^===+$/.test(trimmed);
    }
    handle(line, context) {
      context.closeImplicitBlocks();
      const trimmed = line.trim();
      const isBleed = /^===+$/.test(trimmed);
      context.emitTag({
        name: "divider",
        isStart: true,
        attributes: { bleed: isBleed }
      });
      context.emitTag({
        name: "divider",
        isStart: false,
        attributes: { bleed: isBleed }
      });
      return true;
    }
  };

  // packages/core/dist/parser/handlers/ParagraphHandler.js
  var ParagraphHandler = class {
    priority = 20;
    name = "ParagraphHandler";
    inParagraph = false;
    lines = [];
    canHandle(_line, _context) {
      return true;
    }
    handle(line, context) {
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        if (this.inParagraph) {
          this.close(context);
        }
        return false;
      }
      if (!this.inParagraph) {
        context.closeImplicitBlocks(this);
        this.inParagraph = true;
        this.lines = [];
        context.emitTag({ name: "paragraph", isStart: true });
      }
      const hasHardBreak = line.endsWith("\\") || line.endsWith("  ");
      let cleanLine = line;
      if (line.endsWith("\\")) {
        cleanLine = line.slice(0, -1);
      }
      this.lines.push(cleanLine.trimEnd());
      if (hasHardBreak) {
        this.lines.push("\n");
      }
      return true;
    }
    isOpen() {
      return this.inParagraph;
    }
    close(context) {
      if (this.inParagraph) {
        this.inParagraph = false;
        const fullText = this.lines.join(" ").replace(/\s*\n\s*/g, "\n");
        const tag = {
          name: "paragraph",
          isStart: false,
          text: fullText
        };
        context.emitTag(tag);
        this.lines = [];
        return [tag];
      }
      return [];
    }
  };

  // packages/core/dist/parser/MarkdownHandlerRegistry.js
  var MarkdownHandlerRegistry = class _MarkdownHandlerRegistry {
    handlers = [];
    constructor() {
      this.registerDefaults();
    }
    registerDefaults() {
      this.handlers = [
        new CodeBlockHandler(),
        // 1 (Highest: preserves all content inside ``` blocks)
        new MarkdownPanelHandler(),
        // 2
        new LoopHandler(),
        // 3
        new DataVariableHandler(),
        // 4
        new RuleDefinitionHandler(),
        // 5
        new MediaHandler(),
        // 6
        new MarkdownInputHandler(),
        // 7
        new AccordionHandler(),
        // 7
        new ConditionalHandler(),
        // 8
        new ActionHandler(),
        // 9
        new EmptyLineHandler(),
        // 10
        new BlockquoteHandler(),
        // 11
        new GroupHandler(),
        // 12
        new ListHandler(),
        // 13
        new TableRowHandler(),
        // 14
        new FootnoteDefinitionHandler(),
        // 15
        new HeaderHandler(),
        // 16
        new ImageHandler(),
        // 17
        new ActionLinkHandler(),
        // 18
        new DividerHandler(),
        // 19
        new ParagraphHandler()
        // 20
      ];
      this.handlers.sort((a, b) => a.priority - b.priority);
    }
    getHandlers() {
      return [...this.handlers];
    }
    getImplicitCloseHandlers() {
      return this.handlers.filter((h) => "isOpen" in h && "close" in h);
    }
    /**
     * Creates an isolated clone of this registry (ADR 006) for concurrency safety.
     */
    clone() {
      return new _MarkdownHandlerRegistry();
    }
  };

  // packages/core/dist/parser/MarkdownInlineHandler.js
  var MarkdownInlineHandler = class {
    /**
     * Tokenizes an inline string into InlineSpan nodes.
     */
    static parse(text) {
      if (!text)
        return [];
      const spans = [];
      let i = 0;
      const len = text.length;
      let buffer = "";
      const flushBuffer = () => {
        if (buffer.length > 0) {
          spans.push({ type: "text", content: buffer });
          buffer = "";
        }
      };
      while (i < len) {
        if (text[i] === "\\" && i + 1 < len) {
          buffer += text[i + 1];
          i += 2;
          continue;
        }
        if (text[i] === "`") {
          let tickCount = 0;
          while (i + tickCount < len && text[i + tickCount] === "`") {
            tickCount++;
          }
          const delimiter = text.slice(i, i + tickCount);
          const end = text.indexOf(delimiter, i + tickCount);
          if (end !== -1) {
            flushBuffer();
            const codeContent = text.slice(i + tickCount, end);
            spans.push({ type: "code", content: codeContent });
            i = end + tickCount;
            continue;
          }
        }
        if (text[i] === "{" && text[i + 1] === "{") {
          const end = text.indexOf("}}", i + 2);
          if (end !== -1) {
            flushBuffer();
            let expr = text.slice(i + 2, end).trim();
            let nextIndex = end + 2;
            let fontStyle;
            let colorName;
            let bgColor;
            const parseStyleParts = (styleSpec) => {
              const parts = styleSpec.split(",").map((s) => s.trim());
              const fontStyles = fontStyle ? [fontStyle] : [];
              for (const part of parts) {
                if (part.startsWith(".")) {
                  fontStyles.push(part.slice(1));
                } else if (part.toLowerCase().startsWith("bg:")) {
                  const bg = part.slice(3).trim();
                  if (!bg.startsWith("#") && !bg.startsWith("rgb") && !bg.startsWith("hsl")) {
                    bgColor = bg;
                  }
                } else if (part.length > 0) {
                  if (!part.startsWith("#") && !part.startsWith("rgb") && !part.startsWith("hsl")) {
                    colorName = part;
                  }
                }
              }
              if (fontStyles.length > 0) {
                fontStyle = fontStyles.join(" ");
              }
            };
            if (text[nextIndex] === "{" && text[nextIndex + 1] !== "{") {
              const endStyle = text.indexOf("}", nextIndex + 1);
              if (endStyle !== -1) {
                const styleSpec = text.slice(nextIndex + 1, endStyle);
                parseStyleParts(styleSpec);
                nextIndex = endStyle + 1;
              }
            }
            if (!fontStyle && !colorName && !bgColor) {
              const pipeSegments = expr.split("|");
              if (pipeSegments.length >= 4) {
                const styleSpec = pipeSegments[3].trim();
                parseStyleParts(styleSpec);
                expr = pipeSegments.slice(0, 3).join("|");
              } else {
                const lastSeg = pipeSegments[pipeSegments.length - 1];
                const colonMatch = lastSeg.match(/:(\.[a-zA-Z]+|bg:[a-zA-Z]+|[a-zA-Z]+)(?:,\s*(\.[a-zA-Z]+|bg:[a-zA-Z]+|[a-zA-Z]+))*$/);
                if (colonMatch) {
                  const styleSpec = lastSeg.slice(colonMatch.index + 1);
                  parseStyleParts(styleSpec);
                  pipeSegments[pipeSegments.length - 1] = lastSeg.slice(0, colonMatch.index);
                  expr = pipeSegments.join("|");
                }
              }
            }
            spans.push({
              type: "interpolation",
              content: expr,
              fontStyle,
              colorName,
              ...bgColor ? { bgColor } : {}
            });
            i = nextIndex;
            continue;
          }
        }
        if (text[i] === "{" && text[i + 1] !== "{" && text[i + 1] !== "}") {
          const closeBrace = text.indexOf("}", i + 1);
          if (closeBrace !== -1) {
            const spec = text.slice(i + 1, closeBrace);
            const isStyleSpec = spec.startsWith(".") || spec.toLowerCase().startsWith("bg:") || spec.includes(",") || /^[a-zA-Z]+$/.test(spec);
            if (isStyleSpec) {
              const closingTag = text.indexOf("{}", closeBrace + 1);
              if (closingTag !== -1) {
                flushBuffer();
                const innerText = text.slice(closeBrace + 1, closingTag);
                const children = this.parse(innerText);
                let fontStyle;
                let colorName;
                let bgColor;
                const parts = spec.split(",").map((s) => s.trim());
                const fontStyles = [];
                for (const part of parts) {
                  if (part.startsWith(".")) {
                    fontStyles.push(part.slice(1));
                  } else if (part.toLowerCase().startsWith("bg:")) {
                    const bg = part.slice(3).trim();
                    if (!bg.startsWith("#") && !bg.startsWith("rgb") && !bg.startsWith("hsl")) {
                      bgColor = bg;
                    }
                  } else if (part.length > 0) {
                    if (!part.startsWith("#") && !part.startsWith("rgb") && !part.startsWith("hsl")) {
                      colorName = part;
                    }
                  }
                }
                if (fontStyles.length > 0) {
                  fontStyle = fontStyles.join(" ");
                }
                spans.push({
                  type: "customStyle",
                  content: innerText,
                  fontStyle,
                  colorName,
                  ...bgColor ? { bgColor } : {},
                  children
                });
                i = closingTag + 2;
                continue;
              }
            }
          }
        }
        if (text[i] === "[") {
          const endBracket = text.indexOf("]", i + 1);
          if (endBracket !== -1 && text[endBracket + 1] === "(") {
            let parenDepth = 1;
            let endParen = -1;
            for (let p = endBracket + 2; p < text.length; p++) {
              if (text[p] === "(") {
                parenDepth++;
              } else if (text[p] === ")") {
                parenDepth--;
                if (parenDepth === 0) {
                  endParen = p;
                  break;
                }
              }
            }
            if (endParen !== -1) {
              flushBuffer();
              const label = text.slice(i + 1, endBracket);
              const url = text.slice(endBracket + 2, endParen);
              let nextIndex = endParen + 1;
              let attrStr = "";
              if (text[nextIndex] === "{") {
                const endAttr = text.indexOf("}", nextIndex + 1);
                if (endAttr !== -1) {
                  attrStr = text.slice(nextIndex, endAttr + 1);
                  nextIndex = endAttr + 1;
                }
              }
              const isActionScheme = /^(action:|event:|open-panel:|panel:|set:|submit:|submit$|https?:|>>>)/.test(url) || attrStr.length > 0;
              if (isActionScheme) {
                const parsedTrigger = MarkdownActionHelper.parseTrigger(url);
                const parsedAttrs = MarkdownActionHelper.parseStyleAttributes(attrStr);
                spans.push({
                  type: "link",
                  content: label,
                  url,
                  action: {
                    id: parsedAttrs.attributes.id || (label ? label.trim().toLowerCase().replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "") : "") || nextDeterministicId("action"),
                    label,
                    trigger: parsedTrigger,
                    style: parsedAttrs.style,
                    icon: parsedAttrs.icon,
                    attributes: parsedAttrs.attributes
                  },
                  children: this.parse(label)
                });
              } else {
                spans.push({
                  type: "link",
                  content: label,
                  url,
                  children: this.parse(label)
                });
              }
              i = nextIndex;
              continue;
            }
          }
          if (text[i + 1] === "^") {
            const endBracket2 = text.indexOf("]", i + 2);
            if (endBracket2 !== -1) {
              flushBuffer();
              const id = text.slice(i + 2, endBracket2);
              spans.push({ type: "footnoteRef", content: id });
              i = endBracket2 + 1;
              continue;
            }
          }
        }
        if (text.startsWith("***", i)) {
          const end = text.indexOf("***", i + 3);
          if (end !== -1) {
            flushBuffer();
            const inner = text.slice(i + 3, end);
            spans.push({
              type: "boldItalic",
              content: inner,
              children: this.parse(inner)
            });
            i = end + 3;
            continue;
          }
        }
        if (text.startsWith("**", i)) {
          const end = text.indexOf("**", i + 2);
          if (end !== -1) {
            flushBuffer();
            const inner = text.slice(i + 2, end);
            spans.push({
              type: "bold",
              content: inner,
              children: this.parse(inner)
            });
            i = end + 2;
            continue;
          }
        }
        if (text.startsWith("__", i)) {
          const end = text.indexOf("__", i + 2);
          if (end !== -1) {
            flushBuffer();
            const inner = text.slice(i + 2, end);
            spans.push({
              type: "underline",
              content: inner,
              children: this.parse(inner)
            });
            i = end + 2;
            continue;
          }
        }
        if (text.startsWith("++", i)) {
          const end = text.indexOf("++", i + 2);
          if (end !== -1) {
            flushBuffer();
            const inner = text.slice(i + 2, end);
            spans.push({
              type: "underline",
              content: inner,
              children: this.parse(inner)
            });
            i = end + 2;
            continue;
          }
        }
        if (text.startsWith("~~", i)) {
          const end = text.indexOf("~~", i + 2);
          if (end !== -1) {
            flushBuffer();
            const inner = text.slice(i + 2, end);
            spans.push({
              type: "strike",
              content: inner,
              children: this.parse(inner)
            });
            i = end + 2;
            continue;
          }
        }
        if (text[i] === "~" && text[i + 1] !== "~") {
          const end = text.indexOf("~", i + 1);
          if (end !== -1 && end > i + 1 && text[end + 1] !== "~") {
            flushBuffer();
            const inner = text.slice(i + 1, end);
            spans.push({ type: "sub", content: inner });
            i = end + 1;
            continue;
          }
        }
        if (text[i] === "^") {
          const end = text.indexOf("^", i + 1);
          if (end !== -1 && end > i + 1) {
            flushBuffer();
            const inner = text.slice(i + 1, end);
            spans.push({ type: "super", content: inner });
            i = end + 1;
            continue;
          }
        }
        if (text[i] === "*" && text[i + 1] !== "*") {
          const end = text.indexOf("*", i + 1);
          if (end !== -1 && end > i + 1 && text[end - 1] !== "\\") {
            flushBuffer();
            const inner = text.slice(i + 1, end);
            spans.push({
              type: "italic",
              content: inner,
              children: this.parse(inner)
            });
            i = end + 1;
            continue;
          }
        }
        buffer += text[i];
        i++;
      }
      flushBuffer();
      return spans;
    }
  };

  // packages/core/dist/parser/accumulator/MarkdownUIAccumulator.js
  var MarkdownUIAccumulator = class {
    stack = [];
    rootBlocks = [];
    startElement(tag) {
      if (tag.name === "conditional" && tag.attributes?.isBranch) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
          if (this.stack[i].kind === "conditional") {
            const condBlock = this.stack[i];
            if (tag.attributes.branch === "else") {
              condBlock.inElse = true;
            } else if (tag.attributes.branch === "case") {
              if (!condBlock.switchCases)
                condBlock.switchCases = [];
              const newCase = {
                value: tag.attributes.value,
                after: tag.attributes.after,
                announce: tag.attributes.announce,
                children: []
              };
              condBlock.switchCases.push(newCase);
              condBlock.currentCase = newCase;
              condBlock.inDefault = false;
            } else if (tag.attributes.branch === "default") {
              condBlock.inDefault = true;
              condBlock.currentCase = void 0;
            }
            break;
          }
        }
        return;
      }
      if (tag.name === "conditional" && tag.attributes?.isBranchAttr) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
          if (this.stack[i].kind === "conditional") {
            const condBlock = this.stack[i];
            if (condBlock.currentCase) {
              if (tag.attributes.after)
                condBlock.currentCase.after = tag.attributes.after;
              if (tag.attributes.announce)
                condBlock.currentCase.announce = tag.attributes.announce;
            } else if (tag.attributes.announce) {
              condBlock.announce = tag.attributes.announce;
            }
            break;
          }
        }
        return;
      }
      if (tag.name === "accordion" && tag.attributes?.isZone && tag.attributes?.zone === "expanded") {
        for (let i = this.stack.length - 1; i >= 0; i--) {
          if (this.stack[i].kind === "accordion") {
            this.stack[i].inDefault = false;
            break;
          }
        }
        return;
      }
      const block = {
        id: tag.attributes?.id || nextDeterministicId(tag.name),
        kind: tag.name,
        rawText: tag.text || "",
        metric: tag.metric,
        action: tag.action,
        input: tag.input,
        group: tag.group,
        panel: tag.panel,
        codeLanguage: tag.attributes?.language,
        level: tag.attributes?.level,
        isOrderedList: tag.attributes?.isOrdered,
        listStart: tag.attributes?.start,
        tableAlignments: tag.attributes?.alignments,
        mediaType: tag.attributes?.mediaType,
        mediaUrl: tag.attributes?.url,
        altText: tag.attributes?.alt,
        isDividerBleed: tag.attributes?.bleed,
        condition: tag.attributes?.condition || tag.group?.condition,
        loopDataset: tag.attributes?.dataset,
        loopAlias: tag.attributes?.alias,
        accordionStyle: tag.attributes?.style,
        isOpen: tag.attributes?.open === "true",
        isSwitch: tag.attributes?.isSwitch === true || tag.attributes?.isSwitch === "true",
        switchVariable: tag.attributes?.switchVariable,
        announce: tag.attributes?.announce,
        switchCases: [],
        attributes: tag.attributes,
        children: [],
        defaultChildren: [],
        elseChildren: [],
        inDefault: tag.name === "accordion"
      };
      if (tag.text) {
        block.spans = MarkdownInlineHandler.parse(tag.text);
      }
      this.stack.push(block);
    }
    characters(text) {
      if (this.stack.length === 0) {
        this.startElement({ name: "paragraph", isStart: true });
      }
      const current = this.stack[this.stack.length - 1];
      if (current.kind === "conditional" || current.kind === "accordion") {
        this.startElement({ name: "paragraph", isStart: true });
        const p = this.stack[this.stack.length - 1];
        p.rawText = text;
        return;
      }
      if (!current.rawText) {
        current.rawText = text;
      } else {
        current.rawText += (current.rawText.endsWith("\n") ? "" : "\n") + text;
      }
    }
    endElement(tag) {
      if (this.stack.length === 0)
        return;
      const block = this.stack.pop();
      if (tag.input)
        block.input = { ...block.input, ...tag.input };
      if (tag.panel)
        block.panel = { ...block.panel, ...tag.panel };
      if (tag.group) {
        block.group = { ...block.group, ...tag.group };
        if (tag.group.id)
          block.id = tag.group.id;
      }
      if (tag.action)
        block.action = { ...block.action, ...tag.action };
      if (tag.attributes) {
        block.attributes = { ...block.attributes, ...tag.attributes };
        if (block.kind === "accordion" && (tag.attributes.accordionStyle || tag.attributes.style)) {
          block.accordionStyle = tag.attributes.accordionStyle || tag.attributes.style;
        }
      }
      if (tag.text && !block.rawText) {
        block.rawText = tag.text;
      }
      if (block.rawText && (!block.spans || block.spans.length === 0)) {
        block.spans = MarkdownInlineHandler.parse(block.rawText);
      }
      if (block.rawText && (block.kind === "group" || block.kind === "action" || block.kind === "input")) {
        block.customBody = new MarkdownCustomBody(block.rawText);
      }
      if (this.stack.length > 0) {
        const parent = this.stack[this.stack.length - 1];
        if (parent.kind === "conditional") {
          if (parent.inElse) {
            if (!parent.elseChildren)
              parent.elseChildren = [];
            parent.elseChildren.push(block);
          } else if (parent.inDefault) {
            if (!parent.defaultChildren)
              parent.defaultChildren = [];
            parent.defaultChildren.push(block);
          } else if (parent.currentCase) {
            if (!parent.currentCase.children)
              parent.currentCase.children = [];
            parent.currentCase.children.push(block);
          } else {
            if (!parent.children)
              parent.children = [];
            parent.children.push(block);
          }
        } else if (parent.kind === "accordion" && parent.inDefault) {
          if (!parent.defaultChildren)
            parent.defaultChildren = [];
          parent.defaultChildren.push(block);
        } else {
          if (!parent.children)
            parent.children = [];
          parent.children.push(block);
        }
      } else {
        this.rootBlocks.push(block);
      }
    }
    reset() {
      this.stack = [];
      this.rootBlocks.length = 0;
    }
  };

  // packages/core/dist/parser/MarkdownSAXParser.js
  var MarkdownSAXParser = class {
    registry;
    variables = {};
    currentLineNumber = 0;
    delegate = null;
    constructor(registry) {
      this.registry = registry ? registry.clone() : new MarkdownHandlerRegistry();
    }
    setVariables(vars) {
      this.variables = { ...vars };
    }
    getVariable(key) {
      return this.variables[key];
    }
    getVariables() {
      return { ...this.variables };
    }
    setVariable(key, value) {
      this.variables[key] = value;
    }
    /**
     * Streaming SAX parse: iterates through lines and emits events to delegate.
     */
    parse(markdown, delegate) {
      resetDeterministicIds();
      this.delegate = delegate;
      this.currentLineNumber = 0;
      const rawLines = markdown.split(/\r?\n/);
      const uncommentedLines = [];
      let inCommentBlock = false;
      let inCodeFence = false;
      for (const originalLine of rawLines) {
        let line = originalLine;
        const rawTrimmed = line.trim();
        if (!inCommentBlock && rawTrimmed.startsWith("```")) {
          inCodeFence = !inCodeFence;
          uncommentedLines.push(line);
          continue;
        }
        if (inCodeFence) {
          uncommentedLines.push(line);
          continue;
        }
        let hadComment = false;
        if (inCommentBlock) {
          hadComment = true;
          const endIdx = line.indexOf("-->");
          if (endIdx === -1) {
            continue;
          }
          inCommentBlock = false;
          line = line.slice(endIdx + 3);
        }
        while (line.includes("<!--")) {
          hadComment = true;
          const startIdx = line.indexOf("<!--");
          const endIdx = line.indexOf("-->", startIdx + 4);
          if (endIdx !== -1) {
            line = line.slice(0, startIdx) + line.slice(endIdx + 3);
          } else {
            inCommentBlock = true;
            line = line.slice(0, startIdx);
            break;
          }
        }
        if (hadComment && line.trim() === "") {
          continue;
        }
        const trimmedAfterHtml = line.trim();
        if (trimmedAfterHtml.startsWith("//") && !trimmedAfterHtml.startsWith("///")) {
          continue;
        }
        uncommentedLines.push(line);
      }
      let nonSpacerOpenFences = 0;
      let closeFences = 0;
      let scanCodeFence = false;
      for (const l of uncommentedLines) {
        const t = l.trim();
        if (t.startsWith("```")) {
          scanCodeFence = !scanCodeFence;
          continue;
        }
        if (scanCodeFence)
          continue;
        if (t === ":::") {
          closeFences++;
        } else if (t.startsWith(":::") && !t.startsWith("::::")) {
          const isPipeSingle = MarkdownGroupHelper.splitSingleLineCells(t.replace(/^:::\s*/, "")).length >= 2;
          const isSpacer = /^:::\s*spacer\b/i.test(t);
          if (!isPipeSingle && !isSpacer) {
            nonSpacerOpenFences++;
          }
        }
      }
      const lines = [];
      inCodeFence = false;
      for (let idx = 0; idx < uncommentedLines.length; idx++) {
        const rawLine = uncommentedLines[idx];
        const trimmed = rawLine.trim();
        if (trimmed.startsWith("```")) {
          inCodeFence = !inCodeFence;
          lines.push(rawLine);
          continue;
        }
        if (inCodeFence) {
          lines.push(rawLine);
          continue;
        }
        if (trimmed.startsWith(":::") && !trimmed.startsWith("::::") && trimmed !== ":::") {
          const parsed = MarkdownGroupHelper.parseFence(trimmed);
          if (parsed.singleLineContent) {
            const rawCells = MarkdownGroupHelper.splitSingleLineCells(parsed.singleLineContent);
            if (rawCells.length >= 2) {
              const firstCell = rawCells[0].trim();
              const tokens = [];
              let cur = "";
              let inQ = null;
              for (let ci = 0; ci < firstCell.length; ci++) {
                const ch = firstCell[ci];
                if ((ch === '"' || ch === "'") && (inQ === null || inQ === ch)) {
                  inQ = inQ === null ? ch : null;
                  cur += ch;
                } else if (/\s/.test(ch) && !inQ) {
                  if (cur) {
                    tokens.push(cur);
                    cur = "";
                  }
                } else {
                  cur += ch;
                }
              }
              if (cur)
                tokens.push(cur);
              const fenceTokens = [];
              let contentStartTokenIdx = tokens.length;
              if (tokens.length > 0) {
                fenceTokens.push(tokens[0]);
                let ti = 1;
                while (ti < tokens.length) {
                  const tok = tokens[ti];
                  if (tok === "if:" || tok === "if=" || tok === "unless:" || tok === "unless=") {
                    fenceTokens.push(tok);
                    ti++;
                    while (ti < tokens.length && !tokens[ti].startsWith("#") && !tokens[ti].startsWith("*") && !tokens[ti].startsWith("[") && !/^[a-zA-Z0-9_-]+[:=]/.test(tokens[ti])) {
                      fenceTokens.push(tokens[ti]);
                      if (tokens[ti].endsWith('"') || tokens[ti].endsWith("'")) {
                        ti++;
                        break;
                      }
                      ti++;
                    }
                  } else if (/^(?:if|unless)[:=]/i.test(tok)) {
                    fenceTokens.push(tok);
                    ti++;
                  } else if (/^[a-zA-Z0-9_-]+[:=]/.test(tok)) {
                    fenceTokens.push(tok);
                    if (tok.endsWith(":") && ti + 1 < tokens.length) {
                      fenceTokens.push(tokens[++ti]);
                    }
                    ti++;
                  } else if (ti === 1 && /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(tok) && (tokens.length === 2 && rawCells.length >= 3 || tokens.length > 2 && /^[a-zA-Z0-9_-]+[:=]/.test(tokens[2]))) {
                    fenceTokens.push(tok);
                    ti++;
                  } else {
                    contentStartTokenIdx = ti;
                    break;
                  }
                }
              }
              rawCells[0] = tokens.slice(contentStartTokenIdx).join(" ");
              const cells = rawCells.map((c) => c.trim()).filter(Boolean);
              lines.push(`::: ${fenceTokens.join(" ")}`);
              for (const cell of cells) {
                if (cell.trim())
                  lines.push(cell.trim());
              }
              lines.push(":::");
              continue;
            }
          }
          if (/^:::\s*spacer(?:\s+.*)?$/i.test(trimmed)) {
            let nextNonEmpty = "";
            for (let j = idx + 1; j < uncommentedLines.length; j++) {
              if (uncommentedLines[j].trim() !== "") {
                nextNonEmpty = uncommentedLines[j].trim();
                break;
              }
            }
            const hasHeaderAttrNext = /^(?:height|size|width)\s*:/i.test(nextNonEmpty);
            const hasExplicitCloseNext = nextNonEmpty === ":::" && closeFences > nonSpacerOpenFences;
            lines.push(rawLine);
            if (!hasHeaderAttrNext && !hasExplicitCloseNext) {
              lines.push(":::");
            } else if (hasExplicitCloseNext) {
              closeFences--;
            }
            continue;
          }
        }
        lines.push(rawLine);
      }
      const handlers = this.registry.getHandlers();
      const context = {
        emitTag: (tag) => {
          if (tag.isStart) {
            this.delegate?.startElement(tag);
          } else {
            this.delegate?.endElement(tag);
          }
        },
        closeImplicitBlocks: (excluding) => {
          const implicitHandlers = this.registry.getImplicitCloseHandlers();
          for (const handler of implicitHandlers) {
            if (handler !== excluding && handler.isOpen()) {
              handler.close(context);
            }
          }
        },
        getVariable: (key) => this.getVariable(key),
        setVariable: (key, value) => this.setVariable(key, value),
        lineNumber: this.currentLineNumber
      };
      for (const handler of handlers) {
        if ("reset" in handler && typeof handler.reset === "function") {
          handler.reset();
        }
      }
      for (let i = 0; i < lines.length; i++) {
        this.currentLineNumber = i + 1;
        const line = lines[i];
        let handled = false;
        for (const handler of handlers) {
          if (handler.canHandle(line, context)) {
            handled = handler.handle(line, context);
            if (handled)
              break;
          }
        }
        if (!handled && line.trim().length > 0) {
          this.delegate.characters(line);
        }
      }
      context.closeImplicitBlocks();
      for (const handler of handlers) {
        handler.finalize?.(context);
      }
      this.delegate = null;
    }
    /**
     * Convenience high-level method: parses markdown directly into a ParsedBlock tree.
     */
    parseToBlocks(markdown) {
      const accumulator = new MarkdownUIAccumulator();
      this.parse(markdown, accumulator);
      return accumulator.rootBlocks;
    }
    /**
     * Static linter method that checks for unclosed fences or syntactic warnings.
     */
    static lint(markdown) {
      const diagnostics = [];
      const lines = markdown.split(/\r?\n/);
      let groupDepth = 0;
      let conditionalDepth = 0;
      let loopDepth = 0;
      let accordionDepth = 0;
      let inCode = false;
      let inAction = false;
      let inInput = false;
      let inPanel = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        if (line.startsWith("```")) {
          inCode = !inCode;
        } else if (!inCode) {
          if (line.startsWith(":::")) {
            if (line === ":::") {
              if (groupDepth > 0)
                groupDepth--;
              else
                diagnostics.push({ line: lineNum, message: "Unmatched closing fence :::", severity: "warning" });
            } else {
              if (line.includes("|")) {
              } else {
                const unquotedMulti = line.match(/\b(if|unless)=([^\s"'][^\s]*\s+[^"'\s]+)/);
                if (unquotedMulti) {
                  diagnostics.push({ line: lineNum, message: `Multi-token condition expression should be quoted: ${unquotedMulti[0]}`, severity: "warning" });
                }
                groupDepth++;
              }
            }
          } else if (line.startsWith("|||")) {
            if (line === "|||") {
              if (conditionalDepth > 0)
                conditionalDepth--;
              else
                diagnostics.push({ line: lineNum, message: "Unmatched closing conditional fence |||", severity: "warning" });
            } else {
              conditionalDepth++;
            }
          } else if (line.startsWith("~~~")) {
            if (line === "~~~") {
              if (loopDepth > 0)
                loopDepth--;
              else
                diagnostics.push({ line: lineNum, message: "Unmatched closing loop fence ~~~", severity: "warning" });
            } else {
              loopDepth++;
            }
          } else if (line.startsWith(">>>")) {
            if (line === ">>>") {
              if (inPanel)
                inPanel = false;
              else
                diagnostics.push({ line: lineNum, message: "Unmatched closing panel fence >>>", severity: "warning" });
            } else {
              inPanel = true;
            }
          } else if (line.startsWith("^^^")) {
            if (line === "^^^") {
              if (accordionDepth > 0)
                accordionDepth--;
              else
                diagnostics.push({ line: lineNum, message: "Unmatched closing accordion fence ^^^", severity: "warning" });
            } else {
              accordionDepth++;
            }
          } else if (line.startsWith("!!!")) {
            if (line === "!!!") {
              if (inAction)
                inAction = false;
              else
                diagnostics.push({ line: lineNum, message: "Unmatched closing action fence !!!", severity: "warning" });
            } else {
              inAction = true;
            }
          } else if (line.startsWith("???")) {
            if (line === "???") {
              if (inInput)
                inInput = false;
              else
                diagnostics.push({ line: lineNum, message: "Unmatched closing input fence ???", severity: "warning" });
            } else if (!line.includes('"') && !line.includes("'") && !line.includes("=")) {
              inInput = true;
            }
          }
        }
      }
      if (groupDepth > 0) {
        diagnostics.push({ line: lines.length, message: `${groupDepth} unclosed container fence(s) :::`, severity: "warning" });
      }
      if (conditionalDepth > 0) {
        diagnostics.push({ line: lines.length, message: `${conditionalDepth} unclosed conditional fence(s) |||`, severity: "warning" });
      }
      if (loopDepth > 0) {
        diagnostics.push({ line: lines.length, message: `${loopDepth} unclosed loop fence(s) ~~~`, severity: "warning" });
      }
      if (accordionDepth > 0) {
        diagnostics.push({ line: lines.length, message: `${accordionDepth} unclosed accordion fence(s) ^^^`, severity: "warning" });
      }
      if (inPanel) {
        diagnostics.push({ line: lines.length, message: "Unclosed panel fence >>>", severity: "warning" });
      }
      if (inCode) {
        diagnostics.push({ line: lines.length, message: "Unclosed code block fence ```", severity: "warning" });
      }
      if (inAction) {
        diagnostics.push({ line: lines.length, message: "Unclosed action block fence !!!", severity: "warning" });
      }
      if (inInput) {
        diagnostics.push({ line: lines.length, message: "Unclosed input block fence ???", severity: "warning" });
      }
      return diagnostics;
    }
  };

  // packages/core/dist/parser/MarkdownRuleExprParser.js
  var SAFE_REGEX_CACHE = /* @__PURE__ */ new Map();
  var RULE_EXPR_CACHE = /* @__PURE__ */ new Map();
  var MAX_CACHE_ENTRIES = 512;
  var REDOS_NESTED_QUANTIFIER_RE = /\([^)]*[+*][^)]*\)[+*?]/;
  var NEVER_MATCH_RE = /(?!)/;
  function createSafeRegExp(pattern) {
    if (!pattern || pattern.length > 512) {
      return NEVER_MATCH_RE;
    }
    const cached = SAFE_REGEX_CACHE.get(pattern);
    if (cached) {
      return cached;
    }
    if (REDOS_NESTED_QUANTIFIER_RE.test(pattern)) {
      return NEVER_MATCH_RE;
    }
    try {
      const compiled = new RegExp(pattern);
      if (SAFE_REGEX_CACHE.size >= MAX_CACHE_ENTRIES) {
        SAFE_REGEX_CACHE.clear();
      }
      SAFE_REGEX_CACHE.set(pattern, compiled);
      return compiled;
    } catch {
      return NEVER_MATCH_RE;
    }
  }
  var MarkdownRuleExprParser = class {
    static parse(input) {
      const trimmed = input.trim();
      if (!trimmed) {
        return { kind: "truthy", field: "" };
      }
      const cached = RULE_EXPR_CACHE.get(trimmed);
      if (cached) {
        return cached;
      }
      const tokens = this.tokenize(trimmed);
      if (tokens.length === 0) {
        return { kind: "truthy", field: "" };
      }
      const parser = new ExprParser2(tokens);
      const parsed = parser.parseOr();
      if (RULE_EXPR_CACHE.size >= MAX_CACHE_ENTRIES) {
        RULE_EXPR_CACHE.clear();
      }
      RULE_EXPR_CACHE.set(trimmed, parsed);
      return parsed;
    }
    static tokenize(input) {
      const tokens = [];
      let i = 0;
      const len = input.length;
      while (i < len) {
        const ch = input[i];
        if (/\s/.test(ch)) {
          i++;
          continue;
        }
        if (input.slice(i, i + 3) === "!=@") {
          tokens.push({ type: "OP", value: "!=@" });
          i += 3;
          continue;
        }
        if (input.slice(i, i + 3) === "~!=") {
          tokens.push({ type: "OP", value: "~!=" });
          i += 3;
          while (i < len && /\s/.test(input[i]))
            i++;
          let pat = "";
          if (i < len && (input[i] === '"' || input[i] === "'")) {
            const q = input[i++];
            while (i < len && input[i] !== q)
              pat += input[i++];
            i++;
          } else if (i < len && input[i] === "/") {
            i++;
            while (i < len && input[i] !== "/")
              pat += input[i++];
            i++;
          } else {
            let inBracket = false;
            while (i < len) {
              if (input[i] === "[")
                inBracket = true;
              else if (input[i] === "]")
                inBracket = false;
              else if (/\s/.test(input[i]) && !inBracket)
                break;
              pat += input[i++];
            }
          }
          tokens.push({ type: "STRING", value: pat });
          continue;
        }
        const two = input.slice(i, i + 2);
        if (two === "&&" || two === "||" || two === "==" || two === "!=" || two === "<=" || two === ">=" || two === "=@" || two === "~=") {
          tokens.push({ type: "OP", value: two });
          i += 2;
          continue;
        }
        if (ch === ",") {
          tokens.push({ type: "COMMA", value: "," });
          i++;
          continue;
        }
        if (ch === "(" || ch === ")" || ch === "!" || ch === "<" || ch === ">" || ch === "=" || ch === "#" || ch === "%") {
          tokens.push({ type: "OP", value: ch });
          i++;
          continue;
        }
        if (ch === "[") {
          const end = input.indexOf("]", i);
          if (end !== -1) {
            const content = input.slice(i + 1, end);
            tokens.push({ type: "LIST", value: content });
            i = end + 1;
            continue;
          }
        }
        if (ch === "/" && input.indexOf("/", i + 1) !== -1) {
          const end = input.indexOf("/", i + 1);
          tokens.push({ type: "REGEX", value: input.slice(i + 1, end) });
          i = end + 1;
          continue;
        }
        if (ch === '"' || ch === "'") {
          const quote = ch;
          i++;
          let str = "";
          while (i < len && input[i] !== quote) {
            if (input[i] === "\\" && i + 1 < len) {
              if (input[i + 1] === quote || input[i + 1] === "\\") {
                i++;
                str += input[i];
              } else {
                str += input[i++];
                str += input[i];
              }
            } else {
              str += input[i];
            }
            i++;
          }
          i++;
          tokens.push({ type: "STRING", value: str });
          continue;
        }
        let word = "";
        while (i < len && !/\s|[()!<>=\[\],~%#]/.test(input[i])) {
          word += input[i];
          i++;
        }
        const lower = word.toLowerCase();
        if (lower === "and") {
          tokens.push({ type: "OP", value: "and" });
        } else if (lower === "or") {
          tokens.push({ type: "OP", value: "or" });
        } else if (lower === "not") {
          let peekIdx = i;
          while (peekIdx < len && /\s/.test(input[peekIdx]))
            peekIdx++;
          if (input.slice(peekIdx, peekIdx + 2).toLowerCase() === "in" && (peekIdx + 2 >= len || /\s|[()!<>=\[\],~]/.test(input[peekIdx + 2]))) {
            i = peekIdx + 2;
            tokens.push({ type: "OP", value: "not in" });
          } else {
            tokens.push({ type: "OP", value: "!" });
          }
        } else if (lower === "in") {
          tokens.push({ type: "OP", value: "in" });
        } else if (word.length > 0) {
          tokens.push({ type: "WORD", value: word });
        } else {
          i++;
        }
      }
      return tokens;
    }
  };
  var ExprParser2 = class {
    tokens;
    pos = 0;
    constructor(tokens) {
      this.tokens = tokens;
    }
    parseOr() {
      let left = this.parseAnd();
      while (this.matchOp("or") || this.matchOp("||")) {
        const right = this.parseAnd();
        left = { kind: "or", left, right };
      }
      return left;
    }
    parseAnd() {
      let left = this.parseUnary();
      while (this.matchOp("and") || this.matchOp("&&")) {
        const right = this.parseUnary();
        left = { kind: "and", left, right };
      }
      return left;
    }
    parseUnary() {
      if (this.matchOp("!") || this.matchOp("not")) {
        const expr = this.parseUnary();
        return { kind: "not", expr };
      }
      return this.parsePrimary();
    }
    parsePrimary() {
      const token = this.peek();
      if (!token) {
        return { kind: "truthy", field: "" };
      }
      if (token.type === "STRING") {
        throw new Error(`Invalid rule syntax: left-hand operand must be a bare field identifier, got '${token.value}'`);
      }
      if (token.type === "WORD" && (token.value.toLowerCase() === "true" || token.value.toLowerCase() === "false")) {
        this.consume();
        return { kind: "booleanLiteral", value: token.value.toLowerCase() === "true" };
      }
      if (token.type === "OP" && token.value === "(") {
        this.consume();
        const expr = this.parseOr();
        if (this.matchOp(")")) {
        }
        return expr;
      }
      if (token.type === "WORD" && token.value === "empty") {
        this.consume();
        if (this.peek()?.type === "OP" && this.peek()?.value === "(") {
          this.consume();
          const fieldToken = this.consume();
          if (this.peek()?.type === "OP" && this.peek()?.value === ")") {
            this.consume();
          }
          return { kind: "empty", field: fieldToken?.value };
        }
        return { kind: "empty" };
      }
      if (token.type === "WORD" && token.value === "matches") {
        this.consume();
        if (this.peek()?.type === "OP" && this.peek()?.value === "(") {
          this.consume();
          const firstArg = this.consume();
          let field;
          let patternStr = firstArg?.value || "";
          if (this.peek()?.type === "COMMA") {
            this.consume();
            const patParts = [];
            while (this.peek() && !(this.peek()?.type === "OP" && this.peek()?.value === ")")) {
              const tok = this.consume();
              if (tok.type === "LIST") {
                patParts.push(`[${tok.value}]`);
              } else {
                patParts.push(tok.value);
              }
            }
            field = firstArg?.value;
            patternStr = patParts.join("");
          } else {
            while (this.peek() && !(this.peek()?.type === "OP" && this.peek()?.value === ")")) {
              const tok = this.consume();
              if (tok.type === "LIST") {
                patternStr += `[${tok.value}]`;
              } else {
                patternStr += tok.value;
              }
            }
          }
          if (this.peek()?.type === "OP" && this.peek()?.value === ")") {
            this.consume();
          }
          return { kind: "matches", field, pattern: createSafeRegExp(patternStr) };
        }
      }
      if (token.type === "WORD" && token.value === "length") {
        this.consume();
        let targetField;
        if (this.peek()?.type === "OP" && this.peek()?.value === "(") {
          this.consume();
          const fToken = this.consume();
          targetField = fToken?.value;
          if (this.peek()?.type === "OP" && this.peek()?.value === ")") {
            this.consume();
          }
        }
        const next = this.peek();
        if (next && next.type === "OP" && ["<", "<=", ">", ">=", "==", "!="].includes(next.value)) {
          const op = this.consume().value;
          const rightToken = this.peek();
          if (rightToken && rightToken.type === "WORD" && rightToken.value === "length") {
            this.consume();
            if (this.peek()?.type === "OP" && this.peek()?.value === "(") {
              this.consume();
              const otherF = this.consume()?.value || "";
              if (this.peek()?.type === "OP" && this.peek()?.value === ")") {
                this.consume();
              }
              return { kind: "lengthCompare", field: targetField, op, target: { field: otherF } };
            }
          }
          const numToken = this.consume();
          const num = Number(numToken?.value ?? 0);
          return { kind: "lengthCompare", field: targetField, op, target: num };
        }
        return { kind: "lengthCompare", field: targetField, op: ">", target: 0 };
      }
      if (token.type === "WORD") {
        const field = this.consume().value;
        const next = this.peek();
        if (next && next.type === "OP") {
          const op = next.value;
          if (op === "~!=") {
            this.consume();
            const target = this.consume();
            return { kind: "regexMismatchEmptySafe", field, pattern: createSafeRegExp(target?.value || "") };
          }
          if (op === "==" || op === "=") {
            this.consume();
            const target = this.consume();
            if (target?.type === "LIST") {
              const values = target.value.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
              return { kind: "inSet", field, values };
            }
            if (target?.type === "STRING") {
              return { kind: "equals", field, value: target.value };
            }
            if (target && !isNaN(Number(target.value))) {
              return { kind: "equals", field, value: target.value };
            }
            return { kind: "compareFields", lhs: field, op: "==", rhs: target ? target.value : "" };
          }
          if (op === "!=") {
            this.consume();
            const target = this.consume();
            if (target?.type === "LIST") {
              const values = target.value.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
              return { kind: "notInSet", field, values };
            }
            if (target?.type === "STRING") {
              return { kind: "notEquals", field, value: target.value };
            }
            if (target && !isNaN(Number(target.value))) {
              return { kind: "notEquals", field, value: target.value };
            }
            return { kind: "compareFields", lhs: field, op: "!=", rhs: target ? target.value : "" };
          }
          if (op === "<") {
            this.consume();
            const target = this.consume();
            if (target && !isNaN(Number(target.value))) {
              return { kind: "numericLT", field, value: Number(target.value) };
            }
            return { kind: "compareFields", lhs: field, op: "<", rhs: target ? target.value : "" };
          }
          if (op === "<=") {
            this.consume();
            const target = this.consume();
            if (target && !isNaN(Number(target.value))) {
              return { kind: "numericLTE", field, value: Number(target.value) };
            }
            return { kind: "compareFields", lhs: field, op: "<=", rhs: target ? target.value : "" };
          }
          if (op === ">") {
            this.consume();
            const target = this.consume();
            if (target && !isNaN(Number(target.value))) {
              return { kind: "numericGT", field, value: Number(target.value) };
            }
            return { kind: "compareFields", lhs: field, op: ">", rhs: target ? target.value : "" };
          }
          if (op === ">=") {
            this.consume();
            const target = this.consume();
            if (target && !isNaN(Number(target.value))) {
              return { kind: "numericGTE", field, value: Number(target.value) };
            }
            return { kind: "compareFields", lhs: field, op: ">=", rhs: target ? target.value : "" };
          }
          if (op === "in") {
            this.consume();
            const target = this.consume();
            let values = [];
            if (target && target.type === "LIST") {
              values = target.value.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
            } else if (target) {
              values = [target.value];
            }
            return { kind: "inSet", field, values };
          }
          if (op === "not in") {
            this.consume();
            const target = this.consume();
            let values = [];
            if (target && target.type === "LIST") {
              values = target.value.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
            } else if (target) {
              values = [target.value];
            }
            return { kind: "notInSet", field, values };
          }
          if (op === "=@") {
            this.consume();
            const target = this.consume();
            return { kind: "equalsField", lhs: field, rhs: target ? target.value : "" };
          }
          if (op === "!=@") {
            this.consume();
            const target = this.consume();
            return { kind: "notEqualsField", lhs: field, rhs: target ? target.value : "" };
          }
          if (op === "~=") {
            this.consume();
            const target = this.consume();
            return { kind: "regexMatch", field, pattern: createSafeRegExp(target ? target.value : "") };
          }
          if (op === "#") {
            this.consume();
            let cmpOp = "=";
            const nextOp = this.peek();
            if (nextOp && nextOp.type === "OP") {
              cmpOp = this.consume().value;
            }
            const numToken = this.consume();
            const count = Number(numToken?.value ?? 0);
            return { kind: "countCompare", field, op: cmpOp, count };
          }
          if (op === "%") {
            this.consume();
            const modToken = this.consume();
            const mod = Number(modToken?.value ?? 1);
            let cmpOp = "==";
            const nextOp = this.peek();
            if (nextOp && nextOp.type === "OP") {
              cmpOp = this.consume().value;
            }
            const valToken = this.consume();
            const value = Number(valToken?.value ?? 0);
            return { kind: "moduloCompare", field, mod, op: cmpOp, value };
          }
        }
        if (next && next.type === "WORD" && next.value.toLowerCase() === "not") {
          const afterNot = this.tokens[this.pos + 1];
          if (afterNot && afterNot.type === "WORD" && afterNot.value.toLowerCase() === "in") {
            this.consume();
            this.consume();
            const target = this.consume();
            let values = [];
            if (target && target.type === "LIST") {
              values = target.value.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
            } else if (target) {
              values = [target.value];
            }
            return { kind: "notInSet", field, values };
          }
        }
        if (next && next.type === "REGEX") {
          this.consume();
          return { kind: "regexMatch", field, pattern: createSafeRegExp(next.value) };
        }
        return { kind: "truthy", field };
      }
      this.consume();
      return { kind: "truthy", field: token.value };
    }
    peek() {
      return this.tokens[this.pos];
    }
    consume() {
      return this.tokens[this.pos++];
    }
    matchOp(op) {
      const token = this.peek();
      if (token && token.type === "OP" && token.value.toLowerCase() === op.toLowerCase()) {
        this.consume();
        return true;
      }
      return false;
    }
  };

  // packages/core/dist/validation/MarkdownValidationEngine.js
  var EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  var PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;
  var MarkdownValidationEngine = class {
    /**
     * Evaluates a single raw standalone rule string (from `/// field: expr -> "msg"`)
     * against `state` for `fieldKey`. Returns the error message if failing, or null.
     */
    static evaluateStandaloneRule(rawRule, state, fieldKey, label) {
      const trimmed = rawRule.trim();
      if (!trimmed)
        return null;
      const value = resolveVariablePath(state, fieldKey) ?? state[fieldKey];
      const isEmpty = value === void 0 || value === null || value === "" || Array.isArray(value) && value.length === 0;
      if (/^required\b/i.test(trimmed)) {
        if (isEmpty) {
          const arrowIdx2 = trimmed.indexOf("->");
          const colonIdx = trimmed.indexOf(":");
          if (arrowIdx2 !== -1) {
            return trimmed.slice(arrowIdx2 + 2).trim().replace(/^['"]|['"]$/g, "") || `${label || fieldKey} is required.`;
          }
          if (colonIdx !== -1) {
            return trimmed.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, "") || `${label || fieldKey} is required.`;
          }
          return `${label || fieldKey} is required.`;
        }
        return null;
      }
      const arrowIdx = trimmed.indexOf("->");
      const exprStr = arrowIdx !== -1 ? trimmed.slice(0, arrowIdx).trim() : trimmed;
      const message = arrowIdx !== -1 ? trimmed.slice(arrowIdx + 2).trim().replace(/^['"]|['"]$/g, "") : "Validation failed.";
      try {
        const expr = MarkdownRuleExprParser.parse(exprStr);
        const fails = evaluateRuleExpr(expr, state, fieldKey);
        if (fails) {
          return message;
        }
      } catch {
      }
      return null;
    }
    /**
     * Validates a single input against its `required` constraint, cascading `rules`,
     * standalone `///` document rules, and automatic `email`/`phone` type format validation.
     * Evaluates rules in sequential declaration order: first failing rule wins.
     * Returns the error message of the first failing constraint, or null if valid.
     */
    static validateInput(input, state, documentRules) {
      const key = input.group || input.id;
      const value = resolveVariablePath(state, key) ?? state[key];
      const isEmpty = value === void 0 || value === null || value === "" || Array.isArray(value) && value.length === 0 || typeof value === "boolean" && (input.typeOf === "checkbox" || input.typeOf === "toggle") && !value;
      if (input.required) {
        if (isEmpty) {
          if (typeof input.required === "string") {
            return input.required;
          }
          return `${input.label || input.id} is required.`;
        }
      }
      if (input.rules && input.rules.length > 0) {
        for (const rule of input.rules) {
          try {
            const expr = MarkdownRuleExprParser.parse(rule.expr);
            const fails = evaluateRuleExpr(expr, state, key);
            if (fails) {
              return rule.message;
            }
          } catch {
          }
        }
      }
      const allDocRules = documentRules ?? state.__rules__;
      if (allDocRules) {
        const rulesForField = [
          ...allDocRules[input.id] || [],
          ...input.group && input.group !== input.id ? allDocRules[input.group] || [] : []
        ];
        for (const rawRule of rulesForField) {
          const err = this.evaluateStandaloneRule(rawRule, state, key, input.label);
          if (err)
            return err;
        }
      }
      if (!isEmpty && typeof value === "string" && value.trim() !== "") {
        const strVal = value.trim();
        const isEmail = input.typeOf === "email" || input.attributes?.type === "email";
        const isPhone = input.typeOf === "phone" || input.typeOf === "tel" || input.attributes?.type === "phone" || input.attributes?.type === "tel";
        if (isEmail && !EMAIL_REGEX.test(strVal)) {
          return "Please enter a valid email address";
        }
        if (isPhone && !PHONE_REGEX.test(strVal)) {
          return "Please enter a valid phone number";
        }
      }
      return null;
    }
    /**
     * Collects all MarkdownInput definitions recursively from a ParsedBlock tree.
     */
    static collectInputs(blocks) {
      const inputs = [];
      const walk = (b) => {
        if (b.kind === "input" && b.input) {
          inputs.push(b.input);
        }
        if (b.children)
          b.children.forEach(walk);
        if (b.elseChildren)
          b.elseChildren.forEach(walk);
        if (b.defaultChildren)
          b.defaultChildren.forEach(walk);
        if (b.switchCases) {
          for (const sc of b.switchCases) {
            if (sc.children)
              sc.children.forEach(walk);
          }
        }
      };
      blocks.forEach(walk);
      return inputs;
    }
    /**
     * Collects only active/visible MarkdownInput definitions from a ParsedBlock tree
     * according to RFC §7.2 (skipping inactive `:::` if/unless and `|||` branches).
     */
    static collectActiveInputs(blocks, state) {
      const inputs = [];
      const evalCondition = (rawCond) => {
        try {
          const condStr = TemplateInterpolator.interpolate(rawCond, state);
          const expr = MarkdownRuleExprParser.parse(condStr);
          return evaluateRuleExpr(expr, state);
        } catch {
          return true;
        }
      };
      const walk = (b) => {
        if (b.kind === "input" && b.input) {
          inputs.push(b.input);
          return;
        }
        if (b.kind === "group") {
          const groupCond = b.group?.condition || b.condition || b.attributes?.condition || b.group?.attributes?.if || b.attributes?.if;
          const unlessCond = b.group?.attributes?.unless || b.attributes?.unless;
          if (groupCond && !evalCondition(String(groupCond))) {
            return;
          }
          if (unlessCond && !String(groupCond || "").startsWith("!(") && evalCondition(String(unlessCond))) {
            return;
          }
          if (b.children)
            b.children.forEach(walk);
          return;
        }
        if (b.kind === "conditional") {
          const isSwitch = b.isSwitch || Boolean(b.switchCases && b.switchCases.length > 0);
          if (isSwitch) {
            const switchVar = b.switchVariable || b.attributes?.switchVariable || b.attributes?.condition || b.condition || "";
            const rawVal = resolveVariablePath(state, switchVar) ?? state[switchVar];
            const curVal = rawVal !== void 0 && rawVal !== null ? String(rawVal).trim().toLowerCase() : b.switchCases?.[0]?.value?.trim().toLowerCase() ?? "";
            const matchedCase = b.switchCases?.find((c) => c.value.trim().toLowerCase() === curVal);
            if (matchedCase) {
              if (matchedCase.children)
                matchedCase.children.forEach(walk);
            } else if (b.defaultChildren) {
              b.defaultChildren.forEach(walk);
            }
            return;
          }
          const rawCondStr = b.attributes?.condition || b.condition || "";
          const isVisible = rawCondStr ? evalCondition(String(rawCondStr)) : true;
          if (isVisible) {
            if (b.children)
              b.children.forEach(walk);
          } else if (b.elseChildren) {
            b.elseChildren.forEach(walk);
          }
          return;
        }
        if (b.children)
          b.children.forEach(walk);
        if (b.elseChildren)
          b.elseChildren.forEach(walk);
        if (b.defaultChildren)
          b.defaultChildren.forEach(walk);
      };
      blocks.forEach(walk);
      return inputs;
    }
    /**
     * Validates all active inputs (from ParsedBlock[] or MarkdownInput[]) and standalone `///` document rules.
     */
    static validateAll(blocksOrInputs, values, documentRules, scopedFields) {
      const isBlockList = blocksOrInputs.length > 0 && "kind" in blocksOrInputs[0];
      const inputs = isBlockList ? this.collectActiveInputs(blocksOrInputs, values) : blocksOrInputs;
      let inactiveFieldSet;
      if (isBlockList) {
        const allInputs = this.collectInputs(blocksOrInputs);
        const activeIds = new Set(inputs.flatMap((inp) => [inp.id, ...inp.group ? [inp.group] : []]));
        inactiveFieldSet = new Set(allInputs.flatMap((inp) => [inp.id, ...inp.group ? [inp.group] : []]).filter((id) => !activeIds.has(id)));
      }
      return this.validateForm(inputs, values, scopedFields, documentRules, inactiveFieldSet);
    }
    /**
     * Validates a collection of inputs and standalone `///` document rules against current document state.
     * If `scopedFields` is provided, only inputs/fields matching the specified IDs or groups are validated.
     */
    static validateForm(inputs, state, scopedFields, documentRules, inactiveFieldSet) {
      const errors = {};
      const hasScope = scopedFields && scopedFields.length > 0;
      const normalizedScope = hasScope ? scopedFields.map((s) => s.trim()) : void 0;
      const allDocRules = documentRules ?? state.__rules__;
      for (const input of inputs) {
        if (normalizedScope) {
          const matchesId = normalizedScope.includes(input.id);
          const matchesGroup = input.group ? normalizedScope.includes(input.group) : false;
          if (!matchesId && !matchesGroup) {
            continue;
          }
        }
        const errorMsg = this.validateInput(input, state, allDocRules);
        if (errorMsg) {
          errors[input.id] = errorMsg;
          if (input.group && !errors[input.group]) {
            errors[input.group] = errorMsg;
          }
        }
      }
      if (allDocRules) {
        for (const [field, ruleList] of Object.entries(allDocRules)) {
          if (normalizedScope && !normalizedScope.includes(field)) {
            continue;
          }
          if (inactiveFieldSet && inactiveFieldSet.has(field)) {
            continue;
          }
          if (errors[field])
            continue;
          for (const rawRule of ruleList) {
            const err = this.evaluateStandaloneRule(rawRule, state, field);
            if (err) {
              errors[field] = err;
              break;
            }
          }
        }
      }
      return {
        valid: Object.keys(errors).length === 0,
        errors
      };
    }
  };

  // packages/web/src/index.ts
  var index_exports = {};
  __export(index_exports, {
    AdaptiveDataView: () => AdaptiveDataView,
    AdaptiveFlexLayout: () => AdaptiveFlexLayout,
    AdaptiveFlowLayout: () => AdaptiveFlowLayout,
    AdaptiveGridLayout: () => AdaptiveGridLayout,
    AdaptiveVerticalLayout: () => AdaptiveVerticalLayout,
    MarkdownAccordionView: () => MarkdownAccordionView,
    MarkdownActionView: () => MarkdownActionView,
    MarkdownBlockView: () => MarkdownBlockView,
    MarkdownCarouselView: () => MarkdownCarouselView,
    MarkdownConditionalView: () => MarkdownConditionalView,
    MarkdownCustomStyleRegistry: () => MarkdownCustomStyleRegistry,
    MarkdownInputView: () => MarkdownInputView,
    MarkdownMediaView: () => MarkdownMediaView,
    MarkdownMetricView: () => MarkdownMetricView,
    MarkdownSkeletonView: () => MarkdownSkeletonView,
    MarkdownTableView: () => MarkdownTableView,
    MarkdownView: () => MarkdownView,
    applyTheme: () => applyTheme,
    computeColumnWeights: () => computeColumnWeights,
    createBrandTheme: () => createBrandTheme,
    darkTheme: () => darkTheme,
    defaultTheme: () => defaultTheme,
    fintechTheme: () => fintechTheme,
    globalCustomStyleRegistry: () => globalCustomStyleRegistry,
    isTableFeasibleHorizontally: () => isTableFeasibleHorizontally,
    measureDynamicTypeMetrics: () => measureDynamicTypeMetrics,
    themeToCssVariables: () => themeToCssVariables
  });

  // packages/web/src/components/MarkdownMetricView.ts
  var MarkdownMetricView = class {
    static render(block, state = {}, renderSpans, customClass) {
      const card = document.createElement("div");
      card.className = `mdui-metric-card ${customClass || ""}`.trim();
      const metric = block.metric;
      if (!metric) return card;
      const header = document.createElement("div");
      header.className = "mdui-metric-header";
      const numeral = document.createElement("span");
      numeral.className = "mdui-metric-numeral";
      if (renderSpans && block.spans && block.spans.length > 0) {
        numeral.appendChild(renderSpans(block.spans));
      } else {
        numeral.textContent = TemplateInterpolator.interpolate(metric.numeral, state);
      }
      const deltaText = TemplateInterpolator.interpolate(metric.delta, state);
      const pill = document.createElement("span");
      pill.className = `mdui-metric-pill mdui-metric-pill-${metric.badgeStyle}`;
      pill.textContent = metric.arrow ? `${metric.arrow} ${deltaText}`.trim() : deltaText;
      header.appendChild(numeral);
      header.appendChild(pill);
      card.appendChild(header);
      if (metric.period) {
        const period = document.createElement("div");
        period.className = "mdui-metric-period";
        period.textContent = TemplateInterpolator.interpolate(metric.period, state);
        card.appendChild(period);
      }
      return card;
    }
  };

  // packages/web/src/components/MarkdownInlineView.ts
  var MarkdownInlineView = class {
    static renderSpans(spans, state = {}) {
      const frag = document.createDocumentFragment();
      if (!spans || spans.length === 0) return frag;
      for (const span of spans) {
        switch (span.type) {
          case "text":
            frag.appendChild(document.createTextNode(span.content));
            break;
          case "bold": {
            const strong = document.createElement("strong");
            if (span.children && span.children.length > 0) {
              strong.appendChild(this.renderSpans(span.children, state));
            } else if (span.content) {
              strong.textContent = span.content;
            }
            frag.appendChild(strong);
            break;
          }
          case "italic": {
            const em = document.createElement("em");
            if (span.children && span.children.length > 0) {
              em.appendChild(this.renderSpans(span.children, state));
            } else if (span.content) {
              em.textContent = span.content;
            }
            frag.appendChild(em);
            break;
          }
          case "boldItalic": {
            const strong = document.createElement("strong");
            const em = document.createElement("em");
            if (span.children && span.children.length > 0) {
              em.appendChild(this.renderSpans(span.children, state));
            } else if (span.content) {
              em.textContent = span.content;
            }
            strong.appendChild(em);
            frag.appendChild(strong);
            break;
          }
          case "strike": {
            const del = document.createElement("del");
            if (span.children && span.children.length > 0) {
              del.appendChild(this.renderSpans(span.children, state));
            } else if (span.content) {
              del.textContent = span.content;
            }
            frag.appendChild(del);
            break;
          }
          case "underline": {
            const u = document.createElement("u");
            if (span.children && span.children.length > 0) {
              u.appendChild(this.renderSpans(span.children, state));
            } else if (span.content) {
              u.textContent = span.content;
            }
            frag.appendChild(u);
            break;
          }
          case "code": {
            const code = document.createElement("code");
            code.className = "mdui-inline-code";
            const text = span.content || "";
            if (text.includes("{{") && text.includes("}}")) {
              code.textContent = text.replace(/\{\{([^}]+)\}\}/g, (fullMatch, expr) => {
                const res = TemplateInterpolator.evaluateExpression(expr.trim(), state);
                return res !== "" && res !== void 0 && res !== null ? res : fullMatch;
              });
            } else {
              code.textContent = text;
            }
            frag.appendChild(code);
            break;
          }
          case "interpolation": {
            const interpolatedText = TemplateInterpolator.evaluateExpression(span.content, state);
            if (span.fontStyle || span.colorName || span.bgColor) {
              const spanEl = document.createElement("span");
              spanEl.className = "mdui-custom-style";
              this.applySpanStyle(spanEl, span);
              spanEl.textContent = interpolatedText;
              frag.appendChild(spanEl);
            } else {
              frag.appendChild(document.createTextNode(interpolatedText));
            }
            break;
          }
          case "customStyle": {
            const spanEl = document.createElement("span");
            spanEl.className = "mdui-custom-style";
            this.applySpanStyle(spanEl, span);
            if (span.children && span.children.length > 0) {
              spanEl.appendChild(this.renderSpans(span.children, state));
            } else if (span.content) {
              spanEl.textContent = span.content;
            }
            frag.appendChild(spanEl);
            break;
          }
          default:
            if (span.content) {
              frag.appendChild(document.createTextNode(span.content));
            }
            break;
        }
      }
      return frag;
    }
    static renderMarkdownText(text, state = {}) {
      if (!text) return document.createDocumentFragment();
      const spans = MarkdownInlineHandler.parse(text);
      return this.renderSpans(spans, state);
    }
    static applySpanStyle(spanEl, span) {
      if (span.fontStyle) {
        const tokens = span.fontStyle.split(/\s+/).filter(Boolean);
        for (const token of tokens) {
          const lower = token.toLowerCase();
          spanEl.classList.add(`mdui-font-${lower}`);
          if (lower === "title") {
            spanEl.style.fontSize = "1.5rem";
            spanEl.style.fontWeight = "700";
          } else if (lower === "headline") {
            spanEl.style.fontSize = "1.125rem";
            spanEl.style.fontWeight = "600";
          } else if (lower === "subheadline") {
            spanEl.style.fontSize = "0.875rem";
          } else if (lower === "footnote") {
            spanEl.style.fontSize = "0.8rem";
          } else if (lower === "caption") {
            spanEl.style.fontSize = "0.75rem";
          } else if (lower === "bold") {
            spanEl.style.fontWeight = "700";
          } else if (lower === "semibold") {
            spanEl.style.fontWeight = "600";
          } else if (lower === "italic") {
            spanEl.style.fontStyle = "italic";
          }
        }
      }
      if (span.colorName && !span.colorName.startsWith("#")) {
        const token = span.colorName.toLowerCase();
        spanEl.style.color = `var(--mdui-color-${token}, ${span.colorName})`;
      }
      if (span.bgColor && !span.bgColor.startsWith("#")) {
        const token = span.bgColor.toLowerCase();
        spanEl.style.backgroundColor = `var(--mdui-color-${token}-bg, var(--mdui-color-${token}, ${span.bgColor}))`;
      }
    }
  };

  // packages/web/src/components/MarkdownActionView.ts
  var MarkdownActionView = class {
    static renderButton(action, handlers, equalGrow = false, customClass) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = action.id;
      const rawStyle = action.style || "secondary";
      const isCustom = rawStyle.includes(":");
      const isCell = ["cell", "chevron", "tableview", "tableviewcell"].includes(rawStyle) || action.attributes?.chevron !== void 0 || action.attributes?.cell !== void 0;
      let styleClass = `mdui-action-btn-${rawStyle}`;
      if (isCustom) {
        styleClass = `mdui-action-btn-custom mdui-style-${rawStyle.replace(":", "-")}`;
      } else if (isCell) {
        styleClass = "mdui-action-btn-cell";
      }
      const isStepper = ["\u2212", "+", "-"].includes(action.label.trim());
      if (isStepper) {
        styleClass += " mdui-action-btn-stepper";
      }
      btn.className = `mdui-action-btn ${styleClass} ${customClass || ""}`.trim();
      if (equalGrow) {
        btn.style.flex = "1 1 0";
      }
      if (rawStyle === "processing") {
        const spinnerSpan = document.createElement("span");
        spinnerSpan.className = "mdui-action-spinner";
        btn.appendChild(spinnerSpan);
      }
      if (action.icon) {
        const iconSpan = document.createElement("span");
        iconSpan.className = "mdui-action-icon";
        iconSpan.textContent = action.icon;
        btn.appendChild(iconSpan);
      }
      const state = handlers.state || {};
      let titleText = action.label;
      let subtitleText = action.attributes?.subtitle || action.attributes?.detail;
      if (isCell && !subtitleText && (titleText.includes(" \u2014 ") || titleText.includes(" -- "))) {
        const parts = titleText.split(/ — | -- /);
        titleText = parts[0].trim();
        subtitleText = parts.slice(1).join(" \u2014 ").trim();
      }
      const labelSpan = document.createElement("span");
      labelSpan.className = "mdui-action-label";
      if (subtitleText) {
        const titleSpan = document.createElement("span");
        titleSpan.className = "mdui-action-title";
        titleSpan.appendChild(MarkdownInlineView.renderMarkdownText(titleText, state));
        labelSpan.appendChild(titleSpan);
        const subSpan = document.createElement("span");
        subSpan.className = "mdui-action-subtitle";
        subSpan.appendChild(MarkdownInlineView.renderMarkdownText(subtitleText, state));
        labelSpan.appendChild(subSpan);
      } else {
        labelSpan.appendChild(MarkdownInlineView.renderMarkdownText(titleText, state));
      }
      btn.appendChild(labelSpan);
      if (isCell) {
        const chevronSpan = document.createElement("span");
        chevronSpan.className = "mdui-action-chevron";
        chevronSpan.innerHTML = "&#x203A;";
        btn.appendChild(chevronSpan);
      }
      let isDisabled = Boolean(action.disabled);
      const disabledAttr = action.attributes?.disabled;
      if (disabledAttr) {
        if (disabledAttr === "true") {
          isDisabled = true;
        } else if (disabledAttr.startsWith("empty(") && disabledAttr.endsWith(")")) {
          const field = disabledAttr.slice(6, -1).trim();
          const v = resolveVariablePath(state, field);
          isDisabled = !v || v === "";
        } else {
          try {
            const expr = MarkdownRuleExprParser.parse(disabledAttr);
            isDisabled = evaluateRuleExpr(expr, state);
          } catch {
          }
        }
      }
      if (isDisabled) {
        btn.disabled = true;
        btn.setAttribute("data-disabled", "true");
      }
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const announcement = action.attributes?.announce;
        if (announcement && typeof document !== "undefined") {
          const text = TemplateInterpolator.interpolate(announcement, handlers.state || {});
          let srEl = document.getElementById("amdui-live-announcer");
          if (!srEl) {
            srEl = document.createElement("div");
            srEl.id = "amdui-live-announcer";
            srEl.setAttribute("style", "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;");
            srEl.setAttribute("aria-live", "polite");
            srEl.setAttribute("aria-atomic", "true");
            document.body.appendChild(srEl);
          }
          setTimeout(() => {
            if (srEl) srEl.textContent = text;
          }, 10);
        }
        if (action.attributes?.confirm) {
          if (!window.confirm(action.attributes.confirm)) {
            return;
          }
        }
        const triggersToRun = action.trigger.triggers && action.trigger.triggers.length > 0 ? action.trigger.triggers : [action.trigger];
        for (const tr of triggersToRun) {
          if (tr.type === "submit") {
            let scopedFields;
            if (action.attributes?.variables) {
              scopedFields = action.attributes.variables.split(",").map((s) => s.trim());
            }
            if (handlers.validateForm) {
              const validationRes = handlers.validateForm(scopedFields);
              if (!validationRes.valid) {
                handlers.onAction(action);
                return;
              }
            }
          }
        }
        handlers.onAction(action);
      });
      return btn;
    }
    static renderRow(block, handlers, renderChild) {
      const row = document.createElement("div");
      row.className = "mdui-action-row";
      if (block.attributes?.isEqualSplit) {
        row.setAttribute("data-equal-split", "true");
      }
      if (block.children) {
        for (const child of block.children) {
          if (child.kind === "actionSpacer") {
            const spacer = document.createElement("div");
            spacer.className = "mdui-action-spacer";
            row.appendChild(spacer);
          } else if (child.kind === "action" && child.action) {
            const btn = this.renderButton(child.action, handlers, Boolean(block.attributes?.isEqualSplit));
            row.appendChild(btn);
          } else {
            row.appendChild(renderChild(child));
          }
        }
      }
      return row;
    }
  };

  // packages/web/src/components/MarkdownInputView.ts
  var MarkdownInputView = class {
    static render(input, handler, customClass) {
      const resolvedId = TemplateInterpolator.interpolate(input.id, handler.state);
      const wrapper = document.createElement("div");
      wrapper.className = `mdui-input-wrapper ${customClass || ""}`.trim();
      wrapper.id = `wrapper_${resolvedId}`;
      let isDisabled = input.disabled || false;
      if (input.disabledExpr) {
        try {
          const expr = MarkdownRuleExprParser.parse(input.disabledExpr);
          isDisabled = evaluateRuleExpr(expr, handler.state);
        } catch {
        }
      }
      let displayLabel = input.label;
      const isSelectionType = input.typeOf === "singleSelection" || input.typeOf === "radio" || input.typeOf === "select" || input.typeOf === "selections" || input.typeOf === "checkbox";
      if (input.notes && (!displayLabel || displayLabel === input.id || isSelectionType)) {
        displayLabel = input.notes.trim();
      }
      displayLabel = TemplateInterpolator.interpolate(displayLabel, handler.state);
      const resolvedGroup = input.group ? TemplateInterpolator.interpolate(input.group, handler.state) : void 0;
      let currentValue = resolveVariablePath(handler.state, resolvedId) ?? handler.state[resolvedId] ?? input.defaultValue ?? "";
      if (input.typeOf === "singleSelection" || input.typeOf === "radio" || input.typeOf === "select") {
        const isCard = input.style === "card";
        wrapper.classList.add("mdui-input-single-selection");
        wrapper.classList.add(isCard ? "mdui-input-card-selection" : "mdui-input-inline-selection");
        const label = document.createElement("label");
        label.className = `mdui-selection-label ${isCard ? "mdui-selection-card" : ""}`.trim();
        label.id = `selection_label_${resolvedId}`;
        let isChecked = false;
        if (resolvedGroup) {
          isChecked = String(handler.state[resolvedGroup] ?? "") === String(resolvedId);
        } else {
          isChecked = Boolean(currentValue);
        }
        if (isChecked) label.classList.add("mdui-selected");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.className = "mdui-selection-radio";
        radio.id = `input_${resolvedId}`;
        radio.name = resolvedGroup ? `radio_group_${resolvedGroup}` : `radio_${resolvedId}`;
        radio.setAttribute("data-input-key", resolvedGroup || resolvedId);
        radio.value = resolvedId;
        radio.checked = isChecked;
        radio.disabled = isDisabled;
        const textSpan = document.createElement("span");
        textSpan.className = "mdui-selection-text";
        textSpan.appendChild(MarkdownInlineView.renderMarkdownText(displayLabel, handler.state));
        radio.addEventListener("change", () => {
          if (radio.checked) {
            if (resolvedGroup) {
              handler.onValueChange(resolvedGroup, resolvedId);
            } else {
              handler.onValueChange(resolvedId, true);
            }
          }
        });
        label.htmlFor = `input_${resolvedId}`;
        label.appendChild(radio);
        label.appendChild(textSpan);
        wrapper.appendChild(label);
        return wrapper;
      }
      if (input.typeOf === "selections" || input.typeOf === "checkbox") {
        const isCard = input.style === "card";
        wrapper.classList.add("mdui-input-selections");
        wrapper.classList.add(isCard ? "mdui-input-card-selection" : "mdui-input-inline-selection");
        const label = document.createElement("label");
        label.className = `mdui-selection-label ${isCard ? "mdui-selection-card" : ""}`.trim();
        label.id = `selection_label_${resolvedId}`;
        let isChecked = false;
        if (resolvedGroup && Array.isArray(handler.state[resolvedGroup])) {
          isChecked = handler.state[resolvedGroup].map(String).includes(String(resolvedId));
        } else {
          isChecked = Boolean(currentValue);
        }
        if (isChecked) label.classList.add("mdui-selected");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "mdui-selection-checkbox";
        checkbox.id = `input_${resolvedId}`;
        checkbox.setAttribute("data-input-key", resolvedId);
        checkbox.checked = isChecked;
        checkbox.disabled = isDisabled;
        const textSpan = document.createElement("span");
        textSpan.className = "mdui-selection-text";
        textSpan.appendChild(MarkdownInlineView.renderMarkdownText(displayLabel, handler.state));
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            label.classList.add("mdui-selected");
          } else {
            label.classList.remove("mdui-selected");
          }
          if (resolvedGroup) {
            const currentList = Array.isArray(handler.state[resolvedGroup]) ? [...handler.state[resolvedGroup]] : [];
            const strId = String(resolvedId);
            const nextList = checkbox.checked ? [...currentList.filter((x) => String(x) !== strId), strId] : currentList.filter((x) => String(x) !== strId);
            handler.onValueChange(resolvedGroup, nextList);
          } else {
            handler.onValueChange(resolvedId, checkbox.checked);
          }
        });
        label.htmlFor = `input_${resolvedId}`;
        label.appendChild(checkbox);
        label.appendChild(textSpan);
        wrapper.appendChild(label);
        return wrapper;
      }
      if (input.typeOf === "toggle") {
        const label = document.createElement("label");
        label.className = "mdui-toggle-label";
        label.id = `toggle_label_${resolvedId}`;
        const textSpan = document.createElement("span");
        textSpan.className = "mdui-input-label";
        textSpan.appendChild(MarkdownInlineView.renderMarkdownText(displayLabel, handler.state));
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `input_${resolvedId}`;
        checkbox.setAttribute("data-input-key", resolvedId);
        checkbox.checked = Boolean(currentValue);
        checkbox.disabled = isDisabled;
        checkbox.style.display = "none";
        const switchEl = document.createElement("div");
        switchEl.className = "mdui-toggle-switch";
        checkbox.addEventListener("change", () => {
          handler.onValueChange(resolvedId, checkbox.checked);
        });
        label.htmlFor = `input_${resolvedId}`;
        label.appendChild(textSpan);
        label.appendChild(checkbox);
        label.appendChild(switchEl);
        wrapper.appendChild(label);
        if (input.notes) {
          const notesEl = document.createElement("div");
          notesEl.className = "mdui-input-notes";
          notesEl.appendChild(MarkdownInlineView.renderMarkdownText(input.notes, handler.state));
          wrapper.appendChild(notesEl);
        }
        return wrapper;
      }
      if (input.typeOf === "progress") {
        wrapper.classList.add("mdui-input-progress");
        let valNum = 0;
        const rawVal = input.attributes?.value ?? input.value ?? handler.state[resolvedId] ?? input.defaultValue ?? 0;
        if (typeof rawVal === "number") {
          valNum = rawVal;
        } else if (typeof rawVal === "string") {
          const num = parseFloat(rawVal);
          valNum = isNaN(num) ? 0 : num;
        }
        let totNum = 100;
        const rawTot = input.attributes?.total ?? input.total ?? 100;
        if (typeof rawTot === "number") {
          totNum = rawTot;
        } else if (typeof rawTot === "string") {
          const num = parseFloat(rawTot);
          totNum = isNaN(num) || num <= 0 ? 100 : num;
        }
        const fraction = totNum > 0 ? Math.max(0, Math.min(1, valNum / totNum)) : 0;
        const percent = Math.round(fraction * 100);
        const rawUnit = input.attributes?.unit ?? input.unit ?? "";
        const unit = String(rawUnit).replace(/^["']|["']$/g, "").trim();
        let readout = "";
        if (unit === "%") {
          readout = `${percent}%`;
        } else if (unit) {
          readout = `${valNum} / ${totNum} ${unit}`;
        } else {
          readout = `${percent}%`;
        }
        const headerEl = document.createElement("div");
        headerEl.className = "mdui-progress-header";
        const labelSpan = document.createElement("span");
        labelSpan.className = "mdui-input-label";
        labelSpan.appendChild(MarkdownInlineView.renderMarkdownText(displayLabel, handler.state));
        const readoutSpan = document.createElement("span");
        readoutSpan.className = "mdui-progress-readout";
        readoutSpan.textContent = readout;
        headerEl.appendChild(labelSpan);
        headerEl.appendChild(readoutSpan);
        wrapper.appendChild(headerEl);
        const trackEl = document.createElement("div");
        trackEl.className = "mdui-progress-track";
        const statusStyle = (input.style || "accent").toLowerCase();
        const fillEl = document.createElement("div");
        fillEl.className = `mdui-progress-fill mdui-progress-${statusStyle}`;
        fillEl.style.width = `${fraction * 100}%`;
        trackEl.appendChild(fillEl);
        wrapper.appendChild(trackEl);
        if (input.notes) {
          const notesEl = document.createElement("div");
          notesEl.className = "mdui-input-notes";
          notesEl.appendChild(MarkdownInlineView.renderMarkdownText(input.notes, handler.state));
          wrapper.appendChild(notesEl);
        }
        return wrapper;
      }
      if (input.typeOf === "searchablePicker") {
        wrapper.classList.add("mdui-input-searchable-picker");
        let optionsList = [];
        const rawOpts = input.options || input.attributes?.options;
        if (Array.isArray(rawOpts)) {
          if (rawOpts.length === 1 && typeof rawOpts[0] === "string" && Array.isArray(handler.state[rawOpts[0]])) {
            optionsList = handler.state[rawOpts[0]].map((item) => {
              if (typeof item === "object" && item !== null) {
                return {
                  id: String(item.id ?? item.value ?? ""),
                  label: String(item.label ?? item.title ?? item.name ?? item.id ?? "")
                };
              }
              return { id: String(item), label: String(item) };
            });
          } else {
            optionsList = rawOpts.map((item) => {
              if (typeof item === "object" && item !== null) {
                return {
                  id: String(item.id ?? item.value ?? ""),
                  label: String(item.label ?? item.title ?? item.name ?? item.id ?? "")
                };
              }
              return { id: String(item), label: String(item) };
            });
          }
        } else if (typeof rawOpts === "string" && Array.isArray(handler.state[rawOpts])) {
          optionsList = handler.state[rawOpts].map((item) => {
            if (typeof item === "object" && item !== null) {
              return {
                id: String(item.id ?? item.value ?? ""),
                label: String(item.label ?? item.title ?? item.name ?? item.id ?? "")
              };
            }
            return { id: String(item), label: String(item) };
          });
        }
        if (displayLabel) {
          const labelEl = document.createElement("label");
          labelEl.className = "mdui-input-label";
          labelEl.htmlFor = `input_${resolvedId}`;
          labelEl.appendChild(MarkdownInlineView.renderMarkdownText(displayLabel, handler.state));
          wrapper.appendChild(labelEl);
        }
        const matched = optionsList.find((o) => o.id === String(currentValue));
        const currentLabel = handler.state[`${resolvedId}_label`] || matched?.label || (currentValue ? String(currentValue) : "");
        const triggerBtn = document.createElement("button");
        triggerBtn.type = "button";
        triggerBtn.id = `input_${resolvedId}`;
        triggerBtn.className = "mdui-searchable-picker-trigger mdui-input-control";
        triggerBtn.disabled = isDisabled;
        const triggerText = document.createElement("span");
        triggerText.className = "mdui-searchable-picker-text";
        triggerText.textContent = currentLabel || input.placeholder || "Select option...";
        if (!currentLabel) triggerText.classList.add("mdui-placeholder");
        const triggerIcon = document.createElement("span");
        triggerIcon.className = "mdui-searchable-picker-icon";
        triggerIcon.innerHTML = "&#9662;";
        triggerBtn.appendChild(triggerText);
        triggerBtn.appendChild(triggerIcon);
        wrapper.appendChild(triggerBtn);
        triggerBtn.addEventListener("click", (e) => {
          e.preventDefault();
          if (isDisabled) return;
          const overlay = document.createElement("div");
          overlay.className = "mdui-picker-modal-overlay";
          const modal = document.createElement("div");
          modal.className = "mdui-picker-modal";
          const modalHeader = document.createElement("div");
          modalHeader.className = "mdui-picker-modal-header";
          const titleSpan = document.createElement("span");
          titleSpan.className = "mdui-picker-modal-title";
          titleSpan.textContent = displayLabel || "Select Option";
          const closeBtn = document.createElement("button");
          closeBtn.type = "button";
          closeBtn.className = "mdui-picker-modal-close";
          closeBtn.innerHTML = "&times;";
          closeBtn.onclick = () => overlay.remove();
          modalHeader.appendChild(titleSpan);
          modalHeader.appendChild(closeBtn);
          modal.appendChild(modalHeader);
          const searchInput = document.createElement("input");
          searchInput.type = "search";
          searchInput.className = "mdui-picker-search-input";
          searchInput.placeholder = input.placeholder || "Search options...";
          modal.appendChild(searchInput);
          const listContainer = document.createElement("div");
          listContainer.className = "mdui-picker-options-list";
          const renderOptions = (filterText) => {
            listContainer.innerHTML = "";
            const q = filterText.toLowerCase().trim();
            const filtered = optionsList.filter(
              (o) => !q || o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
            );
            if (filtered.length === 0) {
              const emptyMsg = document.createElement("div");
              emptyMsg.className = "mdui-picker-empty";
              emptyMsg.textContent = "No matching options found";
              listContainer.appendChild(emptyMsg);
              return;
            }
            for (const opt of filtered) {
              const itemBtn = document.createElement("button");
              itemBtn.type = "button";
              itemBtn.className = "mdui-picker-option-item";
              if (String(currentValue) === opt.id) {
                itemBtn.classList.add("mdui-selected");
              }
              const labelSpan = document.createElement("span");
              labelSpan.textContent = opt.label;
              itemBtn.appendChild(labelSpan);
              if (String(currentValue) === opt.id) {
                const checkSpan = document.createElement("span");
                checkSpan.innerHTML = "&#10003;";
                itemBtn.appendChild(checkSpan);
              }
              itemBtn.addEventListener("click", () => {
                handler.onValueChange(resolvedId, opt.id);
                handler.onValueChange(`${resolvedId}_label`, opt.label);
                overlay.remove();
              });
              listContainer.appendChild(itemBtn);
            }
          };
          searchInput.addEventListener("input", () => {
            renderOptions(searchInput.value);
          });
          renderOptions("");
          modal.appendChild(listContainer);
          overlay.appendChild(modal);
          overlay.onclick = (ev) => {
            if (ev.target === overlay) overlay.remove();
          };
          document.body.appendChild(overlay);
          setTimeout(() => searchInput.focus(), 50);
        });
        if (input.notes) {
          const notesEl = document.createElement("div");
          notesEl.className = "mdui-input-notes";
          notesEl.appendChild(MarkdownInlineView.renderMarkdownText(input.notes, handler.state));
          wrapper.appendChild(notesEl);
        }
        return wrapper;
      }
      if (input.typeOf === "segmented" && input.options && input.options.length > 0) {
        if (input.label) {
          const labelEl = document.createElement("div");
          labelEl.className = "mdui-input-label";
          labelEl.appendChild(MarkdownInlineView.renderMarkdownText(input.label, handler.state));
          wrapper.appendChild(labelEl);
        }
        const options = Array.isArray(input.options) ? input.options.filter(Boolean) : [];
        let selectedValue = String(currentValue ?? "");
        if (!selectedValue && options.length > 0) {
          selectedValue = options[0];
        }
        if (input.style === "menu") {
          wrapper.classList.add("mdui-input-segmented-menu");
          const select = document.createElement("select");
          select.id = `input_${resolvedId}`;
          select.className = "mdui-select-control mdui-input-control";
          select.disabled = isDisabled;
          for (const opt of options) {
            const optionEl = document.createElement("option");
            optionEl.value = opt;
            optionEl.textContent = opt;
            if (selectedValue === opt) optionEl.selected = true;
            select.appendChild(optionEl);
          }
          select.addEventListener("change", () => {
            handler.onValueChange(resolvedId, select.value);
          });
          wrapper.appendChild(select);
        } else {
          const isChip = input.style === "chip";
          const segmented = document.createElement("div");
          segmented.className = `mdui-segmented ${isChip ? "mdui-segmented-chips" : ""}`.trim();
          for (const opt of options) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.id = `segmented_${resolvedId}_${opt}`;
            btn.setAttribute("data-input-key", resolvedId);
            btn.className = `mdui-segmented-btn ${isChip ? "mdui-chip-btn" : ""}`.trim();
            btn.appendChild(MarkdownInlineView.renderMarkdownText(opt, handler.state));
            btn.disabled = isDisabled;
            if (selectedValue === opt) {
              btn.setAttribute("data-selected", "true");
            }
            btn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              segmented.querySelectorAll(".mdui-segmented-btn").forEach((b) => b.removeAttribute("data-selected"));
              btn.setAttribute("data-selected", "true");
              handler.onValueChange(resolvedId, opt);
            });
            segmented.appendChild(btn);
          }
          wrapper.appendChild(segmented);
        }
        if (input.notes) {
          const notesEl = document.createElement("div");
          notesEl.className = "mdui-input-notes";
          notesEl.appendChild(MarkdownInlineView.renderMarkdownText(input.notes, handler.state));
          wrapper.appendChild(notesEl);
        }
        return wrapper;
      }
      if (input.typeOf === "slider") {
        const labelEl = document.createElement("div");
        labelEl.className = "mdui-input-label";
        const updateSliderLabel = (val) => {
          labelEl.replaceChildren();
          labelEl.appendChild(MarkdownInlineView.renderMarkdownText(`${input.label}: ${val}`, handler.state));
        };
        updateSliderLabel(currentValue);
        const range = document.createElement("input");
        range.type = "range";
        range.id = `input_${resolvedId}`;
        range.setAttribute("data-input-key", resolvedId);
        range.setAttribute("aria-label", input.label || resolvedId);
        range.setAttribute("aria-valuemin", String(input.min ?? 0));
        range.setAttribute("aria-valuemax", String(input.max ?? 100));
        range.setAttribute("aria-valuenow", String(currentValue));
        range.min = String(input.min ?? 0);
        range.max = String(input.max ?? 100);
        range.step = String(input.step ?? 1);
        range.value = String(currentValue);
        range.disabled = isDisabled;
        range.className = "mdui-input-control";
        range.addEventListener("input", () => {
          range.setAttribute("aria-valuenow", range.value);
          updateSliderLabel(range.value);
          handler.onValueChange(resolvedId, Number(range.value));
        });
        wrapper.appendChild(labelEl);
        wrapper.appendChild(range);
        if (input.notes) {
          const notesEl = document.createElement("div");
          notesEl.className = "mdui-input-notes";
          notesEl.appendChild(MarkdownInlineView.renderMarkdownText(input.notes, handler.state));
          wrapper.appendChild(notesEl);
        }
        return wrapper;
      }
      if (input.typeOf === "textarea") {
        if (input.label && input.label !== input.id) {
          const labelEl = document.createElement("label");
          labelEl.className = "mdui-input-label";
          labelEl.htmlFor = `input_${resolvedId}`;
          labelEl.appendChild(MarkdownInlineView.renderMarkdownText(input.label, handler.state));
          wrapper.appendChild(labelEl);
        }
        const textarea = document.createElement("textarea");
        textarea.id = `input_${resolvedId}`;
        textarea.setAttribute("data-input-key", resolvedId);
        textarea.className = "mdui-input-control";
        textarea.rows = input.lines || 3;
        textarea.placeholder = input.placeholder || "";
        textarea.value = String(currentValue);
        textarea.disabled = isDisabled;
        textarea.addEventListener("input", () => {
          handler.onValueChange(resolvedId, textarea.value);
        });
        wrapper.appendChild(textarea);
        if (input.notes) {
          const notesEl = document.createElement("div");
          notesEl.className = "mdui-input-notes";
          notesEl.appendChild(MarkdownInlineView.renderMarkdownText(input.notes, handler.state));
          wrapper.appendChild(notesEl);
        }
        return wrapper;
      }
      if (input.label && input.label !== input.id) {
        const labelEl = document.createElement("label");
        labelEl.className = "mdui-input-label";
        labelEl.htmlFor = `input_${resolvedId}`;
        labelEl.appendChild(MarkdownInlineView.renderMarkdownText(input.label, handler.state));
        wrapper.appendChild(labelEl);
      }
      const control = document.createElement("input");
      control.id = `input_${resolvedId}`;
      control.setAttribute("data-input-key", resolvedId);
      control.className = "mdui-input-control";
      control.placeholder = input.placeholder || "";
      control.value = String(currentValue);
      control.disabled = isDisabled;
      if (input.typeOf === "password" || input.secure) {
        control.type = "password";
      } else if (input.typeOf === "number" || input.attributes?.type === "number") {
        control.type = "number";
        if (input.min !== void 0) control.min = String(input.min);
        if (input.max !== void 0) control.max = String(input.max);
        if (input.step !== void 0) control.step = String(input.step);
      } else if (input.typeOf === "email" || input.attributes?.type === "email") {
        control.type = "email";
      } else if (input.typeOf === "phone" || input.attributes?.type === "phone" || input.attributes?.type === "tel") {
        control.type = "tel";
      } else if (input.typeOf === "date" || input.typeOf === "datepicker" || input.attributes?.type === "date") {
        control.type = "date";
      } else {
        control.type = "text";
      }
      control.addEventListener("input", () => {
        const val = control.type === "number" ? Number(control.value) : control.value;
        handler.onValueChange(resolvedId, val);
      });
      wrapper.appendChild(control);
      if (input.notes) {
        const notesEl = document.createElement("div");
        notesEl.className = "mdui-input-notes";
        notesEl.appendChild(MarkdownInlineView.renderMarkdownText(input.notes, handler.state));
        wrapper.appendChild(notesEl);
      }
      return wrapper;
    }
  };

  // packages/web/src/components/MarkdownAccordionView.ts
  var MarkdownAccordionView = class {
    static render(block, renderDefaultChildren, renderExpandedChildren, customClass) {
      const accordion = document.createElement("div");
      accordion.className = `mdui-accordion ${customClass || ""}`.trim();
      accordion.id = block.id;
      const isPreOpen = block.attributes?.open === "true" || block.isOpen === true;
      accordion.setAttribute("data-expanded", isPreOpen ? "true" : "false");
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "mdui-accordion-trigger";
      trigger.setAttribute("role", "button");
      trigger.setAttribute("aria-expanded", isPreOpen ? "true" : "false");
      const titleSpan = document.createElement("span");
      titleSpan.className = "mdui-accordion-title";
      const defaultElements = renderDefaultChildren();
      if (defaultElements.length > 0) {
        for (const el of defaultElements) {
          titleSpan.appendChild(el);
        }
      } else {
        titleSpan.textContent = block.attributes?.title || "Details";
      }
      const rawStyle = block.accordionStyle || block.attributes?.accordionStyle || block.attributes?.style || "chevron";
      const style = rawStyle.toLowerCase();
      let toggleControl;
      if (style === "showmore") {
        const showMoreBtn = document.createElement("span");
        showMoreBtn.className = "mdui-accordion-showmore";
        showMoreBtn.textContent = isPreOpen ? "Show less" : "Show more";
        toggleControl = showMoreBtn;
      } else {
        const chevronSpan = document.createElement("span");
        chevronSpan.className = "mdui-accordion-chevron";
        chevronSpan.textContent = "\u25BC";
        toggleControl = chevronSpan;
      }
      trigger.appendChild(titleSpan);
      trigger.appendChild(toggleControl);
      const content = document.createElement("div");
      content.className = "mdui-accordion-content";
      content.setAttribute("role", "region");
      const expandedElements = renderExpandedChildren();
      for (const el of expandedElements) {
        content.appendChild(el);
      }
      trigger.addEventListener("click", () => {
        const isExpanded = accordion.getAttribute("data-expanded") === "true";
        const nextState = !isExpanded;
        accordion.setAttribute("data-expanded", String(nextState));
        trigger.setAttribute("aria-expanded", String(nextState));
        if (style === "showmore") {
          toggleControl.textContent = nextState ? "Show less" : "Show more";
        }
        accordion.dispatchEvent(new CustomEvent("telemetry", {
          bubbles: true,
          composed: true,
          detail: {
            component: "accordion",
            action: nextState ? "expand" : "collapse",
            id: block.id
          }
        }));
      });
      accordion.appendChild(trigger);
      accordion.appendChild(content);
      return accordion;
    }
  };

  // packages/web/src/components/MarkdownConditionalView.ts
  var MarkdownConditionalView = class {
    static activeTimers = /* @__PURE__ */ new Map();
    static clearTimers() {
      for (const timer of this.activeTimers.values()) {
        clearTimeout(timer);
      }
      this.activeTimers.clear();
    }
    static render(block, state, renderChildren, renderElseChildren, renderCaseChildren, onStateChange) {
      const container = document.createElement("div");
      container.className = "mdui-conditional-block";
      const isSwitch = block.isSwitch || Boolean(block.switchCases && block.switchCases.length > 0);
      if (isSwitch) {
        container.classList.add("mdui-switch-block");
        const switchVar = block.switchVariable || block.attributes?.switchVariable || block.attributes?.condition || block.condition || "";
        container.setAttribute("data-switch-variable", switchVar);
        const timerKey = `${block.id}_${switchVar}`;
        if (this.activeTimers.has(timerKey)) {
          clearTimeout(this.activeTimers.get(timerKey));
          this.activeTimers.delete(timerKey);
        }
        const rawVal = resolveVariablePath(state, switchVar) ?? state[switchVar];
        const curVal = rawVal !== void 0 && rawVal !== null ? String(rawVal).trim().toLowerCase() : block.switchCases?.[0]?.value?.trim().toLowerCase() ?? "";
        const matchedCase = block.switchCases?.find((c) => c.value.trim().toLowerCase() === curVal);
        if (matchedCase) {
          container.setAttribute("data-switch-state", matchedCase.value);
          if (matchedCase.announce) {
            const announcedText = TemplateInterpolator.interpolate(matchedCase.announce, state);
            this.dispatchAnnouncement(container, announcedText);
          }
          const caseBlocks = renderCaseChildren ? renderCaseChildren(matchedCase.children) : [];
          for (const child of caseBlocks) {
            container.appendChild(child);
          }
          if (matchedCase.after && onStateChange) {
            const afterMatch = matchedCase.after.match(/^([\d.]+)\s*(s|ms)\s*->\s*([\w.]+)$/i);
            if (afterMatch) {
              const delay = afterMatch[2].toLowerCase() === "s" ? parseFloat(afterMatch[1]) * 1e3 : parseFloat(afterMatch[1]);
              const nextState = afterMatch[3];
              const timerKey2 = `${block.id}_${switchVar}`;
              if (this.activeTimers.has(timerKey2)) {
                clearTimeout(this.activeTimers.get(timerKey2));
              }
              const timer = setTimeout(() => {
                this.activeTimers.delete(timerKey2);
                onStateChange(switchVar, nextState);
              }, delay);
              this.activeTimers.set(timerKey2, timer);
            }
          }
        } else if (block.defaultChildren && block.defaultChildren.length > 0) {
          container.setAttribute("data-switch-state", "default");
          const defBlocks = renderCaseChildren ? renderCaseChildren(block.defaultChildren) : [];
          for (const child of defBlocks) {
            container.appendChild(child);
          }
        } else {
          container.style.display = "none";
        }
        return container;
      }
      const rawCondStr = block.attributes?.condition || block.condition || "";
      let isVisible = true;
      if (rawCondStr) {
        try {
          const condStr = TemplateInterpolator.interpolate(rawCondStr, state);
          const expr = MarkdownRuleExprParser.parse(condStr);
          isVisible = evaluateRuleExpr(expr, state);
        } catch {
          isVisible = true;
        }
      }
      if (isVisible) {
        if (block.announce) {
          const announcedText = TemplateInterpolator.interpolate(block.announce, state);
          this.dispatchAnnouncement(container, announcedText);
        }
        const children = renderChildren();
        for (const child of children) {
          container.appendChild(child);
        }
      } else if (renderElseChildren && block.elseChildren && block.elseChildren.length > 0) {
        const elseChildren = renderElseChildren();
        for (const child of elseChildren) {
          container.appendChild(child);
        }
      } else {
        container.style.display = "none";
      }
      return container;
    }
    static dispatchAnnouncement(container, text) {
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "true");
      container.setAttribute("data-announced", text);
      if (typeof document !== "undefined") {
        let srEl = document.getElementById("amdui-live-announcer");
        if (!srEl) {
          srEl = document.createElement("div");
          srEl.id = "amdui-live-announcer";
          srEl.setAttribute("style", "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;");
          srEl.setAttribute("aria-live", "polite");
          srEl.setAttribute("aria-atomic", "true");
          document.body.appendChild(srEl);
        }
        setTimeout(() => {
          if (srEl) srEl.textContent = text;
        }, 10);
      }
    }
  };

  // packages/web/src/components/MarkdownTableView.ts
  function extractCellRawText(cellBlock) {
    if (cellBlock.rawText) return cellBlock.rawText;
    if (cellBlock.children && cellBlock.children.length > 0) {
      return cellBlock.children.map(extractCellRawText).join(" ");
    }
    return "";
  }
  function stripMarkdownFormatting(text) {
    return text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1").replace(/[`*_~]/g, "").replace(/\{[^}]+\}/g, "").trim();
  }
  function computeColumnWeights(headers, rows) {
    const colCount = Math.max(headers.length, ...rows.map((r) => r.length), 1);
    const columnMetrics = [];
    const MIN_CHAR_FLOOR = 8;
    const PROSE_WRAP_CAP = 40;
    for (let c = 0; c < colCount; c++) {
      const headerLen = stripMarkdownFormatting(headers[c] || "").length;
      const lengths = [];
      for (let r = 0; r < rows.length; r++) {
        const cellText = stripMarkdownFormatting(rows[r]?.[c] || "");
        if (cellText.length > 0) {
          lengths.push(cellText.length);
        }
      }
      let p70 = headerLen;
      if (lengths.length > 0) {
        lengths.sort((a, b) => a - b);
        const p70Index = Math.min(Math.floor(lengths.length * 0.7), lengths.length - 1);
        p70 = lengths[p70Index];
      }
      let effectiveMetric = Math.max(headerLen, p70, MIN_CHAR_FLOOR);
      if (effectiveMetric > PROSE_WRAP_CAP) {
        effectiveMetric = PROSE_WRAP_CAP + Math.sqrt(effectiveMetric - PROSE_WRAP_CAP) * 2;
      }
      columnMetrics.push(effectiveMetric);
    }
    const total = columnMetrics.reduce((acc, m) => acc + m, 0) || 1;
    const weights = columnMetrics.map((m) => m / total);
    return { weights, columnModes: columnMetrics };
  }
  function measureDynamicTypeMetrics(sampleCell) {
    if (typeof window === "undefined") {
      return { charWidthPx: 8, cellPaddingPx: 16, minChars: 10 };
    }
    const style = window.getComputedStyle(sampleCell);
    const paddingLeft = parseFloat(style.paddingLeft) || 8;
    const paddingRight = parseFloat(style.paddingRight) || 8;
    const cellPaddingPx = paddingLeft + paddingRight;
    const cssMinChars = parseFloat(style.getPropertyValue("--mdui-table-min-chars"));
    const hostEl = sampleCell.closest("a-mdui") || sampleCell.closest("[table-min-chars]") || sampleCell.closest("[data-table-min-chars]");
    const attrMinChars = hostEl ? parseFloat(hostEl.getAttribute("table-min-chars") || hostEl.getAttribute("data-table-min-chars") || "") : NaN;
    const minChars = !isNaN(cssMinChars) && cssMinChars > 0 ? cssMinChars : !isNaN(attrMinChars) && attrMinChars > 0 ? attrMinChars : 10;
    let charWidthPx = (parseFloat(style.fontSize) || 13) * 0.6;
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const fontStr = `${style.fontWeight || "400"} ${style.fontSize || "13px"} ${style.fontFamily || "sans-serif"}`;
        ctx.font = fontStr;
        const measured = ctx.measureText("0").width;
        if (measured > 0) {
          charWidthPx = measured;
        }
      }
    } catch {
    }
    return { charWidthPx, cellPaddingPx, minChars };
  }
  function isTableFeasibleHorizontally(availableWidth, weights, charWidthPx, cellPaddingPx, minSingleLineChars = 10) {
    if (availableWidth <= 0 || weights.length === 0) return true;
    for (let j = 0; j < weights.length; j++) {
      const allocatedColWidth = availableWidth * weights[j];
      const usableWidth = allocatedColWidth - cellPaddingPx;
      const visibleChars = usableWidth / charWidthPx;
      if (visibleChars < minSingleLineChars) {
        return false;
      }
    }
    return true;
  }
  var MarkdownTableView = class {
    static render(block, renderSpans, customClass) {
      const wrapper = document.createElement("div");
      wrapper.className = `mdui-table-wrapper ${customClass || ""}`.trim();
      wrapper.setAttribute("data-layout-follow", "true");
      const table = document.createElement("table");
      table.className = "mdui-table";
      const thead = document.createElement("thead");
      thead.className = "mdui-table-thead";
      const tbody = document.createElement("tbody");
      tbody.className = "mdui-table-tbody";
      const headers = [];
      const rowsData = [];
      if (block.children) {
        for (const rowBlock of block.children) {
          if (rowBlock.kind === "tableRow") {
            const isHeader = Boolean(rowBlock.attributes?.isHeader);
            const tr = document.createElement("tr");
            tr.className = isHeader ? "mdui-table-header-row" : "mdui-table-row";
            const currentRowData = [];
            if (rowBlock.children) {
              let colIndex = 0;
              for (const cellBlock of rowBlock.children) {
                const cellTag = isHeader ? "th" : "td";
                const cell = document.createElement(cellTag);
                cell.className = isHeader ? "mdui-table-th" : "mdui-table-td";
                if (cellBlock.attributes?.align) {
                  cell.style.textAlign = cellBlock.attributes.align;
                }
                const frag = document.createDocumentFragment();
                if (cellBlock.children && cellBlock.children.length > 0) {
                  for (const p of cellBlock.children) {
                    frag.appendChild(renderSpans(p));
                  }
                } else if (cellBlock.rawText) {
                  frag.appendChild(renderSpans(cellBlock));
                }
                const cellText = extractCellRawText(cellBlock) || frag.textContent || "";
                if (isHeader) {
                  const headerText = cellText.trim() || `Col ${colIndex + 1}`;
                  headers.push(headerText);
                  cell.appendChild(frag);
                } else {
                  currentRowData.push(cellText.trim());
                  const headerLabel = headers[colIndex] || "";
                  cell.setAttribute("data-header", headerLabel);
                  const cellContent = document.createElement("span");
                  cellContent.className = "mdui-table-cell-content";
                  cellContent.appendChild(frag);
                  cell.appendChild(cellContent);
                }
                tr.appendChild(cell);
                colIndex++;
              }
            }
            if (isHeader) {
              thead.appendChild(tr);
            } else {
              rowsData.push(currentRowData);
              tbody.appendChild(tr);
            }
          }
        }
      }
      const { weights } = computeColumnWeights(headers, rowsData);
      const colgroup = document.createElement("colgroup");
      const colElements = [];
      for (let c = 0; c < weights.length; c++) {
        const col = document.createElement("col");
        col.style.width = `${(weights[c] * 100).toFixed(2)}%`;
        colgroup.appendChild(col);
        colElements.push(col);
      }
      table.appendChild(colgroup);
      if (thead.children.length > 0) {
        table.appendChild(thead);
      }
      table.appendChild(tbody);
      wrapper.appendChild(table);
      let currentLayout = null;
      let lastWidth = -1;
      let cachedCharWidth = 0;
      let cachedPadding = 0;
      let cachedMinChars = 10;
      const updateLayout = () => {
        const availableWidth = wrapper.clientWidth;
        if (availableWidth <= 0) return;
        if (lastWidth > 0 && Math.abs(availableWidth - lastWidth) < 3) return;
        lastWidth = availableWidth;
        if (cachedCharWidth <= 0) {
          const sampleCell = wrapper.querySelector("td") || wrapper.querySelector("th") || wrapper;
          const metrics = measureDynamicTypeMetrics(sampleCell);
          cachedCharWidth = metrics.charWidthPx;
          cachedPadding = metrics.cellPaddingPx;
          cachedMinChars = metrics.minChars;
        }
        const buffer = currentLayout === "horizontal" ? 8 : 0;
        const isFeasible = isTableFeasibleHorizontally(availableWidth + buffer, weights, cachedCharWidth, cachedPadding, cachedMinChars);
        const targetLayout = isFeasible ? "horizontal" : "compact";
        if (targetLayout === currentLayout) return;
        currentLayout = targetLayout;
        if (isFeasible) {
          wrapper.classList.remove("mdui-table-compact");
          wrapper.classList.add("mdui-table-horizontal");
          table.style.tableLayout = "fixed";
          colElements.forEach((col, idx) => {
            col.style.width = `${(weights[idx] * 100).toFixed(2)}%`;
          });
        } else {
          wrapper.classList.remove("mdui-table-horizontal");
          wrapper.classList.add("mdui-table-compact");
          table.style.tableLayout = "";
        }
      };
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (entry) {
            const width = entry.contentRect.width;
            if (width > 0 && (lastWidth <= 0 || Math.abs(width - lastWidth) >= 3)) {
              updateLayout();
            }
          }
        });
        ro.observe(wrapper);
      }
      if (typeof window !== "undefined") {
        window.addEventListener("orientationchange", () => {
          cachedCharWidth = 0;
          lastWidth = -1;
          setTimeout(updateLayout, 80);
        }, { passive: true });
      }
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(() => updateLayout());
      } else {
        setTimeout(updateLayout, 0);
      }
      return wrapper;
    }
  };

  // packages/web/src/components/MarkdownMediaView.ts
  function isSafeMediaUrl(targetUrl) {
    if (!targetUrl) return false;
    const lower = targetUrl.trim().toLowerCase();
    return !lower.startsWith("javascript:") && !lower.startsWith("vbscript:") && !lower.startsWith("data:text/html");
  }
  var MarkdownMediaView = class {
    static render(block, customClass) {
      const mediaType = block.mediaType || "image";
      const rawUrl = block.mediaUrl || "";
      const url = isSafeMediaUrl(rawUrl) ? rawUrl : "";
      const alt = block.altText || "";
      const attrs = block.attributes || {};
      if (mediaType === "video") {
        const video = document.createElement("video");
        video.className = `mdui-video ${customClass || ""}`.trim();
        video.src = url;
        video.controls = attrs.controls !== "false";
        if (attrs.poster && isSafeMediaUrl(attrs.poster)) video.poster = attrs.poster;
        if (attrs.autoplay === "true") video.autoplay = true;
        if (attrs.loop === "true") video.loop = true;
        if (attrs.muted === "true") video.muted = true;
        const ratio = attrs.aspectRatio || attrs.ratio;
        if (ratio) {
          video.style.aspectRatio = ratio.replace(":", "/");
        }
        video.style.maxWidth = "100%";
        video.style.borderRadius = "var(--mdui-radius-card, 12px)";
        return video;
      }
      if (mediaType === "audio") {
        const audioTitle = attrs.title || (alt && alt !== "Audio" ? alt : "");
        const artist = attrs.artist || "";
        const duration = attrs.duration || "";
        if (attrs.poster || artist || audioTitle || duration) {
          const card = document.createElement("div");
          card.className = `mdui-audio-card ${customClass || ""}`.trim();
          const safePoster = attrs.poster && isSafeMediaUrl(attrs.poster) ? attrs.poster : "";
          if (safePoster) {
            const artwork = document.createElement("img");
            artwork.className = "mdui-audio-artwork";
            artwork.src = safePoster;
            artwork.alt = audioTitle || "Audio artwork";
            artwork.loading = "lazy";
            card.appendChild(artwork);
          }
          const info = document.createElement("div");
          info.className = "mdui-audio-content";
          const headerRow = document.createElement("div");
          headerRow.className = "mdui-audio-header";
          if (audioTitle) {
            const titleEl = document.createElement("div");
            titleEl.className = "mdui-audio-title";
            titleEl.textContent = audioTitle;
            headerRow.appendChild(titleEl);
          }
          if (duration) {
            const durBadge = document.createElement("span");
            durBadge.className = "mdui-audio-duration";
            durBadge.textContent = duration;
            headerRow.appendChild(durBadge);
          }
          info.appendChild(headerRow);
          if (artist) {
            const artistEl = document.createElement("div");
            artistEl.className = "mdui-audio-artist";
            artistEl.textContent = artist;
            info.appendChild(artistEl);
          }
          const audio2 = document.createElement("audio");
          audio2.className = "mdui-audio-element";
          audio2.src = url;
          audio2.controls = true;
          if (attrs.autoplay === "true") audio2.autoplay = true;
          if (attrs.loop === "true") audio2.loop = true;
          info.appendChild(audio2);
          card.appendChild(info);
          return card;
        }
        const audio = document.createElement("audio");
        audio.className = `mdui-audio ${customClass || ""}`.trim();
        audio.src = url;
        audio.controls = true;
        audio.style.width = "100%";
        if (attrs.autoplay === "true") audio.autoplay = true;
        if (attrs.loop === "true") audio.loop = true;
        return audio;
      }
      if (mediaType === "embed") {
        const iframe = document.createElement("iframe");
        iframe.className = `mdui-embed ${customClass || ""}`.trim();
        let embedUrl = url;
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch) {
          embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
        }
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
          embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
        iframe.src = embedUrl;
        iframe.style.width = "100%";
        iframe.style.border = "none";
        iframe.style.borderRadius = "var(--mdui-radius-card, 12px)";
        const embedRatio = attrs.aspectRatio || attrs.ratio;
        if (embedRatio) {
          iframe.style.aspectRatio = embedRatio.replace(":", "/");
        } else {
          iframe.style.aspectRatio = "16 / 9";
        }
        iframe.sandbox = "allow-scripts allow-forms allow-popups";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        return iframe;
      }
      const img = document.createElement("img");
      const shape = attrs.style || attrs.shape || "rounded";
      img.className = `mdui-image mdui-image-${shape} ${customClass || ""}`.trim();
      img.src = url;
      img.alt = alt || "Image";
      img.loading = "lazy";
      if (shape === "circle") {
        img.style.borderRadius = "50%";
        img.style.objectFit = attrs.objectFit || attrs.fit || "cover";
        img.style.aspectRatio = "1 / 1";
        img.style.flexShrink = "0";
      } else if (shape === "square") {
        img.style.borderRadius = "0";
        img.style.objectFit = attrs.objectFit || attrs.fit || "cover";
        img.style.aspectRatio = "1 / 1";
        img.style.flexShrink = "0";
      } else if (shape === "original") {
        img.style.borderRadius = "0";
        img.style.objectFit = attrs.objectFit || attrs.fit || "contain";
      } else {
        img.style.borderRadius = "var(--mdui-radius-card, 12px)";
        img.style.objectFit = attrs.objectFit || attrs.fit || "cover";
      }
      if (attrs.size) {
        if (attrs.size.includes("x")) {
          const [w, h] = attrs.size.split("x");
          img.style.width = `${w}px`;
          img.style.height = `${h}px`;
        } else {
          const s = /^\d+$/.test(attrs.size) ? `${attrs.size}px` : attrs.size;
          img.style.width = s;
          img.style.height = s;
        }
        img.style.maxWidth = "100%";
      } else {
        if (attrs.width) {
          const w = attrs.width.endsWith("%") || attrs.width.endsWith("px") || attrs.width.endsWith("rem") ? attrs.width : `${attrs.width}px`;
          img.style.width = w;
          if ((shape === "circle" || shape === "square") && !attrs.height) {
            img.style.height = w;
          }
        }
        if (attrs.height) {
          const h = attrs.height.endsWith("px") || attrs.height.endsWith("rem") ? attrs.height : `${attrs.height}px`;
          img.style.height = h;
        }
        if (!attrs.width && !attrs.height) {
          img.style.maxWidth = "100%";
          img.style.height = "auto";
        }
      }
      if (attrs.size || attrs.width || attrs.height) {
        img.style.flexShrink = "0";
      }
      if (attrs.bleed === "true") {
        img.classList.add("mdui-bleed");
      }
      return img;
    }
  };

  // packages/web/src/components/MarkdownSkeletonView.ts
  var MarkdownSkeletonView = class {
    /**
     * Renders a skeleton container with redacted shimmering child bones
     * or a realistic placeholder skeleton if no children are provided.
     */
    static render(blockOrClass, customClass) {
      let block;
      let cls = "";
      if (typeof blockOrClass === "string") {
        cls = blockOrClass;
      } else if (blockOrClass) {
        block = blockOrClass;
        cls = customClass || "";
      }
      const container = document.createElement("div");
      const classes = ["mdui-card", "mdui-skeleton", "mdui-skeleton-card"];
      if (block?.group?.style === "row" || block?.group?.compoundStyles?.includes("row")) {
        classes.push("mdui-row");
      }
      if (block?.group?.compoundStyles?.includes("positive")) {
        classes.push("mdui-card-positive");
      } else if (block?.group?.compoundStyles?.includes("negative")) {
        classes.push("mdui-card-negative");
      } else if (block?.group?.compoundStyles?.includes("neutral")) {
        classes.push("mdui-card-neutral");
      }
      if (cls) {
        classes.push(cls);
      }
      container.className = classes.join(" ").trim();
      if (block && block.children && block.children.length > 0) {
        for (const child of block.children) {
          container.appendChild(this.redactChild(child));
        }
      } else {
        container.appendChild(this.createHeadingBone(3, 30));
        container.appendChild(this.createParagraphBone(100, 2));
        container.appendChild(this.createButtonBone(130));
      }
      return container;
    }
    static redactChild(block) {
      switch (block.kind) {
        case "heading": {
          const level = Math.min(Math.max(block.level || 1, 1), 6);
          const textLen = this.getTextLength(block);
          return this.createHeadingBone(level, textLen);
        }
        case "action": {
          const textLen = block.action?.label?.length || this.getTextLength(block) || 12;
          return this.createButtonBone(Math.max(100, Math.min(220, textLen * 9 + 40)));
        }
        case "paragraph": {
          if (block.spans && block.spans.some((s) => s.action)) {
            const actionSpan = block.spans.find((s) => s.action);
            const labelLen = actionSpan?.action?.label?.length || 12;
            return this.createButtonBone(Math.max(100, Math.min(220, labelLen * 9 + 40)));
          }
          const textLen = this.getTextLength(block);
          const numLines = textLen < 45 ? 1 : textLen < 110 ? 2 : 3;
          return this.createParagraphBone(textLen, numLines);
        }
        case "list": {
          const listWrapper = document.createElement("div");
          listWrapper.className = "mdui-shimmer-list";
          const items = block.children && block.children.length > 0 ? block.children : [1, 2, 3];
          for (const item of items) {
            const itemEl = document.createElement("div");
            itemEl.className = "mdui-shimmer-list-item";
            const bullet = document.createElement("div");
            bullet.className = "mdui-shimmer-bone mdui-shimmer-bullet";
            const line = document.createElement("div");
            line.className = "mdui-shimmer-bone mdui-shimmer-line";
            const len = typeof item === "object" ? this.getTextLength(item) : 35;
            line.style.width = len > 50 ? "85%" : `${Math.max(35, Math.min(80, len * 1.8))}%`;
            itemEl.appendChild(bullet);
            itemEl.appendChild(line);
            listWrapper.appendChild(itemEl);
          }
          return listWrapper;
        }
        case "metric": {
          const metric = document.createElement("div");
          metric.className = "mdui-shimmer-metric";
          const num = document.createElement("div");
          num.className = "mdui-shimmer-bone mdui-shimmer-metric-numeral";
          const lbl = document.createElement("div");
          lbl.className = "mdui-shimmer-bone mdui-shimmer-metric-label";
          metric.appendChild(num);
          metric.appendChild(lbl);
          return metric;
        }
        case "image": {
          const media = document.createElement("div");
          media.className = "mdui-shimmer-bone mdui-shimmer-media";
          return media;
        }
        case "input": {
          const input = document.createElement("div");
          input.className = "mdui-shimmer-bone mdui-shimmer-input";
          return input;
        }
        case "blockquote": {
          const bq = document.createElement("div");
          bq.className = "mdui-shimmer-blockquote";
          bq.appendChild(this.createParagraphBone(this.getTextLength(block), 2));
          return bq;
        }
        case "codeBlock": {
          const code = document.createElement("div");
          code.className = "mdui-shimmer-bone mdui-shimmer-code";
          return code;
        }
        case "group": {
          const grp = document.createElement("div");
          if (block.group?.style === "row" || block.group?.compoundStyles?.includes("row")) {
            grp.className = "mdui-row";
          } else if (block.group?.compoundStyles?.includes("grid")) {
            grp.className = "mdui-grid";
          } else {
            grp.className = "mdui-column";
          }
          if (block.children && block.children.length > 0) {
            for (const c of block.children) {
              grp.appendChild(this.redactChild(c));
            }
          }
          return grp;
        }
        default: {
          const line = document.createElement("div");
          line.className = "mdui-shimmer-bone mdui-shimmer-line";
          line.style.width = "70%";
          return line;
        }
      }
    }
    static createHeadingBone(level, textLen) {
      const bone = document.createElement("div");
      bone.className = `mdui-shimmer-bone mdui-shimmer-heading mdui-shimmer-h${level}`;
      let width = "55%";
      if (textLen < 15) width = "35%";
      else if (textLen < 25) width = "48%";
      else if (textLen < 45) width = "65%";
      else width = "80%";
      bone.style.width = width;
      return bone;
    }
    static createParagraphBone(textLen, lines) {
      const p = document.createElement("div");
      p.className = "mdui-shimmer-paragraph";
      for (let i = 0; i < lines; i++) {
        const line = document.createElement("div");
        line.className = "mdui-shimmer-bone mdui-shimmer-line";
        if (lines === 1) {
          line.style.width = `${Math.max(45, Math.min(95, textLen * 1.8))}%`;
        } else if (i === lines - 1) {
          line.style.width = "60%";
        } else {
          line.style.width = "100%";
        }
        p.appendChild(line);
      }
      return p;
    }
    static createButtonBone(widthPx) {
      const btn = document.createElement("div");
      btn.className = "mdui-shimmer-bone mdui-shimmer-button";
      btn.style.width = `${widthPx}px`;
      return btn;
    }
    static getTextLength(block) {
      if (block.rawText) return block.rawText.length;
      if (block.spans && block.spans.length > 0) {
        return block.spans.reduce((sum, s) => sum + (s.content ? s.content.length : 0), 0);
      }
      return 30;
    }
  };

  // packages/web/src/components/MarkdownChartView.ts
  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var MarkdownChartView = class _MarkdownChartView {
    static canHandle(style) {
      const s = style.toLowerCase().replace(/-/g, "");
      return [
        "barchart",
        "horizontalbarchart",
        "linechart",
        "piechart",
        "progresschart",
        "chart",
        "areachart",
        "pointchart",
        "scatterchart",
        "donutchart"
      ].includes(s);
    }
    static positionTooltip(tooltip, leftPct, topPct) {
      const clampedLeft = Math.max(5, Math.min(95, leftPct));
      let transformX = "-50%";
      let arrowLeft = "50%";
      if (clampedLeft > 68) {
        transformX = "-85%";
        arrowLeft = "85%";
      } else if (clampedLeft < 32) {
        transformX = "-15%";
        arrowLeft = "15%";
      }
      tooltip.style.left = `${clampedLeft}%`;
      tooltip.style.top = `${topPct}%`;
      tooltip.style.transform = `translate(${transformX}, -100%) translateY(-10px)`;
      tooltip.style.setProperty("--arrow-left", arrowLeft);
      tooltip.classList.add("visible");
    }
    static render(block, options) {
      const group = block.group;
      const style = (group?.style || "chart").toLowerCase();
      const container = document.createElement("div");
      container.className = `mdui-card mdui-chart-card mdui-${style}`;
      const selectionKey = (group?.attributes?.selection || block.attributes?.selection || "").replace(/^@/, "");
      const triggerRaw = group?.attributes?.trigger || block.attributes?.trigger || group?.attributes?.onSelect || block.attributes?.onSelect;
      const currentSelected = selectionKey ? String(options.state[selectionKey] || "") : "";
      const seriesKey = group?.attributes?.series || block.attributes?.series;
      const isSameColor = Boolean(
        group?.attributes && "same-color" in group.attributes || block.attributes && "same-color" in block.attributes || group?.compoundStyles?.includes("same-color") || group?.style?.includes("same-color")
      );
      const tableBlock = (block.children || []).find((c) => c.kind === "table");
      const titleBlock = (block.children || []).find((c) => c.kind === "heading");
      const descBlock = (block.children || []).find((c) => c.kind === "paragraph");
      if (titleBlock) {
        const h = document.createElement(`h${titleBlock.level || 4}`);
        h.className = `mdui-heading mdui-h${titleBlock.level || 4}`;
        h.textContent = titleBlock.rawText || "";
        container.appendChild(h);
      }
      if (descBlock) {
        const p = document.createElement("p");
        p.className = "mdui-chart-desc mdui-paragraph";
        p.textContent = descBlock.rawText || "";
        container.appendChild(p);
      }
      if (tableBlock && tableBlock.children && tableBlock.children.length > 0) {
        const rowBlocks = tableBlock.children.filter((c) => c.kind === "tableRow");
        const headerRow = rowBlocks.find((r) => r.attributes?.isHeader) || rowBlocks[0];
        const dataRows = rowBlocks.filter((r) => r !== headerRow);
        const getCellText = (cell) => {
          if (cell.rawText && cell.rawText.trim()) return cell.rawText.trim();
          if (cell.children && cell.children.length > 0) {
            return (cell.children[0].rawText || "").trim();
          }
          return "";
        };
        const headers = headerRow && headerRow.children ? headerRow.children.map(getCellText) : [];
        const rows = dataRows.map((r) => ({
          cells: (r.children || []).map(getCellText)
        }));
        const uniqueRowLabels = new Set(rows.map((r) => (r.cells[0] || "").trim())).size;
        const isLongFormatThreeCol = rows.length > 0 && rows[0].cells.length === 3 && (Boolean(seriesKey) || /^series$/i.test((headers[1] || "").trim()) || isNaN(parseFloat((rows[0].cells[1] || "").replace(/[^0-9.-]/g, ""))) || uniqueRowLabels < rows.length);
        const isWideMultiSeries = rows.length > 0 && rows[0].cells.length >= 3 && !isLongFormatThreeCol;
        const hasExplicitSeries = Boolean(seriesKey) || isLongFormatThreeCol || isWideMultiSeries;
        const data = [];
        for (const row of rows) {
          if (isWideMultiSeries && row.cells.length >= 3) {
            const label = row.cells[0].trim();
            for (let colIdx = 1; colIdx < row.cells.length; colIdx++) {
              const seriesName = (headers[colIdx] || `Series ${colIdx}`).trim();
              const rawVal = row.cells[colIdx].trim();
              const num = parseFloat(rawVal.replace(/[^0-9.-]/g, "")) || 0;
              data.push({
                label,
                series: seriesName,
                value: num,
                formattedValue: rawVal
              });
            }
          } else if (hasExplicitSeries && row.cells.length >= 3) {
            const label = row.cells[0].trim();
            const series = row.cells[1].trim();
            const rawVal = row.cells[2].trim();
            const num = parseFloat(rawVal.replace(/[^0-9.-]/g, "")) || 0;
            data.push({
              label,
              series,
              value: num,
              formattedValue: rawVal
            });
          } else if (row.cells.length >= 2) {
            const label = row.cells[0].trim();
            const rawVal = row.cells[1].trim();
            const num = parseFloat(rawVal.replace(/[^0-9.-]/g, "")) || 0;
            data.push({
              label,
              value: num,
              formattedValue: rawVal
            });
          }
        }
        const chartWrapper = document.createElement("div");
        chartWrapper.className = "mdui-chart-graphic-wrapper";
        const handleItemSelect = (targetOrToggleLabel) => {
          let nextVal;
          if (targetOrToggleLabel === "") {
            nextVal = "";
          } else if (currentSelected === targetOrToggleLabel) {
            nextVal = "";
          } else {
            nextVal = targetOrToggleLabel;
          }
          const matchedPoint = data.find((d) => d.label === nextVal);
          const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
          const val = matchedPoint ? matchedPoint.value : 0;
          const fraction = total > 0 ? val / total : 0;
          const percent = Math.round(fraction * 100);
          if (selectionKey) {
            if (nextVal) {
              options.onStateChange("selectedKey", nextVal);
              options.onStateChange("selectedItem", nextVal);
              options.onStateChange("selectedValue", val);
              options.onStateChange("selectedTotal", total);
              options.onStateChange("selectedFraction", fraction);
              options.onStateChange("selectedPercent", percent);
              options.onStateChange(selectionKey, nextVal);
            } else {
              options.onStateChange("selectedKey", "");
              options.onStateChange("selectedItem", "");
              options.onStateChange("selectedValue", "");
              options.onStateChange("selectedTotal", "");
              options.onStateChange("selectedFraction", "");
              options.onStateChange("selectedPercent", "");
              options.onStateChange(selectionKey, "");
            }
          }
          if (triggerRaw) {
            options.onAction({
              id: `chart_sel_${targetOrToggleLabel}`,
              label: nextVal,
              trigger: { type: "event", payload: `${triggerRaw}:${nextVal}` },
              style: "secondary",
              attributes: {}
            });
          }
        };
        const normalizedStyle = style.replace(/-/g, "");
        if (normalizedStyle === "barchart" || normalizedStyle === "chart") {
          if (hasExplicitSeries && data.some((d) => d.series)) {
            chartWrapper.appendChild(this.renderMultiBarChart(data, currentSelected, isSameColor, handleItemSelect));
          } else {
            chartWrapper.appendChild(this.renderBarChart(data, currentSelected, handleItemSelect));
          }
        } else if (normalizedStyle === "horizontalbarchart") {
          chartWrapper.appendChild(this.renderHorizontalBarChart(data, currentSelected, handleItemSelect));
        } else if (normalizedStyle === "linechart") {
          if (headers.length >= 3) {
            chartWrapper.appendChild(this.renderMultiLineChart(headers, rows, currentSelected, handleItemSelect));
          } else {
            chartWrapper.appendChild(this.renderLineChart(data, currentSelected, handleItemSelect));
          }
        } else if (normalizedStyle === "areachart") {
          chartWrapper.appendChild(this.renderAreaChart(data, currentSelected, handleItemSelect));
        } else if (normalizedStyle === "pointchart" || normalizedStyle === "scatterchart") {
          chartWrapper.appendChild(this.renderPointChart(data, currentSelected, handleItemSelect));
        } else if (normalizedStyle === "piechart" || normalizedStyle === "donutchart") {
          chartWrapper.appendChild(this.renderPieChart(data, currentSelected, handleItemSelect, normalizedStyle === "donutchart"));
        } else if (normalizedStyle === "progresschart") {
          chartWrapper.appendChild(this.renderProgressChart(data, currentSelected, handleItemSelect));
        }
        container.appendChild(chartWrapper);
      } else {
        for (const child of options.renderChildren()) {
          container.appendChild(child);
        }
      }
      return container;
    }
    static wrapChartLabel(label, maxLineLen = 8) {
      if (!label) return [""];
      const words = label.trim().split(/\s+/);
      if (words.length === 1) {
        return [words[0].length > 11 ? words[0].slice(0, 10) + "\u2026" : words[0]];
      }
      const lines = [];
      let currentLine = "";
      for (const word of words) {
        if (!currentLine) {
          currentLine = word;
        } else if ((currentLine + " " + word).length <= maxLineLen) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines.slice(0, 2);
    }
    static renderBarChart(data, selected, onSelect) {
      const wrap = document.createElement("div");
      wrap.className = "mdui-chart-barchart-container";
      wrap.style.position = "relative";
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
      const hasSelection = Boolean(selected);
      const svgWidth = Math.max(380, data.length * 80 + 40);
      const svgHeight = 230;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
      svg.setAttribute("class", `mdui-chart-svg ${hasSelection ? "mdui-chart-has-selection" : ""}`);
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.innerHTML = `
      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#1d4ed8" />
      </linearGradient>
      <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>
    `;
      svg.appendChild(defs);
      const tooltip = document.createElement("div");
      tooltip.className = "mdui-chart-tooltip";
      tooltip.style.pointerEvents = "none";
      wrap.appendChild(tooltip);
      const updateTooltip = (point, barX, barY) => {
        const pct = (point.value / total * 100).toFixed(1);
        const valStr = escapeHtml(point.formattedValue || (Number.isFinite(point.value) ? point.value.toLocaleString() : String(point.value)));
        const safeLabel = escapeHtml(point.label);
        tooltip.innerHTML = `
        <div class="mdui-chart-tooltip-header">${safeLabel}</div>
        <div class="mdui-chart-tooltip-body">
          <span class="mdui-chart-tooltip-val">${valStr}</span>
          <span class="mdui-chart-tooltip-badge">${pct}%</span>
        </div>
      `;
        const leftPct = (barX + 20) / svgWidth * 100;
        const topPct = barY / svgHeight * 100;
        _MarkdownChartView.positionTooltip(tooltip, leftPct, topPct);
      };
      const hideTooltip = () => {
        tooltip.classList.remove("visible");
      };
      const barGroups = [];
      data.forEach((d, i) => {
        const x = 30 + i * 80;
        const barHeight = Math.max(14, d.value / maxVal * 125);
        const y = 168 - barHeight;
        const isSelected = selected === d.label;
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.style.cursor = "pointer";
        g.setAttribute("class", `mdui-bar-group ${isSelected ? "active" : ""}`);
        barGroups.push(g);
        const hitRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hitRect.setAttribute("x", String(x - 10));
        hitRect.setAttribute("y", "10");
        hitRect.setAttribute("width", "60");
        hitRect.setAttribute("height", "200");
        hitRect.setAttribute("fill", "rgba(0, 0, 0, 0.001)");
        hitRect.setAttribute("pointer-events", "all");
        hitRect.style.pointerEvents = "all";
        g.appendChild(hitRect);
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", String(x));
        rect.setAttribute("y", String(y));
        rect.setAttribute("width", "40");
        rect.setAttribute("height", String(barHeight));
        rect.setAttribute("rx", "6");
        rect.setAttribute("fill", isSelected ? "url(#barGradActive)" : "url(#barGrad)");
        rect.setAttribute("class", "mdui-chart-bar");
        rect.style.pointerEvents = "none";
        g.appendChild(rect);
        const valText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valText.setAttribute("x", String(x + 20));
        valText.setAttribute("y", String(y - 7));
        valText.setAttribute("text-anchor", "middle");
        valText.setAttribute("fill", isSelected ? "#10b981" : "#94a3b8");
        valText.setAttribute("font-size", "11");
        valText.setAttribute("font-weight", "600");
        valText.setAttribute("class", "mdui-chart-val");
        valText.style.pointerEvents = "none";
        valText.textContent = d.formattedValue;
        g.appendChild(valText);
        const lines = this.wrapChartLabel(d.label, 9);
        const startY = lines.length === 1 ? 193 : 187;
        const lblText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        lblText.setAttribute("x", String(x + 20));
        lblText.setAttribute("y", String(startY));
        lblText.setAttribute("text-anchor", "middle");
        lblText.setAttribute("class", `mdui-chart-label ${isSelected ? "active" : ""}`);
        lblText.setAttribute("font-size", "11");
        lblText.setAttribute("font-weight", isSelected ? "700" : "500");
        lblText.style.pointerEvents = "none";
        lines.forEach((lineStr, lineIdx) => {
          const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
          tspan.setAttribute("x", String(x + 20));
          tspan.setAttribute("dy", lineIdx === 0 ? "0" : "13");
          tspan.textContent = lineStr;
          lblText.appendChild(tspan);
        });
        g.appendChild(lblText);
        g.addEventListener("mouseenter", () => {
          updateTooltip(d, x, y);
        });
        g.addEventListener("mouseleave", () => {
          hideTooltip();
        });
        g.addEventListener("click", () => {
          const isCurrentlyActive = g.classList.contains("active");
          if (isCurrentlyActive) {
            g.classList.remove("active");
            svg.classList.remove("mdui-chart-has-selection");
            hideTooltip();
            onSelect(d.label);
          } else {
            barGroups.forEach((grp) => grp.classList.remove("active"));
            g.classList.add("active");
            svg.classList.add("mdui-chart-has-selection");
            updateTooltip(d, x, y);
            onSelect(d.label);
          }
        });
        svg.appendChild(g);
      });
      svg.addEventListener("mouseleave", hideTooltip);
      wrap.addEventListener("mouseleave", hideTooltip);
      wrap.appendChild(svg);
      return wrap;
    }
    static renderHorizontalBarChart(data, selected, onSelect) {
      const wrap = document.createElement("div");
      wrap.className = "mdui-chart-hbar-list";
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      for (const d of data) {
        const isSelected = selected === d.label;
        const row = document.createElement("div");
        row.className = `mdui-hbar-row ${isSelected ? "active" : ""}`;
        row.style.cursor = "pointer";
        const labelSpan = document.createElement("span");
        labelSpan.className = "mdui-hbar-label";
        labelSpan.textContent = d.label;
        const track = document.createElement("div");
        track.className = "mdui-hbar-track";
        const fill = document.createElement("div");
        fill.className = "mdui-hbar-fill";
        const pct = Math.min(100, Math.round(d.value / maxVal * 100));
        fill.style.width = `${pct}%`;
        track.appendChild(fill);
        const valSpan = document.createElement("span");
        valSpan.className = "mdui-hbar-value";
        valSpan.textContent = d.formattedValue;
        row.appendChild(labelSpan);
        row.appendChild(track);
        row.appendChild(valSpan);
        row.addEventListener("click", () => {
          const wasActive = row.classList.contains("active");
          wrap.querySelectorAll(".mdui-hbar-row").forEach((r) => r.classList.remove("active"));
          if (!wasActive) {
            row.classList.add("active");
          }
          if (onSelect) {
            onSelect(wasActive ? "" : d.label);
          }
        });
        wrap.appendChild(row);
      }
      return wrap;
    }
    static renderLineChart(data, selected = "", onSelect) {
      const wrap = document.createElement("div");
      wrap.className = "mdui-chart-line-container";
      wrap.style.position = "relative";
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      const minVal = Math.min(...data.map((d) => d.value), 0);
      const range = maxVal - minVal || 1;
      const width = 450;
      const height = 180;
      const padding = 35;
      const points = data.map((d, i) => {
        const x = padding + i / Math.max(1, data.length - 1) * (width - padding * 2);
        const y = height - padding - (d.value - minVal) / range * (height - padding * 2);
        return { x, y, ...d };
      });
      const dPath = points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(" ");
      const areaPath = points.length > 0 ? `${dPath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : "";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("class", "mdui-chart-svg");
      svg.innerHTML = `
      <defs>
        <linearGradient id="lineGradArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      ${areaPath ? `<path d="${areaPath}" fill="url(#lineGradArea)" />` : ""}
      <path d="${dPath}" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    `;
      const crosshair = document.createElementNS("http://www.w3.org/2000/svg", "line");
      crosshair.setAttribute("y1", String(padding - 10));
      crosshair.setAttribute("y2", String(height - padding));
      crosshair.setAttribute("class", "mdui-chart-crosshair");
      crosshair.style.opacity = "0";
      svg.appendChild(crosshair);
      const tooltip = document.createElement("div");
      tooltip.className = "mdui-chart-tooltip mdui-chart-line-tooltip";
      tooltip.style.pointerEvents = "none";
      wrap.appendChild(tooltip);
      const circles = [];
      const colWidth = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 40;
      points.forEach((p) => {
        const isSelected = selected === p.label;
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", String(p.x));
        circle.setAttribute("cy", String(p.y));
        circle.setAttribute("r", isSelected ? "6" : "4.5");
        circle.setAttribute("fill", isSelected ? "#10b981" : "#60a5fa");
        circle.setAttribute("stroke", "#0f172a");
        circle.setAttribute("stroke-width", "2");
        circle.setAttribute("class", `mdui-chart-line-point ${isSelected ? "active" : ""}`);
        svg.appendChild(circle);
        circles.push(circle);
        const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        lbl.setAttribute("x", String(p.x));
        lbl.setAttribute("y", String(height - 12));
        lbl.setAttribute("text-anchor", "middle");
        lbl.setAttribute("class", `mdui-chart-label ${isSelected ? "active" : ""}`);
        lbl.setAttribute("font-size", "10");
        lbl.textContent = p.label;
        svg.appendChild(lbl);
        const hitRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hitRect.setAttribute("x", String(p.x - colWidth / 2));
        hitRect.setAttribute("y", "0");
        hitRect.setAttribute("width", String(colWidth));
        hitRect.setAttribute("height", String(height));
        hitRect.setAttribute("fill", "transparent");
        hitRect.style.cursor = "pointer";
        hitRect.addEventListener("mouseenter", () => {
          crosshair.setAttribute("x1", String(p.x));
          crosshair.setAttribute("x2", String(p.x));
          crosshair.style.opacity = "1";
          circle.setAttribute("r", "7");
          circle.classList.add("hovered");
          const safeLabel = escapeHtml(p.label);
          const safeVal = escapeHtml(p.formattedValue || (Number.isFinite(p.value) ? p.value.toLocaleString() : String(p.value)));
          tooltip.innerHTML = `
          <div class="mdui-chart-tooltip-header">${safeLabel}</div>
          <div class="mdui-chart-tooltip-body">
            <span class="mdui-chart-tooltip-val">${safeVal}</span>
          </div>
        `;
          const leftPct = p.x / width * 100;
          const topPct = p.y / height * 100;
          _MarkdownChartView.positionTooltip(tooltip, leftPct, topPct);
        });
        hitRect.addEventListener("mouseleave", () => {
          crosshair.style.opacity = "0";
          circle.setAttribute("r", selected === p.label ? "6" : "4.5");
          circle.classList.remove("hovered");
          tooltip.classList.remove("visible");
        });
        hitRect.addEventListener("click", () => {
          if (onSelect) {
            onSelect(p.label);
          }
        });
        svg.appendChild(hitRect);
      });
      const hideTracking = () => {
        crosshair.style.opacity = "0";
        tooltip.classList.remove("visible");
        circles.forEach((c, i) => {
          c.setAttribute("r", selected === points[i].label ? "6" : "4.5");
          c.classList.remove("hovered");
        });
      };
      svg.addEventListener("mouseleave", hideTracking);
      wrap.addEventListener("mouseleave", hideTracking);
      wrap.appendChild(svg);
      return wrap;
    }
    static renderMultiLineChart(headers, rows, selected = "", onSelect) {
      const wrap = document.createElement("div");
      wrap.className = "mdui-chart-multiline-container";
      wrap.style.position = "relative";
      const width = 460;
      const height = 190;
      const padding = 35;
      const s1Name = headers[1] || "Series 1";
      const s2Name = headers[2] || "Series 2";
      const s1Vals = rows.map((r) => parseFloat(r.cells[1]?.replace(/[^0-9.-]/g, "") || "0"));
      const s2Vals = rows.map((r) => parseFloat(r.cells[2]?.replace(/[^0-9.-]/g, "") || "0"));
      const allVals = [...s1Vals, ...s2Vals];
      const maxVal = Math.max(...allVals, 1);
      const minVal = Math.min(...allVals, 0);
      const range = maxVal - minVal || 1;
      const s1Points = s1Vals.map((v, i) => ({
        x: padding + i / Math.max(1, rows.length - 1) * (width - padding * 2),
        y: height - padding - (v - minVal) / range * (height - padding * 2),
        label: rows[i].cells[0] || ""
      }));
      const s2Points = s2Vals.map((v, i) => ({
        x: padding + i / Math.max(1, rows.length - 1) * (width - padding * 2),
        y: height - padding - (v - minVal) / range * (height - padding * 2),
        label: rows[i].cells[0] || ""
      }));
      const d1 = s1Points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(" ");
      const d2 = s2Points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(" ");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("class", "mdui-chart-svg");
      svg.innerHTML = `
      <path d="${d1}" fill="none" stroke="#64748b" stroke-width="2.5" stroke-dasharray="4 4" stroke-linecap="round" />
      <path d="${d2}" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" />
    `;
      const crosshair = document.createElementNS("http://www.w3.org/2000/svg", "line");
      crosshair.setAttribute("y1", String(padding - 10));
      crosshair.setAttribute("y2", String(height - padding));
      crosshair.setAttribute("class", "mdui-chart-crosshair");
      crosshair.style.opacity = "0";
      svg.appendChild(crosshair);
      const tooltip = document.createElement("div");
      tooltip.className = "mdui-chart-tooltip mdui-chart-line-tooltip";
      tooltip.style.pointerEvents = "none";
      wrap.appendChild(tooltip);
      const s1Circles = [];
      const s2Circles = [];
      const colWidth = rows.length > 1 ? (width - padding * 2) / (rows.length - 1) : 40;
      rows.forEach((r, i) => {
        const monthLabel = r.cells[0] || "";
        const isSelected = selected === monthLabel;
        const x = s1Points[i].x;
        const c1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c1.setAttribute("cx", String(s1Points[i].x));
        c1.setAttribute("cy", String(s1Points[i].y));
        c1.setAttribute("r", isSelected ? "5.5" : "4");
        c1.setAttribute("fill", "#94a3b8");
        c1.setAttribute("stroke", "#0f172a");
        c1.setAttribute("stroke-width", "2");
        c1.setAttribute("class", `mdui-chart-line-point s1-point ${isSelected ? "active" : ""}`);
        svg.appendChild(c1);
        s1Circles.push(c1);
        const c2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c2.setAttribute("cx", String(s2Points[i].x));
        c2.setAttribute("cy", String(s2Points[i].y));
        c2.setAttribute("r", isSelected ? "6" : "4.5");
        c2.setAttribute("fill", "#10b981");
        c2.setAttribute("stroke", "#0f172a");
        c2.setAttribute("stroke-width", "2");
        c2.setAttribute("class", `mdui-chart-line-point s2-point ${isSelected ? "active" : ""}`);
        svg.appendChild(c2);
        s2Circles.push(c2);
        const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        lbl.setAttribute("x", String(x));
        lbl.setAttribute("y", String(height - 12));
        lbl.setAttribute("text-anchor", "middle");
        lbl.setAttribute("class", `mdui-chart-label ${isSelected ? "active" : ""}`);
        lbl.setAttribute("font-size", "10");
        lbl.textContent = monthLabel;
        svg.appendChild(lbl);
        const hitRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hitRect.setAttribute("x", String(x - colWidth / 2));
        hitRect.setAttribute("y", "0");
        hitRect.setAttribute("width", String(colWidth));
        hitRect.setAttribute("height", String(height));
        hitRect.setAttribute("fill", "transparent");
        hitRect.style.cursor = "pointer";
        hitRect.addEventListener("mouseenter", () => {
          crosshair.setAttribute("x1", String(x));
          crosshair.setAttribute("x2", String(x));
          crosshair.style.opacity = "1";
          c1.setAttribute("r", "6");
          c1.classList.add("hovered");
          c2.setAttribute("r", "7");
          c2.classList.add("hovered");
          const v1Str = r.cells[1] || "";
          const v2Str = r.cells[2] || "";
          const v1 = s1Vals[i];
          const v2 = s2Vals[i];
          let growthBadge = "";
          if (v1 > 0 && v2 > 0) {
            const diff = v2 - v1;
            const diffPct = (diff / v1 * 100).toFixed(1);
            growthBadge = `<span class="mdui-chart-tooltip-badge">${Number(diffPct) >= 0 ? "+" : ""}${diffPct}%</span>`;
          }
          const safeLabel = escapeHtml(monthLabel);
          const safeS1 = escapeHtml(s1Name);
          const safeS2 = escapeHtml(s2Name);
          const safeV1 = escapeHtml(v1Str);
          const safeV2 = escapeHtml(v2Str);
          tooltip.innerHTML = `
          <div class="mdui-chart-tooltip-header">${safeLabel}</div>
          <div class="mdui-chart-tooltip-multiline">
            <div class="mdui-chart-tooltip-row">
              <span class="legend-dot dashed"></span>
              <span class="series-name">${safeS1}:</span>
              <span class="series-val">${safeV1}</span>
            </div>
            <div class="mdui-chart-tooltip-row">
              <span class="legend-dot emerald"></span>
              <span class="series-name">${safeS2}:</span>
              <span class="series-val highlight">${safeV2}</span>
              ${growthBadge}
            </div>
          </div>
        `;
          const leftPct = x / width * 100;
          const topY = Math.min(s1Points[i].y, s2Points[i].y);
          const topPct = topY / height * 100;
          _MarkdownChartView.positionTooltip(tooltip, leftPct, topPct);
        });
        hitRect.addEventListener("mouseleave", () => {
          crosshair.style.opacity = "0";
          c1.setAttribute("r", selected === monthLabel ? "5.5" : "4");
          c1.classList.remove("hovered");
          c2.setAttribute("r", selected === monthLabel ? "6" : "4.5");
          c2.classList.remove("hovered");
          tooltip.classList.remove("visible");
        });
        hitRect.addEventListener("click", () => {
          if (onSelect) {
            onSelect(monthLabel);
          }
        });
        svg.appendChild(hitRect);
      });
      const hideTracking = () => {
        crosshair.style.opacity = "0";
        tooltip.classList.remove("visible");
        rows.forEach((r, i) => {
          const isSel = selected === r.cells[0];
          s1Circles[i].setAttribute("r", isSel ? "5.5" : "4");
          s1Circles[i].classList.remove("hovered");
          s2Circles[i].setAttribute("r", isSel ? "6" : "4.5");
          s2Circles[i].classList.remove("hovered");
        });
      };
      svg.addEventListener("mouseleave", hideTracking);
      wrap.addEventListener("mouseleave", hideTracking);
      const legend = document.createElement("div");
      legend.className = "mdui-chart-legend";
      legend.innerHTML = `
      <span class="legend-item"><span class="legend-dot dashed"></span> ${escapeHtml(s1Name)}</span>
      <span class="legend-item"><span class="legend-dot emerald"></span> ${escapeHtml(s2Name)}</span>
    `;
      wrap.appendChild(legend);
      wrap.appendChild(svg);
      return wrap;
    }
    static renderPieChart(data, selected, onSelect, isDonut = false) {
      const wrap = document.createElement("div");
      wrap.className = `mdui-chart-pie-container ${isDonut ? "mdui-chart-donut" : "mdui-chart-pie"}`;
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
      const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
      let cumulativePercent = 0;
      const slices = data.map((d, i) => {
        const pct = d.value / total;
        const startAngle = cumulativePercent * 2 * Math.PI;
        cumulativePercent += pct;
        const endAngle = cumulativePercent * 2 * Math.PI;
        return {
          ...d,
          color: colors[i % colors.length],
          startAngle,
          endAngle
        };
      });
      const size = 180;
      const center = size / 2;
      const radius = 70;
      const innerRadius = isDonut ? 45 : 0;
      const hasSelection = Boolean(selected);
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
      svg.setAttribute("class", `mdui-chart-donut-svg ${isDonut ? "" : "mdui-chart-pie-svg"} ${hasSelection ? "mdui-chart-has-selection" : ""}`.trim());
      const slicePaths = [];
      slices.forEach((s) => {
        const x1 = center + radius * Math.cos(s.startAngle);
        const y1 = center + radius * Math.sin(s.startAngle);
        const x2 = center + radius * Math.cos(s.endAngle);
        const y2 = center + radius * Math.sin(s.endAngle);
        const largeArc = s.endAngle - s.startAngle > Math.PI ? 1 : 0;
        let pathD;
        if (isDonut && innerRadius > 0) {
          const ix1 = center + innerRadius * Math.cos(s.endAngle);
          const iy1 = center + innerRadius * Math.sin(s.endAngle);
          const ix2 = center + innerRadius * Math.cos(s.startAngle);
          const iy2 = center + innerRadius * Math.sin(s.startAngle);
          pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
        } else {
          pathD = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        }
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathD);
        path.setAttribute("fill", s.color);
        path.setAttribute("class", `mdui-donut-slice ${isDonut ? "" : "mdui-pie-slice"} ${selected === s.label ? "active" : ""}`.trim());
        path.style.cursor = "pointer";
        path.style.transition = "transform 0.2s, opacity 0.2s";
        slicePaths.push(path);
        svg.appendChild(path);
      });
      const centerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      centerGroup.setAttribute("class", "mdui-donut-center");
      const centerLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      centerLabel.setAttribute("x", String(center));
      centerLabel.setAttribute("y", String(center - 4));
      centerLabel.setAttribute("text-anchor", "middle");
      centerLabel.setAttribute("class", "mdui-donut-center-label");
      const centerVal = document.createElementNS("http://www.w3.org/2000/svg", "text");
      centerVal.setAttribute("x", String(center));
      centerVal.setAttribute("y", String(center + 14));
      centerVal.setAttribute("text-anchor", "middle");
      centerVal.setAttribute("class", "mdui-donut-center-val");
      if (isDonut) {
        centerGroup.appendChild(centerLabel);
        centerGroup.appendChild(centerVal);
        svg.appendChild(centerGroup);
      }
      const updateCenter = (label, val) => {
        centerLabel.textContent = label;
        centerVal.textContent = val;
      };
      let activeSlice = slices.find((s) => s.label === selected) || null;
      if (activeSlice) {
        const pct = Math.round(activeSlice.value / total * 100);
        updateCenter(activeSlice.label, `${pct}%`);
      } else {
        updateCenter("Total", total.toLocaleString());
      }
      slices.forEach((s, idx) => {
        const p = slicePaths[idx];
        const pct = Math.round(s.value / total * 100);
        p.addEventListener("mouseenter", () => updateCenter(s.label, `${pct}%`));
        p.addEventListener("mouseleave", () => {
          if (activeSlice) {
            const aPct = Math.round(activeSlice.value / total * 100);
            updateCenter(activeSlice.label, `${aPct}%`);
          } else {
            updateCenter("Total", total.toLocaleString());
          }
        });
        p.addEventListener("click", () => {
          if (selected === s.label) {
            activeSlice = null;
            slicePaths.forEach((sp) => sp.classList.remove("active"));
            svg.classList.remove("mdui-chart-has-selection");
            updateCenter("Total", total.toLocaleString());
            onSelect("");
          } else {
            activeSlice = s;
            slicePaths.forEach((sp) => sp.classList.remove("active"));
            p.classList.add("active");
            svg.classList.add("mdui-chart-has-selection");
            updateCenter(s.label, `${pct}%`);
            onSelect(s.label);
          }
        });
      });
      const legend = document.createElement("div");
      legend.className = "mdui-pie-legend";
      data.forEach((d, i) => {
        const isSelected = selected === d.label;
        const item = document.createElement("div");
        item.className = `mdui-pie-legend-item ${isSelected ? "active" : ""}`;
        item.style.cursor = "pointer";
        const colorBox = document.createElement("span");
        colorBox.className = "legend-color-box";
        colorBox.style.background = colors[i % colors.length];
        const nameSpan = document.createElement("span");
        nameSpan.className = "legend-name";
        nameSpan.textContent = d.label;
        const valSpan = document.createElement("span");
        valSpan.className = "legend-val";
        valSpan.textContent = d.formattedValue;
        item.appendChild(colorBox);
        item.appendChild(nameSpan);
        item.appendChild(valSpan);
        item.addEventListener("click", () => {
          if (selected === d.label) {
            onSelect("");
          } else {
            onSelect(d.label);
          }
        });
        legend.appendChild(item);
      });
      wrap.appendChild(svg);
      wrap.appendChild(legend);
      return wrap;
    }
    static renderProgressChart(data, selected, onSelect) {
      const wrap = document.createElement("div");
      wrap.className = "mdui-chart-progress-list";
      for (const d of data) {
        const isSelected = selected === d.label;
        const card = document.createElement("div");
        card.className = `mdui-progress-card ${isSelected ? "active" : ""}`;
        card.style.cursor = "pointer";
        const header = document.createElement("div");
        header.className = "mdui-progress-header";
        const title = document.createElement("span");
        title.className = "mdui-progress-title";
        title.textContent = d.label;
        const badge = document.createElement("span");
        badge.className = "mdui-progress-badge";
        badge.textContent = d.formattedValue;
        header.appendChild(title);
        header.appendChild(badge);
        const track = document.createElement("div");
        track.className = "mdui-progress-track";
        const bar = document.createElement("div");
        bar.className = "mdui-progress-bar";
        const pct = Math.min(100, Math.max(0, d.value));
        bar.style.width = `${pct}%`;
        if (pct >= 90) bar.style.backgroundColor = "#10b981";
        else if (pct >= 60) bar.style.backgroundColor = "#3b82f6";
        else bar.style.backgroundColor = "#f59e0b";
        track.appendChild(bar);
        card.appendChild(header);
        card.appendChild(track);
        card.addEventListener("click", () => {
          if (selected === d.label) {
            onSelect("");
          } else {
            onSelect(d.label);
          }
        });
        wrap.appendChild(card);
      }
      return wrap;
    }
    static renderAreaChart(data, selected = "", onSelect) {
      const wrap = document.createElement("div");
      wrap.className = "mdui-chart-areachart-container";
      wrap.style.position = "relative";
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      const minVal = Math.min(...data.map((d) => d.value), 0);
      const range = maxVal - minVal || 1;
      const width = 450;
      const height = 200;
      const padding = 35;
      const points = data.map((d, i) => {
        const x = padding + i / Math.max(1, data.length - 1) * (width - padding * 2);
        const y = height - padding - (d.value - minVal) / range * (height - padding * 2);
        return { x, y, ...d };
      });
      const dPath = points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(" ");
      const areaPath = points.length > 0 ? `${dPath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : "";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("class", "mdui-chart-svg");
      svg.innerHTML = `
      <defs>
        <linearGradient id="areaGradFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.05"/>
        </linearGradient>
      </defs>
      ${areaPath ? `<path d="${areaPath}" fill="url(#areaGradFill)" />` : ""}
      <path d="${dPath}" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    `;
      const tooltip = document.createElement("div");
      tooltip.className = "mdui-chart-tooltip mdui-chart-line-tooltip";
      tooltip.style.pointerEvents = "none";
      wrap.appendChild(tooltip);
      points.forEach((p) => {
        const isSelected = selected === p.label;
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", String(p.x));
        circle.setAttribute("cy", String(p.y));
        circle.setAttribute("r", isSelected ? "7" : "5");
        circle.setAttribute("class", `mdui-chart-point ${isSelected ? "active" : ""}`);
        circle.setAttribute("fill", isSelected ? "#10b981" : "#3b82f6");
        circle.setAttribute("stroke", "#ffffff");
        circle.setAttribute("stroke-width", "2");
        circle.style.cursor = "pointer";
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", String(p.x));
        text.setAttribute("y", String(height - 10));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", `mdui-chart-x-label ${isSelected ? "active" : ""}`);
        text.textContent = p.label;
        svg.appendChild(text);
        circle.addEventListener("mouseenter", () => {
          const safeLabel = escapeHtml(p.label);
          const safeVal = escapeHtml(String(p.value));
          tooltip.innerHTML = `
          <div class="mdui-chart-tooltip-header">${safeLabel}</div>
          <div class="mdui-chart-tooltip-body">
            <span class="mdui-chart-tooltip-val">${safeVal} ms</span>
          </div>
        `;
          const leftPct = p.x / width * 100;
          const topPct = p.y / height * 100;
          _MarkdownChartView.positionTooltip(tooltip, leftPct, topPct);
        });
        circle.addEventListener("mouseleave", () => {
          tooltip.classList.remove("visible");
        });
        circle.addEventListener("click", (e) => {
          e.stopPropagation();
          if (onSelect) onSelect(p.label);
        });
        svg.appendChild(circle);
      });
      wrap.appendChild(svg);
      return wrap;
    }
    static renderPointChart(data, selected = "", onSelect) {
      const wrap = document.createElement("div");
      wrap.className = "mdui-chart-pointchart-container";
      wrap.style.position = "relative";
      const maxVal = Math.max(...data.map((d) => d.value), 100);
      const minVal = 0;
      const range = maxVal - minVal || 1;
      const width = 450;
      const height = 200;
      const padding = 35;
      const points = data.map((d, i) => {
        const x = padding + i / Math.max(1, data.length - 1) * (width - padding * 2);
        const y = height - padding - (d.value - minVal) / range * (height - padding * 2);
        return { x, y, ...d };
      });
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("class", "mdui-chart-svg");
      for (let g = 0; g <= 4; g++) {
        const gy = padding + g / 4 * (height - padding * 2);
        const gline = document.createElementNS("http://www.w3.org/2000/svg", "line");
        gline.setAttribute("x1", String(padding));
        gline.setAttribute("x2", String(width - padding));
        gline.setAttribute("y1", String(gy));
        gline.setAttribute("y2", String(gy));
        gline.setAttribute("stroke", "rgba(148, 163, 184, 0.2)");
        gline.setAttribute("stroke-dasharray", "3 3");
        svg.appendChild(gline);
      }
      const tooltip = document.createElement("div");
      tooltip.className = "mdui-chart-tooltip";
      tooltip.style.pointerEvents = "none";
      wrap.appendChild(tooltip);
      points.forEach((p) => {
        const isSelected = selected === p.label;
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", String(p.x));
        circle.setAttribute("cy", String(p.y));
        circle.setAttribute("r", isSelected ? "8" : "6");
        circle.setAttribute("class", `mdui-chart-point ${isSelected ? "active" : ""}`);
        circle.setAttribute("fill", isSelected ? "#10b981" : "#6366f1");
        circle.setAttribute("stroke", "#ffffff");
        circle.setAttribute("stroke-width", "2.5");
        circle.style.cursor = "pointer";
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", String(p.x));
        text.setAttribute("y", String(height - 10));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", `mdui-chart-x-label ${isSelected ? "active" : ""}`);
        text.textContent = `${p.label}%`;
        svg.appendChild(text);
        circle.addEventListener("mouseenter", () => {
          const safeLabel = escapeHtml(p.label);
          const safeVal = escapeHtml(String(p.value));
          tooltip.innerHTML = `
          <div class="mdui-chart-tooltip-header">Load: ${safeLabel}%</div>
          <div class="mdui-chart-tooltip-body">
            <span class="mdui-chart-tooltip-val">Efficiency: ${safeVal}%</span>
          </div>
        `;
          const leftPct = p.x / width * 100;
          const topPct = p.y / height * 100;
          _MarkdownChartView.positionTooltip(tooltip, leftPct, topPct);
        });
        circle.addEventListener("mouseleave", () => {
          tooltip.classList.remove("visible");
        });
        circle.addEventListener("click", (e) => {
          e.stopPropagation();
          if (onSelect) onSelect(p.label);
        });
        svg.appendChild(circle);
      });
      wrap.appendChild(svg);
      return wrap;
    }
    static renderMultiBarChart(data, selected = "", isSameColor = false, onSelect) {
      const wrap = document.createElement("div");
      wrap.className = "mdui-chart-barchart-container mdui-chart-multibar";
      wrap.style.position = "relative";
      const labels = Array.from(new Set(data.map((d) => d.label)));
      const seriesNames = Array.from(new Set(data.map((d) => d.series || "Default")));
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      const svgWidth = Math.max(380, labels.length * 90 + 50);
      const svgHeight = 230;
      const paddingLeft = 40;
      const paddingBottom = 40;
      const chartHeight = svgHeight - paddingBottom - 20;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
      svg.setAttribute("class", "mdui-chart-svg");
      const tooltip = document.createElement("div");
      tooltip.className = "mdui-chart-tooltip";
      tooltip.style.pointerEvents = "none";
      wrap.appendChild(tooltip);
      const updateTooltip = (item, label, sName, barX, barY, barW) => {
        const val = item.value;
        const valDisplay = escapeHtml(item.formattedValue || (Number.isFinite(val) ? val.toLocaleString() : String(val)));
        const safeLabel = escapeHtml(label);
        const safeSName = escapeHtml(sName);
        tooltip.innerHTML = `
        <div class="mdui-chart-tooltip-header">${safeLabel} (${safeSName})</div>
        <div class="mdui-chart-tooltip-body">
          <span class="mdui-chart-tooltip-val">${valDisplay}</span>
        </div>
      `;
        const leftPct = (barX + barW / 2) / svgWidth * 100;
        const topPct = barY / svgHeight * 100;
        _MarkdownChartView.positionTooltip(tooltip, leftPct, topPct);
      };
      const hideTooltip = () => {
        tooltip.classList.remove("visible");
      };
      const groupWidth = (svgWidth - paddingLeft - 20) / labels.length;
      const barWidth = Math.max(14, (groupWidth - 16) / seriesNames.length);
      const colors = isSameColor ? ["rgba(59, 130, 246, 0.55)", "rgba(37, 99, 235, 1.0)"] : ["#3b82f6", "#10b981", "#f59e0b", "#ec4899"];
      const allBarGroups = [];
      labels.forEach((label, lIdx) => {
        const groupX = paddingLeft + lIdx * groupWidth;
        const isSelected = selected === label;
        const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        labelText.setAttribute("x", String(groupX + groupWidth / 2 - 8));
        labelText.setAttribute("y", String(svgHeight - 12));
        labelText.setAttribute("text-anchor", "middle");
        labelText.setAttribute("class", `mdui-chart-x-label ${isSelected ? "active" : ""}`);
        labelText.style.pointerEvents = "none";
        labelText.textContent = label;
        svg.appendChild(labelText);
        seriesNames.forEach((sName, sIdx) => {
          const item = data.find((d) => d.label === label && d.series === sName);
          if (!item) return;
          const val = item.value;
          const barH = Math.max(6, val / maxVal * chartHeight);
          const barX = groupX + sIdx * barWidth;
          const barY = svgHeight - paddingBottom - barH;
          const seriesColor = colors[sIdx % colors.length];
          const barG = document.createElementNS("http://www.w3.org/2000/svg", "g");
          barG.setAttribute("class", `mdui-bar-group ${isSelected ? "active" : ""}`);
          barG.style.cursor = "pointer";
          allBarGroups.push(barG);
          const hitRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          hitRect.setAttribute("x", String(barX));
          hitRect.setAttribute("y", "10");
          hitRect.setAttribute("width", String(barWidth));
          hitRect.setAttribute("height", String(svgHeight - paddingBottom - 10));
          hitRect.setAttribute("fill", "rgba(0, 0, 0, 0.001)");
          hitRect.setAttribute("pointer-events", "all");
          hitRect.style.pointerEvents = "all";
          barG.appendChild(hitRect);
          const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          rect.setAttribute("x", String(barX));
          rect.setAttribute("y", String(barY));
          rect.setAttribute("width", String(Math.max(4, barWidth - 4)));
          rect.setAttribute("height", String(barH));
          rect.setAttribute("rx", "4");
          rect.setAttribute("fill", seriesColor);
          rect.setAttribute("class", `mdui-chart-bar ${isSelected ? "active" : ""}`);
          rect.style.pointerEvents = "none";
          rect.style.transition = "opacity 0.2s ease, filter 0.2s ease, stroke 0.2s ease";
          barG.appendChild(rect);
          const show = () => {
            updateTooltip(item, label, sName, barX, barY, barWidth);
          };
          barG.addEventListener("mouseenter", show);
          barG.addEventListener("mouseleave", hideTooltip);
          barG.addEventListener("touchstart", () => {
            show();
          }, { passive: true });
          barG.addEventListener("click", (e) => {
            e.stopPropagation();
            const isCurrentlyActive = barG.classList.contains("active");
            allBarGroups.forEach((grp) => {
              grp.classList.remove("active");
              grp.querySelector(".mdui-chart-bar")?.classList.remove("active");
            });
            if (isCurrentlyActive) {
              svg.classList.remove("mdui-chart-has-selection");
              hideTooltip();
              if (onSelect) onSelect("");
            } else {
              barG.classList.add("active");
              rect.classList.add("active");
              svg.classList.add("mdui-chart-has-selection");
              show();
              if (onSelect) onSelect(label);
            }
          });
          svg.appendChild(barG);
        });
      });
      svg.addEventListener("mouseleave", hideTooltip);
      wrap.addEventListener("mouseleave", hideTooltip);
      wrap.appendChild(svg);
      return wrap;
    }
  };

  // packages/web/src/components/MarkdownCarouselView.ts
  var MarkdownCarouselView = class {
    static canHandle(style) {
      const s = (style || "").toLowerCase();
      return s === "carousel" || s.split("+").includes("carousel");
    }
    static render(block, renderChildren, customClass) {
      const carousel = document.createElement("div");
      carousel.className = `mdui-carousel ${customClass || ""}`.trim();
      if (block.id) carousel.id = block.id;
      const viewport = document.createElement("div");
      viewport.className = "mdui-carousel-viewport";
      const track = document.createElement("div");
      track.className = "mdui-carousel-track";
      const childElements = renderChildren();
      childElements.forEach((child, index) => {
        child.classList.add("mdui-carousel-item");
        child.setAttribute("data-carousel-index", String(index));
        track.appendChild(child);
      });
      viewport.appendChild(track);
      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "mdui-carousel-btn mdui-carousel-btn-prev";
      prevBtn.setAttribute("aria-label", "Previous slide");
      prevBtn.innerHTML = "&#8249;";
      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "mdui-carousel-btn mdui-carousel-btn-next";
      nextBtn.setAttribute("aria-label", "Next slide");
      nextBtn.innerHTML = "&#8250;";
      viewport.appendChild(prevBtn);
      viewport.appendChild(nextBtn);
      carousel.appendChild(viewport);
      const pagination = document.createElement("div");
      pagination.className = "mdui-carousel-pagination";
      const dots = [];
      childElements.forEach((_, idx) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "mdui-carousel-dot";
        dot.setAttribute("aria-label", `Go to slide ${idx + 1}`);
        if (idx === 0) dot.classList.add("mdui-active");
        dot.addEventListener("click", () => {
          const target = track.children[idx];
          if (target) {
            track.scrollTo({
              left: target.offsetLeft - track.offsetLeft,
              behavior: "smooth"
            });
          }
        });
        dots.push(dot);
        pagination.appendChild(dot);
      });
      carousel.appendChild(pagination);
      prevBtn.addEventListener("click", () => {
        const itemWidth = track.firstElementChild?.offsetWidth || 300;
        track.scrollBy({ left: -(itemWidth + 16), behavior: "smooth" });
      });
      nextBtn.addEventListener("click", () => {
        const itemWidth = track.firstElementChild?.offsetWidth || 300;
        track.scrollBy({ left: itemWidth + 16, behavior: "smooth" });
      });
      let scrollRaf = null;
      const updateActiveDot = () => {
        const scrollLeft = track.scrollLeft;
        const trackLeft = track.offsetLeft;
        let closestIdx = 0;
        let minDistance = Infinity;
        Array.from(track.children).forEach((child, i) => {
          const el = child;
          const distance = Math.abs(el.offsetLeft - trackLeft - scrollLeft);
          if (distance < minDistance) {
            minDistance = distance;
            closestIdx = i;
          }
        });
        dots.forEach((dot, i) => {
          if (i === closestIdx) {
            dot.classList.add("mdui-active");
          } else {
            dot.classList.remove("mdui-active");
          }
        });
      };
      track.addEventListener("scroll", () => {
        if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
        scrollRaf = requestAnimationFrame(updateActiveDot);
      }, { passive: true });
      return carousel;
    }
  };

  // packages/web/src/components/MarkdownBlockView.ts
  function isSafeUrl(url) {
    if (!url) return false;
    const lower = url.trim().toLowerCase();
    if (lower === "#" || lower === "" || lower === "about:blank") return false;
    if (lower.startsWith("javascript:") || lower.startsWith("vbscript:") || lower.startsWith("data:text/html") || lower.startsWith("file:")) {
      return false;
    }
    return true;
  }
  var MarkdownBlockView = class _MarkdownBlockView {
    static renderBlock(options) {
      const { block, state, onStateChange, onAction, registry, theme } = options;
      if (registry) {
        const override = registry.getOverride(block.kind) || (block.kind === "codeBlock" ? registry.getOverride("code") : void 0);
        if (override) {
          const rendered = override({
            block,
            state,
            onStateChange,
            onAction: (e) => onAction(e.detail),
            renderChildren: () => (block.children || []).map((child) => this.renderBlock({ ...options, block: child }))
          });
          if (typeof rendered === "string") {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = rendered;
            return wrapper;
          }
          return rendered;
        }
      }
      const classNames = theme?.classNames || {};
      const actionHandler = {
        onAction,
        onSetState: onStateChange,
        validateForm: options.validateForm,
        state
      };
      switch (block.kind) {
        case "heading": {
          const level = Math.min(Math.max(block.level || 1, 1), 6);
          const heading = document.createElement(`h${level}`);
          const headingKey = `heading${level}`;
          const customHeadingClass = classNames[headingKey] || classNames.heading;
          const inlineClass = block.attributes?.customClass ? String(block.attributes.customClass) : "";
          heading.className = `mdui-heading mdui-h${level} ${customHeadingClass || ""} ${inlineClass}`.trim();
          const rawText = block.spans ? block.spans.map((s) => s.text || "").join(" ").trim() : "";
          if (rawText) {
            const slug = rawText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            if (slug) heading.id = slug;
          }
          heading.appendChild(this.renderSpans(block.spans, state, actionHandler));
          return heading;
        }
        case "metric": {
          return MarkdownMetricView.render(
            block,
            state,
            (spans) => this.renderSpans(spans, state, actionHandler),
            classNames.metric
          );
        }
        case "paragraph": {
          const p = document.createElement("p");
          p.className = `mdui-paragraph ${classNames.paragraph || ""}`.trim();
          p.appendChild(this.renderSpans(block.spans, state, actionHandler));
          return p;
        }
        case "blockquote": {
          const bq = document.createElement("blockquote");
          bq.className = `mdui-blockquote ${classNames.blockquote || ""}`.trim();
          if (block.spans && block.spans.length > 0) {
            bq.appendChild(this.renderSpans(block.spans, state, actionHandler));
          } else if (block.rawText) {
            bq.textContent = block.rawText;
          }
          return bq;
        }
        case "codeBlock": {
          const wrapper = document.createElement("div");
          wrapper.className = "mdui-code-wrapper";
          const pre = document.createElement("pre");
          pre.className = `mdui-code-block ${classNames.codeBlock || ""}`.trim();
          const code = document.createElement("code");
          if (block.codeLanguage) {
            code.className = `language-${block.codeLanguage}`;
          }
          code.textContent = block.rawText || "";
          pre.appendChild(code);
          wrapper.appendChild(pre);
          const copyBtn = document.createElement("button");
          copyBtn.type = "button";
          copyBtn.className = "mdui-code-copy-btn";
          copyBtn.setAttribute("aria-label", "Copy code to clipboard");
          copyBtn.setAttribute("title", "Copy code");
          copyBtn.innerHTML = '<span class="mdui-code-copy-icon">\u{1F4CB}</span>';
          copyBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const text = block.rawText || "";
            if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
              navigator.clipboard.writeText(text).catch(() => {
                _MarkdownBlockView.copyToClipboardFallback(text);
              });
            } else {
              _MarkdownBlockView.copyToClipboardFallback(text);
            }
            copyBtn.innerHTML = '<span class="mdui-code-copy-icon">\u2713</span>';
            copyBtn.classList.add("mdui-copied");
            setTimeout(() => {
              copyBtn.innerHTML = '<span class="mdui-code-copy-icon">\u{1F4CB}</span>';
              copyBtn.classList.remove("mdui-copied");
            }, 1500);
          });
          wrapper.appendChild(copyBtn);
          return wrapper;
        }
        case "table": {
          return MarkdownTableView.render(
            block,
            (p) => this.renderSpans(p.spans, state, actionHandler),
            classNames.table
          );
        }
        case "list": {
          const listEl = document.createElement(block.isOrderedList ? "ol" : "ul");
          listEl.className = `mdui-list ${classNames.list || ""}`.trim();
          if (block.isOrderedList && block.listStart) {
            listEl.setAttribute("start", String(block.listStart));
          }
          if (block.children) {
            for (const item of block.children) {
              const li = document.createElement("li");
              li.className = `mdui-list-item ${classNames.listItem || ""}`.trim();
              if (item.children) {
                for (const child of item.children) {
                  li.appendChild(this.renderBlock({ ...options, block: child }));
                }
              } else if (item.spans) {
                li.appendChild(this.renderSpans(item.spans, state, actionHandler));
              }
              listEl.appendChild(li);
            }
          }
          return listEl;
        }
        case "divider": {
          const hr = document.createElement("hr");
          const bleedClass = block.isDividerBleed ? "mdui-bleed" : "";
          hr.className = `mdui-divider ${bleedClass} ${classNames.divider || ""}`.trim();
          if (block.isDividerBleed) {
            hr.setAttribute("data-layout-bleed", "true");
          }
          return hr;
        }
        case "image":
        case "media": {
          return MarkdownMediaView.render(block, classNames.media || classNames.image);
        }
        case "action": {
          if (!block.action) return document.createElement("div");
          return MarkdownActionView.renderButton(
            block.action,
            actionHandler,
            Boolean(block.attributes?.equalGrow),
            classNames.action
          );
        }
        case "actionRow": {
          return MarkdownActionView.renderRow(block, actionHandler, (c) => this.renderBlock({ ...options, block: c }));
        }
        case "input": {
          if (!block.input) return document.createElement("div");
          return MarkdownInputView.render(
            block.input,
            { state, onValueChange: onStateChange },
            classNames.input
          );
        }
        case "accordion": {
          return MarkdownAccordionView.render(
            block,
            () => (block.defaultChildren || []).map((c) => this.renderBlock({ ...options, block: c })),
            () => (block.children || []).map((c) => this.renderBlock({ ...options, block: c })),
            classNames.accordion
          );
        }
        case "conditional": {
          return MarkdownConditionalView.render(
            block,
            state,
            () => (block.children || []).map((c) => this.renderBlock({ ...options, block: c })),
            () => (block.elseChildren || []).map((c) => this.renderBlock({ ...options, block: c })),
            (blocks) => (blocks || []).map((c) => this.renderBlock({ ...options, block: c })),
            onStateChange
          );
        }
        case "loop": {
          const container = document.createElement("div");
          container.className = "mdui-loop-container";
          const rawList = (block.loopDataset ? resolveVariablePath(state, block.loopDataset) : void 0) ?? (block.loopDataset ? state[block.loopDataset] : void 0);
          const list = Array.isArray(rawList) ? rawList : [];
          const alias = block.loopAlias || "item";
          for (let idx = 0; idx < list.length; idx++) {
            const item = list[idx];
            const isObj = item !== null && typeof item === "object" && !Array.isArray(item);
            const localState = {
              ...state,
              ...isObj ? item : {},
              [alias]: item
            };
            if (isObj) {
              for (const [k, v] of Object.entries(item)) {
                localState[`${alias}.${k}`] = v;
              }
            }
            const count = list.length;
            const meta = {
              index: idx,
              index1: idx + 1,
              count,
              isFirst: idx === 0,
              isLast: idx === count - 1,
              isEven: idx % 2 === 0,
              isOdd: idx % 2 !== 0
            };
            localState["$loop"] = meta;
            for (const [mk, mv] of Object.entries(meta)) {
              localState[`loop-metadata.${mk}`] = mv;
              localState[`$loop.${mk}`] = mv;
              localState[`$${mk}`] = mv;
            }
            localState["$index"] = idx;
            localState["$count"] = count;
            if (block.children) {
              for (const child of block.children) {
                container.appendChild(this.renderBlock({
                  ...options,
                  state: localState,
                  block: child
                }));
              }
            }
          }
          return container;
        }
        case "footnote": {
          const fnDiv = document.createElement("div");
          const fnId = block.attributes?.id || block.id;
          fnDiv.className = `mdui-footnote ${classNames.footnote || ""}`.trim();
          fnDiv.id = `fn-${fnId}`;
          const prefix = document.createElement("span");
          prefix.className = "mdui-footnote-label";
          prefix.textContent = `[${fnId}]: `;
          fnDiv.appendChild(prefix);
          const contentSpan = document.createElement("span");
          contentSpan.className = "mdui-footnote-content";
          if (block.spans && block.spans.length > 0) {
            contentSpan.appendChild(this.renderSpans(block.spans, state, actionHandler));
          } else if (block.rawText) {
            contentSpan.textContent = block.rawText;
          }
          fnDiv.appendChild(contentSpan);
          return fnDiv;
        }
        case "group": {
          return this.renderGroup(options);
        }
        default: {
          const div = document.createElement("div");
          if (block.spans) {
            div.appendChild(this.renderSpans(block.spans, state, actionHandler));
          } else if (block.rawText) {
            div.textContent = block.rawText;
          }
          return div;
        }
      }
    }
    static renderGroup(options) {
      const { block, state, onStateChange, onAction, registry, theme } = options;
      const group = block.group;
      const style = (group?.style || "plain").toLowerCase();
      const classNames = theme?.classNames || {};
      if (registry) {
        const customRenderer = registry.getRenderer(style);
        if (customRenderer) {
          const rendered = customRenderer({
            block,
            state,
            onStateChange,
            onAction: (e) => onAction(e.detail),
            renderChildren: () => (block.children || []).map((child) => this.renderBlock({ ...options, block: child }))
          });
          if (typeof rendered === "string") {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = rendered;
            return wrapper;
          }
          return rendered;
        }
      }
      if (MarkdownChartView.canHandle(style)) {
        return MarkdownChartView.render(block, {
          state,
          onStateChange,
          onAction,
          renderChildren: () => (block.children || []).map((child) => this.renderBlock({ ...options, block: child }))
        });
      }
      if (MarkdownCarouselView.canHandle(style) || group?.compoundStyles.includes("carousel")) {
        return MarkdownCarouselView.render(
          block,
          () => (block.children || []).map((child) => this.renderBlock({ ...options, block: child })),
          classNames[style] || classNames.group
        );
      }
      const isSkeletonStyle = style === "skeleton" || group?.compoundStyles.includes("skeleton");
      const groupCondition = group?.condition || block.condition || block.attributes?.condition;
      if (isSkeletonStyle) {
        if (groupCondition) {
          try {
            const condStr = TemplateInterpolator.interpolate(groupCondition, state);
            const expr = MarkdownRuleExprParser.parse(condStr);
            const isReady = evaluateRuleExpr(expr, state);
            if (!isReady) {
              return MarkdownSkeletonView.render(block, theme?.classNames?.skeleton);
            }
          } catch {
            return MarkdownSkeletonView.render(block, theme?.classNames?.skeleton);
          }
        } else {
          return MarkdownSkeletonView.render(block, theme?.classNames?.skeleton);
        }
      }
      if (groupCondition && !group?.compoundStyles?.includes("skeleton")) {
        try {
          const condStr = TemplateInterpolator.interpolate(groupCondition, state);
          const expr = MarkdownRuleExprParser.parse(condStr);
          const isVisible = evaluateRuleExpr(expr, state);
          if (!isVisible) {
            const hidden = document.createElement("div");
            hidden.style.display = "none";
            return hidden;
          }
        } catch {
        }
      }
      const container = document.createElement("div");
      const lowerStyle = style.toLowerCase();
      let archetypeClass = "mdui-plain";
      if (lowerStyle.includes("card") || lowerStyle === "skeleton") {
        if (lowerStyle.includes("positive")) archetypeClass = "mdui-card mdui-card-positive";
        else if (lowerStyle.includes("negative")) archetypeClass = "mdui-card mdui-card-negative";
        else if (lowerStyle.includes("neutral")) archetypeClass = "mdui-card mdui-card-neutral";
        else archetypeClass = "mdui-card";
      } else if (lowerStyle === "hero") {
        archetypeClass = "mdui-hero mdui-bleed";
        container.setAttribute("data-layout-bleed", "true");
      } else if (lowerStyle === "grid") {
        archetypeClass = "mdui-grid";
      } else if (lowerStyle === "row") {
        archetypeClass = "mdui-row";
      } else if (lowerStyle === "flow") {
        archetypeClass = "mdui-flow";
      } else if (lowerStyle === "column") {
        archetypeClass = "mdui-column";
      } else if (lowerStyle === "auto") {
        archetypeClass = "mdui-auto";
      } else if (lowerStyle === "tableview" || lowerStyle === "list") {
        archetypeClass = "mdui-tableview";
      } else if (lowerStyle === "spacer") {
        archetypeClass = "mdui-spacer";
        const sizeVal = group?.attributes?.height || group?.attributes?.size || group?.attributes?.width || block.attributes?.height || block.attributes?.size;
        if (sizeVal) {
          const formatted = /^\d+$/.test(sizeVal) ? `${sizeVal}px` : sizeVal;
          container.style.flex = `0 0 ${formatted}`;
          container.style.height = formatted;
          container.style.minHeight = formatted;
        }
      }
      const bgImg = group?.attributes?.["bg-image"] || block.attributes?.["bg-image"];
      if (bgImg) {
        const interpUrl = TemplateInterpolator.interpolate(bgImg, state);
        const scrim = group?.attributes?.["scrim"] || block.attributes?.["scrim"];
        const isCardOrHero = lowerStyle === "hero" || lowerStyle.includes("card");
        const applyDarkScrim = scrim === "dark" || !scrim && isCardOrHero;
        const applyLightScrim = scrim === "light";
        if (applyDarkScrim) {
          container.style.backgroundImage = `linear-gradient(rgba(10, 15, 30, 0.65), rgba(10, 15, 30, 0.75)), url('${interpUrl}')`;
          archetypeClass += " mdui-has-bg-image mdui-scrim-dark";
        } else if (applyLightScrim) {
          container.style.backgroundImage = `linear-gradient(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.85)), url('${interpUrl}')`;
          archetypeClass += " mdui-has-bg-image mdui-scrim-light";
        } else {
          container.style.backgroundImage = `url('${interpUrl}')`;
          archetypeClass += " mdui-has-bg-image";
        }
        container.style.backgroundSize = "cover";
        container.style.backgroundPosition = "center";
        container.style.backgroundRepeat = "no-repeat";
      }
      if (group && group.compoundStyles && group.compoundStyles.length > 1) {
        const lowerCompounds = group.compoundStyles.map((s) => s.toLowerCase());
        if (lowerCompounds.some((s) => s.includes("card"))) {
          if (!archetypeClass.includes("mdui-card")) {
            archetypeClass = "mdui-card";
          }
          if (lowerCompounds.some((s) => s.includes("positive")) && !archetypeClass.includes("mdui-card-positive")) {
            archetypeClass += " mdui-card-positive";
          }
          if (lowerCompounds.some((s) => s.includes("negative")) && !archetypeClass.includes("mdui-card-negative")) {
            archetypeClass += " mdui-card-negative";
          }
          if (lowerCompounds.some((s) => s.includes("neutral")) && !archetypeClass.includes("mdui-card-neutral")) {
            archetypeClass += " mdui-card-neutral";
          }
        }
        if (lowerCompounds.includes("row") && !archetypeClass.includes("mdui-row")) archetypeClass += " mdui-row";
        if (lowerCompounds.includes("flow") && !archetypeClass.includes("mdui-flow")) archetypeClass += " mdui-flow";
        if (lowerCompounds.includes("grid") && !archetypeClass.includes("mdui-grid")) archetypeClass += " mdui-grid";
        if (lowerCompounds.includes("column") && !archetypeClass.includes("mdui-column")) archetypeClass += " mdui-column";
        if (lowerCompounds.includes("auto") && !archetypeClass.includes("mdui-auto")) archetypeClass += " mdui-auto";
      }
      const customOverrideClass = classNames[style] || classNames.group || "";
      container.className = `${archetypeClass} ${customOverrideClass}`.trim();
      if (group?.id) {
        container.id = group.id;
        container.classList.add(group.id);
      }
      if (style && style !== "plain") {
        container.setAttribute("data-style", style);
      }
      const customStyleAttr = group?.attributes?.style || block.attributes?.style;
      if (customStyleAttr) {
        container.setAttribute("data-custom-style", customStyleAttr);
        container.classList.add(customStyleAttr);
      }
      if (block.children) {
        for (const child of block.children) {
          container.appendChild(this.renderBlock({ ...options, block: child }));
        }
      }
      return container;
    }
    static renderSpans(spans, state, actionHandler) {
      const frag = document.createDocumentFragment();
      if (!spans || spans.length === 0) return frag;
      for (const span of spans) {
        switch (span.type) {
          case "text":
            if (span.content.includes("\n")) {
              const parts = span.content.split("\n");
              parts.forEach((part, idx) => {
                if (idx > 0) frag.appendChild(document.createElement("br"));
                if (part) frag.appendChild(document.createTextNode(part));
              });
            } else {
              frag.appendChild(document.createTextNode(span.content));
            }
            break;
          case "bold": {
            const strong = document.createElement("strong");
            if (span.children && span.children.length > 0) {
              strong.appendChild(this.renderSpans(span.children, state, actionHandler));
            } else if (span.content) {
              strong.textContent = span.content;
            }
            frag.appendChild(strong);
            break;
          }
          case "italic": {
            const em = document.createElement("em");
            if (span.children && span.children.length > 0) {
              em.appendChild(this.renderSpans(span.children, state, actionHandler));
            } else if (span.content) {
              em.textContent = span.content;
            }
            frag.appendChild(em);
            break;
          }
          case "boldItalic": {
            const strong = document.createElement("strong");
            const em = document.createElement("em");
            if (span.children && span.children.length > 0) {
              em.appendChild(this.renderSpans(span.children, state, actionHandler));
            } else if (span.content) {
              em.textContent = span.content;
            }
            strong.appendChild(em);
            frag.appendChild(strong);
            break;
          }
          case "strike": {
            const del = document.createElement("del");
            if (span.children && span.children.length > 0) {
              del.appendChild(this.renderSpans(span.children, state, actionHandler));
            } else if (span.content) {
              del.textContent = span.content;
            }
            frag.appendChild(del);
            break;
          }
          case "underline": {
            const u = document.createElement("u");
            if (span.children && span.children.length > 0) {
              u.appendChild(this.renderSpans(span.children, state, actionHandler));
            } else if (span.content) {
              u.textContent = span.content;
            }
            frag.appendChild(u);
            break;
          }
          case "super": {
            const sup = document.createElement("sup");
            sup.textContent = span.content ? TemplateInterpolator.interpolate(span.content, state) : "";
            frag.appendChild(sup);
            break;
          }
          case "sub": {
            const sub = document.createElement("sub");
            sub.textContent = span.content ? TemplateInterpolator.interpolate(span.content, state) : "";
            frag.appendChild(sub);
            break;
          }
          case "code": {
            const code = document.createElement("code");
            code.className = "mdui-inline-code";
            const text = span.content || "";
            if (text.includes("{{") && text.includes("}}")) {
              code.textContent = text.replace(/\{\{([^}]+)\}\}/g, (fullMatch, expr) => {
                const res = TemplateInterpolator.evaluateExpression(expr.trim(), state);
                return res !== "" && res !== void 0 && res !== null ? res : fullMatch;
              });
            } else {
              code.textContent = text;
            }
            frag.appendChild(code);
            break;
          }
          case "interpolation": {
            const interpolatedText = TemplateInterpolator.evaluateExpression(span.content, state);
            if (span.fontStyle || span.colorName || span.bgColor) {
              const spanEl = document.createElement("span");
              spanEl.className = "mdui-custom-style";
              this.applySpanStyle(spanEl, span);
              spanEl.textContent = interpolatedText;
              frag.appendChild(spanEl);
            } else {
              frag.appendChild(document.createTextNode(interpolatedText));
            }
            break;
          }
          case "customStyle": {
            const spanEl = document.createElement("span");
            spanEl.className = "mdui-custom-style";
            this.applySpanStyle(spanEl, span);
            if (span.children && span.children.length > 0) {
              spanEl.appendChild(this.renderSpans(span.children, state, actionHandler));
            } else {
              spanEl.textContent = span.content;
            }
            frag.appendChild(spanEl);
            break;
          }
          case "link": {
            if (span.action) {
              const btn = MarkdownActionView.renderButton(span.action, actionHandler);
              frag.appendChild(btn);
            } else {
              const a = document.createElement("a");
              const rawUrl = span.url || "";
              if (isSafeUrl(rawUrl)) {
                a.href = rawUrl;
              } else {
                a.href = "#";
                a.setAttribute("aria-disabled", "true");
                a.addEventListener("click", (e) => e.preventDefault());
              }
              a.textContent = span.content;
              frag.appendChild(a);
            }
            break;
          }
          case "footnoteRef": {
            const sup = document.createElement("sup");
            const a = document.createElement("a");
            a.href = `#fn-${span.content}`;
            a.textContent = `[${span.content}]`;
            sup.appendChild(a);
            frag.appendChild(sup);
            break;
          }
        }
      }
      return frag;
    }
    static applySpanStyle(spanEl, span) {
      if (span.fontStyle) {
        const tokens = span.fontStyle.split(/\s+/).filter(Boolean);
        for (const token of tokens) {
          const lower = token.toLowerCase();
          spanEl.classList.add(`mdui-font-${lower}`);
          if (lower === "title") {
            spanEl.style.fontSize = "1.5rem";
            spanEl.style.fontWeight = "700";
          } else if (lower === "headline") {
            spanEl.style.fontSize = "1.125rem";
            spanEl.style.fontWeight = "600";
          } else if (lower === "subheadline") {
            spanEl.style.fontSize = "0.875rem";
          } else if (lower === "footnote") {
            spanEl.style.fontSize = "0.8rem";
          } else if (lower === "caption") {
            spanEl.style.fontSize = "0.75rem";
          } else if (lower === "bold") {
            spanEl.style.fontWeight = "700";
          } else if (lower === "semibold") {
            spanEl.style.fontWeight = "600";
          } else if (lower === "italic") {
            spanEl.style.fontStyle = "italic";
          }
        }
      }
      if (span.colorName && !span.colorName.startsWith("#")) {
        const token = span.colorName.toLowerCase();
        spanEl.style.color = `var(--mdui-color-${token}, ${span.colorName})`;
      }
      if (span.bgColor && !span.bgColor.startsWith("#")) {
        const token = span.bgColor.toLowerCase();
        spanEl.style.backgroundColor = `var(--mdui-color-${token}-bg, var(--mdui-color-${token}, ${span.bgColor}))`;
      }
    }
    static copyToClipboardFallback(text) {
      if (typeof document === "undefined") return;
      const scrollY = window.scrollY || document.documentElement?.scrollTop || document.body?.scrollTop || 0;
      const scrollX = window.scrollX || document.documentElement?.scrollLeft || document.body?.scrollLeft || 0;
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.top = `${scrollY}px`;
      textArea.style.left = `${scrollX}px`;
      textArea.style.width = "1px";
      textArea.style.height = "1px";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.background = "transparent";
      textArea.style.opacity = "0.01";
      textArea.style.pointerEvents = "none";
      document.body.appendChild(textArea);
      textArea.focus({ preventScroll: true });
      textArea.select();
      try {
        document.execCommand("copy");
      } catch {
      }
      document.body.removeChild(textArea);
      if (typeof window !== "undefined" && (window.scrollY !== scrollY || window.scrollX !== scrollX)) {
        window.scrollTo(scrollX, scrollY);
      }
    }
  };

  // packages/web/src/adaptive/AdaptiveVerticalLayout.ts
  var AdaptiveVerticalLayout = class {
    resizeObserver = null;
    maxContainerWidth = 720;
    minContainerWidth = 540;
    constructor(options) {
      if (options?.maxContainerWidth !== void 0) this.maxContainerWidth = options.maxContainerWidth;
      if (options?.minContainerWidth !== void 0) this.minContainerWidth = options.minContainerWidth;
    }
    attach(container, onResize) {
      container.classList.add("mdui-container");
      const update = (availableWidth) => {
        if (availableWidth < 720) {
          container.setAttribute("data-screen-class", "compact");
          container.removeAttribute("data-layout-contained");
        } else if (availableWidth < 1024) {
          container.setAttribute("data-screen-class", "regular");
          container.setAttribute("data-layout-contained", "true");
        } else {
          container.setAttribute("data-screen-class", "wide");
          container.setAttribute("data-layout-contained", "true");
        }
        const targetWidth = availableWidth < 720 ? availableWidth : Math.min(availableWidth, this.maxContainerWidth);
        container.style.setProperty("--mdui-resolved-container-width", `${targetWidth}px`);
        onResize?.(availableWidth);
      };
      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            update(entry.contentRect.width);
          }
        });
        this.resizeObserver.observe(container);
      }
      const initialWidth = container.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 720);
      update(initialWidth);
    }
    detach() {
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
    }
  };

  // packages/web/src/styles/themes.ts
  function applyTheme(element, theme) {
    const savedContainerPadding = element.style.getPropertyValue("--mdui-container-padding");
    for (let i = element.style.length - 1; i >= 0; i--) {
      const name = element.style[i];
      if (name.startsWith("--mdui-") && name !== "--mdui-container-padding") {
        element.style.removeProperty(name);
      }
    }
    if (savedContainerPadding) {
      element.style.setProperty("--mdui-container-padding", savedContainerPadding);
    }
    if (theme.name !== "default") {
      const vars = themeToCssVariables(theme);
      for (const [prop, val] of Object.entries(vars)) {
        element.style.setProperty(prop, val);
      }
    }
    if (theme.elements) {
      for (const [kind, override] of Object.entries(theme.elements)) {
        if (override?.cssProperties) {
          for (const [p, v] of Object.entries(override.cssProperties)) {
            element.style.setProperty(p, v);
          }
        }
      }
    }
    if (theme.customCss) {
      let styleTag = element.querySelector("style[data-mdui-custom-theme]");
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.setAttribute("data-mdui-custom-theme", "true");
        element.prepend(styleTag);
      }
      styleTag.textContent = theme.customCss;
    }
  }
  var defaultTheme = {
    name: "default",
    colors: {
      primary: "#2563eb",
      primaryHover: "#1d4ed8",
      primaryText: "#ffffff",
      secondary: "#f1f5f9",
      secondaryHover: "#e2e8f0",
      secondaryText: "#0f172a",
      destructive: "#ef4444",
      destructiveHover: "#dc2626",
      destructiveText: "#ffffff",
      background: "#ffffff",
      surface: "#ffffff",
      surfaceSubtle: "#f8fafc",
      border: "#e2e8f0",
      borderSubtle: "#f1f5f9",
      text: "#0f172a",
      textMuted: "#64748b",
      textTertiary: "#94a3b8",
      cardBackground: "#ffffff",
      codeBackground: "#f1f5f9",
      codeText: "#0f172a"
    },
    radii: {
      card: "12px",
      button: "8px",
      input: "8px",
      badge: "9999px"
    },
    spacing: {
      base: "16px",
      maxParagraphWidth: "720px",
      maxInputWidth: "540px"
    }
  };
  var darkTheme = {
    name: "dark",
    colors: {
      primary: "#3b82f6",
      primaryHover: "#60a5fa",
      primaryText: "#ffffff",
      secondary: "#1e293b",
      secondaryHover: "#334155",
      secondaryText: "#f8fafc",
      destructive: "#f87171",
      destructiveHover: "#ef4444",
      destructiveText: "#ffffff",
      background: "#090d16",
      surface: "#111827",
      surfaceSubtle: "#1e293b",
      border: "#1f2937",
      borderSubtle: "#334155",
      text: "#f9fafb",
      textMuted: "#9ca3af",
      textTertiary: "#64748b",
      cardBackground: "#111827",
      codeBackground: "#030712",
      codeText: "#f3f4f6"
    },
    radii: {
      card: "12px",
      button: "8px",
      input: "8px",
      badge: "9999px"
    },
    spacing: {
      base: "16px",
      maxParagraphWidth: "720px",
      maxInputWidth: "540px"
    }
  };
  var fintechTheme = {
    name: "fintech",
    colors: {
      primary: "#059669",
      primaryHover: "#047857",
      primaryText: "#ffffff",
      secondary: "#f0fdf4",
      secondaryHover: "#dcfce7",
      secondaryText: "#166534",
      background: "#ffffff",
      surface: "#ffffff",
      surfaceSubtle: "#f0fdf4",
      border: "#e2e8f0",
      borderSubtle: "#dcfce7",
      text: "#0f172a",
      textMuted: "#475569",
      textTertiary: "#64748b",
      cardBackground: "#ffffff",
      codeBackground: "#f0fdf4",
      codeText: "#166534",
      accent: "#10b981"
    },
    radii: {
      card: "16px",
      button: "10px",
      input: "10px",
      badge: "9999px"
    }
  };
  function createBrandTheme(brandColor, isDark = false) {
    return {
      name: isDark ? "custom-brand-dark" : "custom-brand",
      colors: {
        primary: brandColor,
        primaryHover: brandColor,
        primaryText: "#ffffff",
        secondary: isDark ? "#1e293b" : "#f1f5f9",
        secondaryHover: isDark ? "#334155" : "#e2e8f0",
        secondaryText: isDark ? "#f8fafc" : "#0f172a",
        destructive: isDark ? "#f87171" : "#ef4444",
        destructiveHover: isDark ? "#ef4444" : "#dc2626",
        destructiveText: "#ffffff",
        background: isDark ? "#0f172a" : "#ffffff",
        surface: isDark ? "#1e293b" : "#ffffff",
        surfaceSubtle: isDark ? "#1e293b" : "#f8fafc",
        border: isDark ? "#334155" : "#e2e8f0",
        borderSubtle: isDark ? "#334155" : "#f1f5f9",
        text: isDark ? "#f8fafc" : "#0f172a",
        textMuted: isDark ? "#9ca3af" : "#64748b",
        textTertiary: isDark ? "#64748b" : "#94a3b8",
        cardBackground: isDark ? "#1e293b" : "#ffffff",
        codeBackground: isDark ? "#030712" : "#f1f5f9",
        codeText: isDark ? "#f3f4f6" : "#0f172a",
        accent: brandColor
      }
    };
  }

  // packages/web/src/custom/MarkdownCustomStyleRegistry.ts
  var MarkdownCustomStyleRegistry = class {
    customRenderers = /* @__PURE__ */ new Map();
    elementOverrides = /* @__PURE__ */ new Map();
    /**
     * Registers a custom style renderer (e.g. 'app:statCard', 'custom:splitOtp').
     */
    register(styleName, renderer) {
      this.customRenderers.set(styleName.toLowerCase(), renderer);
    }
    /**
     * Overrides the default renderer for any built-in block element
     * (e.g. 'card', 'action', 'metric', 'table', 'input').
     */
    override(elementKind, renderer) {
      this.elementOverrides.set(elementKind.toLowerCase(), renderer);
    }
    getRenderer(styleName) {
      return this.customRenderers.get(styleName.toLowerCase());
    }
    getOverride(elementKind) {
      return this.elementOverrides.get(elementKind.toLowerCase());
    }
    has(styleName) {
      return this.customRenderers.has(styleName.toLowerCase());
    }
    clear() {
      this.customRenderers.clear();
      this.elementOverrides.clear();
    }
  };
  var globalCustomStyleRegistry = new MarkdownCustomStyleRegistry();

  // packages/web/src/MarkdownView.ts
  var MarkdownView = class extends HTMLElement {
    static get observedAttributes() {
      return ["content", "src", "theme", "markdown-padding", "padding"];
    }
    _content = "";
    _values = {};
    _theme = defaultTheme;
    _classNames = {};
    _registry = globalCustomStyleRegistry;
    _markdownPadding = false;
    computedVariables = {};
    layout = new AdaptiveVerticalLayout();
    parser = new MarkdownSAXParser();
    cachedBlocks = [];
    isRendering = false;
    resetScroll = false;
    _isUserTouching = false;
    activeTimers = [];
    constructor() {
      super();
    }
    get content() {
      return this._content;
    }
    set content(val) {
      if (this._content !== val) {
        this._content = val;
        this.reparseAndRender();
      }
    }
    _streamRafId = null;
    /**
     * Appends an incremental token chunk during streaming.
     * Progressively parses and updates the DOM at 60fps with automatic fence balancing.
     */
    appendStreamChunk(chunk) {
      this._content = (this._content || "") + chunk;
      this.scheduleStreamRender();
    }
    /**
     * Sets the current cumulative streaming content buffer.
     */
    setStreamContent(partialMarkdown) {
      this._content = partialMarkdown;
      this.scheduleStreamRender();
    }
    /**
     * Concludes active streaming and renders the complete, finalized document.
     */
    endStream(finalMarkdown) {
      if (this._streamRafId !== null) {
        if (typeof cancelAnimationFrame !== "undefined") {
          cancelAnimationFrame(this._streamRafId);
        }
        this._streamRafId = null;
      }
      if (finalMarkdown !== void 0) {
        this._content = finalMarkdown;
      }
      this.reparseAndRender();
    }
    scheduleStreamRender() {
      if (this._streamRafId !== null) return;
      const raf = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : (fn) => setTimeout(fn, 16);
      this._streamRafId = raf(() => {
        this._streamRafId = null;
        if (!this._content) return;
        const balanced = MarkdownSAXParser.balanceStreamingFences(this._content);
        this.parser.setVariables(this._values);
        this.cachedBlocks = this.parser.parseToBlocks(balanced);
        this.render();
      });
    }
    handleWindowStreamMessage = (e) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "a-mdui:stream-chunk" && typeof e.data.chunk === "string") {
        this.appendStreamChunk(e.data.chunk);
      } else if (e.data.type === "a-mdui:stream-content" && typeof e.data.content === "string") {
        this.setStreamContent(e.data.content);
      } else if (e.data.type === "a-mdui:stream-end") {
        this.endStream(typeof e.data.content === "string" ? e.data.content : void 0);
      }
    };
    get values() {
      return { ...this._values };
    }
    set values(val) {
      this._values = { ...this.parser.getVariables(), ...val };
      this.recomputeVariables();
      this.updateLiveBindings();
    }
    get theme() {
      return this._theme;
    }
    set theme(val) {
      this._theme = val;
      applyTheme(this, this._theme);
      if (this._theme.name) {
        this.setAttribute("data-mdui-theme", this._theme.name);
        if (this._theme.name.includes("dark")) {
          this.classList.add("mdui-theme-dark");
          this.classList.remove("mdui-theme-light");
        } else {
          this.classList.remove("mdui-theme-dark");
          this.classList.add("mdui-theme-light");
        }
      }
      this.render();
    }
    get classNames() {
      return this._classNames;
    }
    set classNames(val) {
      this._classNames = val;
      this.render();
    }
    get registry() {
      return this._registry;
    }
    set registry(val) {
      this._registry = val;
      this.render();
    }
    get customRegistry() {
      return this._registry;
    }
    set customRegistry(val) {
      this._registry = val;
      this.render();
    }
    clearTimers() {
      for (const timer of this.activeTimers) {
        clearInterval(timer);
      }
      this.activeTimers = [];
      MarkdownConditionalView.clearTimers();
    }
    /**
     * Applies uniform or edge-specific padding to MarkdownView and registers it as the container inset
     * so child elements and bleed elements align and expand accurately (matching iOS .markdownPadding()).
     */
    markdownPadding(amount = 16) {
      this.applyMarkdownPadding(amount);
      return this;
    }
    get paddingValue() {
      return this._markdownPadding;
    }
    set paddingValue(val) {
      this.applyMarkdownPadding(val);
    }
    getMarkdownPadding() {
      return this._markdownPadding;
    }
    applyMarkdownPadding(val) {
      this._markdownPadding = val;
      if (val === false || val === "false" || val === "none") {
        this.style.padding = "";
        this.style.removeProperty("--mdui-container-padding");
        this.classList.remove("mdui-padded");
        if (this.getAttribute("markdown-padding") && this.getAttribute("markdown-padding") !== "false") {
          this.removeAttribute("markdown-padding");
        }
        return;
      }
      let padStr = "16px";
      if (val === true || val === "" || val === "true") {
        padStr = "16px";
      } else if (typeof val === "number") {
        padStr = `${val}px`;
      } else if (typeof val === "string") {
        padStr = val;
      } else if (typeof val === "object" && val !== null) {
        const top = typeof val.top === "number" ? `${val.top}px` : val.top ?? "0px";
        const right = typeof val.trailing === "number" ? `${val.trailing}px` : val.trailing ?? (typeof val.right === "number" ? `${val.right}px` : val.right ?? "0px");
        const bottom = typeof val.bottom === "number" ? `${val.bottom}px` : val.bottom ?? "0px";
        const left = typeof val.leading === "number" ? `${val.leading}px` : val.leading ?? (typeof val.left === "number" ? `${val.left}px` : val.left ?? "0px");
        padStr = `${top} ${right} ${bottom} ${left}`;
      }
      this.style.padding = padStr;
      this.style.setProperty("--mdui-container-padding", padStr);
      this.classList.add("mdui-padded");
      if (this.getAttribute("markdown-padding") !== padStr) {
        this.setAttribute("markdown-padding", padStr);
      }
    }
    onTouchStart = () => {
      this._isUserTouching = true;
    };
    onTouchEnd = () => {
      this._isUserTouching = false;
    };
    connectedCallback() {
      this.layout.attach(this);
      this.addEventListener("touchstart", this.onTouchStart, { passive: true });
      this.addEventListener("touchend", this.onTouchEnd, { passive: true });
      this.addEventListener("touchcancel", this.onTouchEnd, { passive: true });
      if (typeof window !== "undefined") {
        window.addEventListener("message", this.handleWindowStreamMessage);
      }
      applyTheme(this, this._theme);
      if (!this.hasAttribute("data-mdui-theme") && this._theme.name) {
        this.setAttribute("data-mdui-theme", this._theme.name);
      }
      if (this.hasAttribute("markdown-padding")) {
        const attr = this.getAttribute("markdown-padding");
        this.markdownPadding(attr !== null && attr !== "false" ? attr || true : false);
      } else if (this.hasAttribute("padding")) {
        const attr = this.getAttribute("padding");
        this.markdownPadding(attr !== null && attr !== "false" ? attr || true : false);
      }
      if (this.hasAttribute("content")) {
        this._content = this.getAttribute("content") || "";
      } else if (!this._content && this.textContent && this.textContent.trim()) {
        this._content = this.textContent.trim();
      }
      if (this.hasAttribute("src")) {
        this.fetchMarkdown(this.getAttribute("src"));
      } else {
        this.reparseAndRender();
      }
    }
    disconnectedCallback() {
      this.removeEventListener("touchstart", this.onTouchStart);
      this.removeEventListener("touchend", this.onTouchEnd);
      this.removeEventListener("touchcancel", this.onTouchEnd);
      if (typeof window !== "undefined") {
        window.removeEventListener("message", this.handleWindowStreamMessage);
      }
      if (this._streamRafId !== null) {
        if (typeof cancelAnimationFrame !== "undefined") {
          cancelAnimationFrame(this._streamRafId);
        }
        this._streamRafId = null;
      }
      this.clearTimers();
      this.layout.detach();
    }
    attributeChangedCallback(name, _oldVal, newVal) {
      if (name === "content") {
        this.content = newVal;
      } else if (name === "src" && newVal) {
        this.fetchMarkdown(newVal);
      } else if (name === "theme") {
        try {
          this.theme = JSON.parse(newVal);
        } catch {
          if (newVal === "dark" || newVal === "light") {
            this.setAttribute("data-mdui-theme", newVal);
            if (newVal === "dark") {
              this.classList.add("mdui-theme-dark");
              this.classList.remove("mdui-theme-light");
            } else {
              this.classList.remove("mdui-theme-dark");
              this.classList.add("mdui-theme-light");
            }
          }
        }
      } else if (name === "markdown-padding" || name === "padding") {
        if (newVal === null || newVal === "false") {
          this.markdownPadding(false);
        } else {
          this.markdownPadding(newVal || true);
        }
      }
    }
    isAllowedSrcUrl(urlStr) {
      if (!urlStr) return false;
      const trimmed = urlStr.trim().toLowerCase();
      if (trimmed.startsWith("javascript:") || trimmed.startsWith("file:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
        return false;
      }
      try {
        if (urlStr.startsWith("/") || urlStr.startsWith("./") || urlStr.startsWith("../")) {
          return true;
        }
        const parsed = new URL(urlStr, typeof window !== "undefined" ? window.location.href : "http://localhost");
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return false;
        }
        const host = parsed.hostname.toLowerCase();
        if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0" || host.startsWith("127.") || host.startsWith("169.254.") || host.startsWith("10.") || host.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
          if (typeof window !== "undefined" && parsed.origin === window.location.origin) {
            return true;
          }
          return false;
        }
        return true;
      } catch {
        return false;
      }
    }
    async fetchMarkdown(url) {
      if (!this.isAllowedSrcUrl(url)) {
        console.warn("[A-MDUI] Blocked unsafe or private src URL:", url);
        return;
      }
      try {
        const res = await fetch(url);
        if (res.ok) {
          this.content = await res.text();
        }
      } catch (e) {
        console.error("Failed to load markdown from src:", url, e);
      }
    }
    reparseAndRender() {
      this.clearTimers();
      if (!this._content) {
        this.innerHTML = "";
        return;
      }
      this.parser.setVariables(this._values);
      this.cachedBlocks = this.parser.parseToBlocks(this._content);
      const docVars = this.parser.getVariables();
      let hasNewVars = false;
      for (const [k, v] of Object.entries(docVars)) {
        if (!k.startsWith("__") && this._values[k] === void 0) {
          this._values[k] = v;
          hasNewVars = true;
        }
      }
      if (docVars["__rules__"]) {
        this._values["__rules__"] = docVars["__rules__"];
      }
      const computedMap = docVars["__computed_vars__"];
      if (computedMap) {
        this.computedVariables = { ...this.computedVariables, ...computedMap };
      }
      this.recomputeVariables();
      const inputs = this.collectAllInputs(this.cachedBlocks);
      for (const input of inputs) {
        if (input.defaultValue !== void 0 && this._values[input.id] === void 0) {
          this._values[input.id] = input.defaultValue;
          hasNewVars = true;
        }
      }
      this.collectPanels();
      this.render();
      if (/\{\{[^}]*\b(?:countdown|relativeTime|relative)\b[^}]*\}\}/i.test(this._content)) {
        const timerId = setInterval(() => {
          const activeEl = typeof document !== "undefined" ? document.activeElement : null;
          const hasFocusedInput = activeEl && this.contains(activeEl) && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT");
          if (!hasFocusedInput && !this._isUserTouching) {
            const changed = this.recomputeVariables();
            if (changed) {
              this.updateLiveBindings();
            }
          }
        }, 1e3);
        this.activeTimers.push(timerId);
      }
      if (hasNewVars) {
        this.dispatchEvent(new CustomEvent("valuesChange", {
          bubbles: true,
          composed: true,
          detail: { key: "@init", value: this._values, values: { ...this._values } }
        }));
      }
    }
    panels = {};
    collectPanels() {
      this.panels = {};
      for (const b of this.cachedBlocks) {
        if (b.kind === "panel" && b.panel) {
          this.panels[b.panel.id] = b;
        }
      }
    }
    openPanel(panelId) {
      const cleanId = panelId.replace(/^open-panel:|^panel:|^>>>\s*/, "").split(";")[0].trim();
      const panelBlock = this.panels[cleanId];
      if (!panelBlock && !this.querySelector(`.mdui-panel-overlay[data-panel="${cleanId}"]`)) {
        this.dispatchEvent(new CustomEvent("openPanel", {
          bubbles: true,
          composed: true,
          detail: { panelId: cleanId }
        }));
        return;
      }
      this.querySelectorAll(".mdui-panel-overlay").forEach((el) => el.remove());
      const displayMode = (panelBlock?.panel?.displayMode || panelBlock?.panel?.attributes?.displayMode || "sheet").toLowerCase();
      const overlay = document.createElement("div");
      overlay.className = `mdui-panel-overlay mdui-panel-${displayMode}-overlay`;
      overlay.setAttribute("data-panel", cleanId);
      const sheet = document.createElement("div");
      sheet.className = `mdui-panel-sheet mdui-panel-${displayMode}`;
      const header = document.createElement("div");
      header.className = "mdui-panel-header";
      const titleEl = document.createElement("h3");
      titleEl.className = "mdui-panel-title";
      titleEl.textContent = panelBlock?.panel?.title || panelBlock?.panel?.attributes?.title || cleanId;
      const closeBtn = document.createElement("button");
      closeBtn.className = "mdui-panel-close";
      closeBtn.innerHTML = "&times;";
      closeBtn.onclick = () => overlay.remove();
      header.appendChild(titleEl);
      header.appendChild(closeBtn);
      sheet.appendChild(header);
      const body = document.createElement("div");
      body.className = "mdui-panel-body";
      if (panelBlock && panelBlock.panel?.content) {
        const panelBlocks = this.parser.parseToBlocks(panelBlock.panel.content);
        for (const pb of panelBlocks) {
          body.appendChild(MarkdownBlockView.renderBlock({
            block: pb,
            state: this._values,
            onStateChange: (k, v) => this.handleStateChange(k, v),
            onAction: (act) => this.handleAction(act),
            theme: this._theme
          }));
        }
      } else if (panelBlock && panelBlock.children) {
        for (const child of panelBlock.children) {
          body.appendChild(MarkdownBlockView.renderBlock({
            block: child,
            state: this._values,
            onStateChange: (k, v) => this.handleStateChange(k, v),
            onAction: (act) => this.handleAction(act),
            theme: this._theme
          }));
        }
      }
      sheet.appendChild(body);
      overlay.appendChild(sheet);
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
      };
      this.appendChild(overlay);
      this.dispatchEvent(new CustomEvent("openPanel", {
        bubbles: true,
        composed: true,
        detail: { panelId: cleanId, panel: panelBlock?.panel }
      }));
    }
    captureScrollState() {
      const states = [];
      let curr = this;
      while (curr) {
        if (curr.scrollTop > 0 || curr.scrollLeft > 0) {
          states.push({ el: curr, top: curr.scrollTop, left: curr.scrollLeft });
        }
        curr = curr.parentElement;
      }
      if (typeof window !== "undefined") {
        const winTop = window.scrollY || document.documentElement?.scrollTop || document.body?.scrollTop || 0;
        const winLeft = window.scrollX || document.documentElement?.scrollLeft || document.body?.scrollLeft || 0;
        if (winTop > 0 || winLeft > 0) {
          states.push({ el: window, top: winTop, left: winLeft });
        }
      }
      return states;
    }
    restoreScrollState(states) {
      const apply = () => {
        for (const { el, top, left } of states) {
          if (el === window) {
            window.scrollTo(left, top);
          } else if ("scrollTop" in el) {
            el.scrollTop = top;
            el.scrollLeft = left;
          }
        }
      };
      apply();
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(apply);
      }
    }
    render() {
      if (this.isRendering) return;
      this.isRendering = true;
      const scrollStates = this.captureScrollState();
      const activeEl = typeof document !== "undefined" ? document.activeElement : null;
      const activeId = activeEl?.id || activeEl?.dataset?.inputKey;
      let selStart = 0;
      let selEnd = 0;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        try {
          selStart = activeEl.selectionStart || 0;
          selEnd = activeEl.selectionEnd || 0;
        } catch {
        }
      }
      const root = document.createElement("div");
      root.className = `mdui-root ${this._classNames.root || ""}`.trim();
      for (const block of this.cachedBlocks) {
        if (block.kind === "panel") continue;
        const el = MarkdownBlockView.renderBlock({
          block,
          state: this._values,
          onStateChange: (key, val) => this.handleStateChange(key, val),
          onAction: (act) => this.handleAction(act),
          validateForm: (scoped) => this.validateForm(scoped),
          registry: this._registry,
          theme: {
            ...this._theme,
            classNames: { ...this._theme.classNames, ...this._classNames }
          }
        });
        root.appendChild(el);
      }
      const activeOverlay = this.querySelector(".mdui-panel-overlay");
      if (typeof this.replaceChildren === "function") {
        this.replaceChildren(root);
      } else {
        this.innerHTML = "";
        this.appendChild(root);
      }
      if (activeOverlay) {
        this.appendChild(activeOverlay);
      }
      if (this.resetScroll) {
        this.resetScroll = false;
        if (typeof window !== "undefined") {
          window.scrollTo(0, 0);
        }
        this.scrollTop = 0;
        let currParent = this.parentElement;
        while (currParent) {
          if (currParent.scrollTop > 0) {
            currParent.scrollTop = 0;
          }
          currParent = currParent.parentElement;
        }
      } else {
        this.restoreScrollState(scrollStates);
      }
      if (activeId) {
        const elToFocus = this.querySelector(`#${activeId}`) || this.querySelector(`[data-input-key="${activeId}"]`);
        if (elToFocus && typeof elToFocus.focus === "function") {
          elToFocus.focus({ preventScroll: true });
          if ("setSelectionRange" in elToFocus && typeof elToFocus.setSelectionRange === "function") {
            try {
              elToFocus.setSelectionRange(selStart, selEnd);
            } catch {
            }
          }
        }
      }
      this.isRendering = false;
    }
    /**
     * Updates state live without resetting cursor focus.
     */
    handleStateChange(key, value) {
      this._values[key] = value;
      const arrayMatch = key.match(/^([\w.]+)\s*\[\s*([^\]]+)\s*\]\.([\w.]+)$/);
      if (arrayMatch) {
        const arrName = arrayMatch[1];
        const indexOrId = arrayMatch[2];
        const prop = arrayMatch[3];
        const arr = this._values[arrName];
        if (Array.isArray(arr)) {
          this._values[arrName] = arr.map((item, idx) => {
            if (item && typeof item === "object" && (item.id === indexOrId || String(item.id) === String(indexOrId) || item.key === indexOrId || !isNaN(Number(indexOrId)) && idx === Number(indexOrId))) {
              return { ...item, [prop]: value };
            }
            return item;
          });
        }
      } else if (key.includes(".")) {
        const parts = key.split(".");
        let cur = this._values;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!cur[parts[i]] || typeof cur[parts[i]] !== "object") {
            cur[parts[i]] = {};
          }
          cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = value;
      }
      this.recomputeVariables();
      this.dispatchEvent(new CustomEvent("valuesChange", {
        bubbles: true,
        composed: true,
        detail: { key, value, values: { ...this._values } }
      }));
      const wrapper = this.querySelector(`#wrapper_${key}`);
      if (wrapper) {
        wrapper.querySelector(".mdui-input-invalid")?.classList.remove("mdui-input-invalid");
        const err = wrapper.querySelector(".mdui-input-error");
        if (err) {
          err.textContent = "";
          err.style.display = "none";
        }
      }
      const isNavigationKey = key === "step" || key === "tab" || key === "page" || key === "view" || key === "activeTab" || key.endsWith("Step");
      if (isNavigationKey) {
        this.resetScroll = true;
      }
      this.updateLiveBindings();
    }
    recomputeVariables() {
      if (!this.computedVariables || Object.keys(this.computedVariables).length === 0) return false;
      let anyChanged = false;
      for (let pass = 0; pass < 5; pass++) {
        let changed = false;
        for (const [varName, formula] of Object.entries(this.computedVariables)) {
          const newVal = ExpressionEvaluator.evaluate(formula, this._values);
          if (newVal !== void 0 && newVal !== this._values[varName]) {
            this._values[varName] = newVal;
            changed = true;
            anyChanged = true;
          }
        }
        if (!changed) break;
      }
      return anyChanged;
    }
    handleAction(action) {
      this.dispatchEvent(new CustomEvent("telemetry", {
        bubbles: true,
        composed: true,
        detail: { component: "action", action: "click", id: action.id }
      }));
      const allTriggers = action.trigger.triggers && action.trigger.triggers.length > 0 ? action.trigger.triggers : [action.trigger];
      const sortedTriggers = [
        ...allTriggers.filter((t) => t.type === "set" || t.type === "toggle"),
        ...allTriggers.filter((t) => t.type !== "set" && t.type !== "toggle")
      ];
      for (const tr of sortedTriggers) {
        if (tr.type === "submit") {
          let scopedFields;
          if (action.attributes?.variables) {
            scopedFields = action.attributes.variables.split(",").map((s) => s.trim());
          }
          const validationRes = this.validateForm(scopedFields);
          if (!validationRes.valid) {
            this.dispatchEvent(new CustomEvent("validationError", {
              bubbles: true,
              composed: true,
              detail: {
                action,
                id: action.id,
                formId: tr.payload || action.id,
                values: { ...this._values },
                valid: false,
                errors: validationRes.errors
              }
            }));
            return;
          }
          this.dispatchEvent(new CustomEvent("submit", {
            bubbles: true,
            composed: true,
            detail: {
              action,
              id: action.id,
              formId: tr.payload || action.id,
              values: { ...this._values },
              valid: true,
              errors: {}
            }
          }));
        } else if (tr.type === "url") {
          const rawUrl = tr.payload || "";
          const url = TemplateInterpolator.interpolate(rawUrl, this._values).trim();
          const lowerUrl = url.toLowerCase();
          if (lowerUrl.startsWith("javascript:") || lowerUrl.startsWith("vbscript:") || lowerUrl.startsWith("data:text/html")) {
            console.warn("[A-MDUI] Blocked unsafe action URL scheme:", url);
            return;
          }
          if (typeof window !== "undefined" && url) {
            const target = action.attributes?.target || "_blank";
            window.open(url, target, "noopener,noreferrer");
          }
        } else if (tr.type === "open-panel") {
          this.openPanel(tr.payload);
        } else if (tr.type === "set") {
          if (tr.assignments && Object.keys(tr.assignments).length > 0) {
            for (const [k, v] of Object.entries(tr.assignments)) {
              const evaluated = this.evaluateActionValue(v);
              this.handleStateChange(k, evaluated);
            }
          } else if (tr.payload) {
            const eqIdx = tr.payload.indexOf("=");
            if (eqIdx !== -1) {
              const k = tr.payload.slice(0, eqIdx).trim();
              const v = tr.payload.slice(eqIdx + 1).trim();
              const evaluated = this.evaluateActionValue(v);
              this.handleStateChange(k, evaluated);
            }
          }
        } else if (tr.type === "toggle") {
          const key = tr.payload.trim();
          const arrayMatch = key.match(/^([\w.]+)\s*\[\s*([^\]]+)\s*\]\.([\w.]+)$/);
          if (arrayMatch) {
            const arrName = arrayMatch[1];
            const indexOrId = arrayMatch[2];
            const prop = arrayMatch[3];
            const arr = this._values[arrName];
            if (Array.isArray(arr)) {
              const item = arr.find(
                (it, idx) => it && (it.id === indexOrId || String(it.id) === String(indexOrId) || it.key === indexOrId || !isNaN(Number(indexOrId)) && idx === Number(indexOrId))
              );
              const cur = item ? Boolean(item[prop]) : false;
              this.handleStateChange(key, !cur);
            }
          } else {
            const cur = Boolean(this._values[key]);
            this.handleStateChange(key, !cur);
          }
        } else if (tr.type === "copy" || tr.type === "clipboard") {
          const textToCopy = TemplateInterpolator.interpolate(tr.payload || "", this._values);
          if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).catch(() => {
              this.copyFallback(textToCopy);
            });
          } else {
            this.copyFallback(textToCopy);
          }
          this.dispatchEvent(new CustomEvent("copy", {
            bubbles: true,
            composed: true,
            detail: { action, text: textToCopy }
          }));
        } else if (tr.type === "clear") {
          const key = tr.payload.trim();
          delete this._values[key];
          this.handleStateChange(key, void 0);
        } else if (tr.type === "insert" || tr.type === "insert-item") {
          let arrayKey = "";
          let itemPayload = "";
          const eqIdx = tr.payload.indexOf("=");
          const colonIdx = tr.payload.indexOf(":");
          if (eqIdx !== -1 && (colonIdx === -1 || eqIdx < colonIdx)) {
            arrayKey = tr.payload.slice(0, eqIdx).trim();
            itemPayload = tr.payload.slice(eqIdx + 1).trim();
          } else if (colonIdx !== -1) {
            arrayKey = tr.payload.slice(0, colonIdx).trim();
            itemPayload = tr.payload.slice(colonIdx + 1).trim();
          }
          if (arrayKey && itemPayload) {
            const evaluated = this.evaluateActionPayload(itemPayload);
            const isEmptyString = typeof evaluated === "string" && evaluated.trim() === "";
            const isEmptyObj = evaluated !== null && typeof evaluated === "object" && !Array.isArray(evaluated) && (typeof evaluated.title === "string" && evaluated.title.trim() === "" || typeof evaluated.name === "string" && evaluated.name.trim() === "");
            if (!isEmptyString && !isEmptyObj && evaluated !== void 0 && evaluated !== null) {
              const existing = this._values[arrayKey];
              const arr = Array.isArray(existing) ? [...existing] : [];
              arr.push(evaluated);
              this.handleStateChange(arrayKey, arr);
            }
          }
        } else if (tr.type === "delete" || tr.type === "remove-item") {
          let arrayKey = "";
          let matchTarget = "";
          const bracketOpen = tr.payload.indexOf("[");
          const bracketClose = tr.payload.lastIndexOf("]");
          const parenOpen = tr.payload.indexOf("(");
          const parenClose = tr.payload.lastIndexOf(")");
          const eqIdx = tr.payload.indexOf("=");
          const colonIdx = tr.payload.indexOf(":");
          if (bracketOpen !== -1 && bracketClose > bracketOpen) {
            arrayKey = tr.payload.slice(0, bracketOpen).trim();
            matchTarget = tr.payload.slice(bracketOpen + 1, bracketClose).trim();
          } else if (parenOpen !== -1 && parenClose > parenOpen) {
            arrayKey = tr.payload.slice(0, parenOpen).trim();
            matchTarget = tr.payload.slice(parenOpen + 1, parenClose).trim();
          } else if (eqIdx !== -1) {
            arrayKey = tr.payload.slice(0, eqIdx).trim();
            matchTarget = tr.payload.slice(eqIdx + 1).trim();
          } else if (colonIdx !== -1) {
            arrayKey = tr.payload.slice(0, colonIdx).trim();
            matchTarget = tr.payload.slice(colonIdx + 1).trim();
          }
          if (arrayKey && matchTarget) {
            let resolved = matchTarget;
            if (matchTarget.startsWith("$")) {
              const varVal = this._values[matchTarget.slice(1)];
              if (varVal !== void 0) resolved = String(varVal);
            }
            const cleanTarget = resolved.replace(/^["']|["']$/g, "").trim();
            const existing = this._values[arrayKey];
            if (Array.isArray(existing)) {
              const arr = [...existing];
              const numIdx = Number(cleanTarget);
              if (!isNaN(numIdx) && cleanTarget !== "" && numIdx >= 0 && numIdx < arr.length) {
                arr.splice(numIdx, 1);
              } else {
                const foundIdx = arr.findIndex((it) => {
                  if (it && typeof it === "object") {
                    const anyIt = it;
                    return anyIt.id === cleanTarget || String(anyIt.id) === cleanTarget || anyIt.taskId === cleanTarget || anyIt.key === cleanTarget || Object.values(anyIt).some((val) => String(val) === cleanTarget);
                  }
                  return String(it) === cleanTarget;
                });
                if (foundIdx !== -1) {
                  arr.splice(foundIdx, 1);
                }
              }
              this.handleStateChange(arrayKey, arr);
            }
          }
        }
      }
      this.dispatchEvent(new CustomEvent("action", {
        bubbles: true,
        composed: true,
        detail: action
      }));
    }
    copyFallback(text) {
      if (typeof document === "undefined") return;
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch {
      }
      document.body.removeChild(textArea);
    }
    evaluateActionPayload(raw) {
      const trimmed = raw.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const inner = trimmed.slice(1, -1).trim();
        if (!inner) return {};
        const pairs = this.splitTopLevel(inner, ",");
        const obj = {};
        for (const pair of pairs) {
          const colon = this.firstUnquotedColon(pair);
          if (colon !== -1) {
            const k = pair.slice(0, colon).trim().replace(/^["']|["']$/g, "");
            const vStr = pair.slice(colon + 1).trim();
            if (k) {
              obj[k] = this.evaluateActionPayload(vStr);
            }
          }
        }
        return obj;
      }
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const inner = trimmed.slice(1, -1).trim();
        if (!inner) return [];
        const items = this.splitTopLevel(inner, ",");
        return items.map((it) => this.evaluateActionPayload(it.trim()));
      }
      return this.evaluateActionValue(trimmed);
    }
    evaluateActionValue(token) {
      const trimmed = token.trim();
      if (!trimmed) return "";
      if (trimmed.toLowerCase() === "uuid()") {
        return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          return (c === "x" ? r : r & 3 | 8).toString(16);
        });
      }
      if (trimmed.toLowerCase() === "now()") {
        return (/* @__PURE__ */ new Date()).toISOString();
      }
      if (trimmed.toLowerCase() === "true") return true;
      if (trimmed.toLowerCase() === "false") return false;
      if (trimmed.startsWith('"') && trimmed.endsWith('"') || trimmed.startsWith("'") && trimmed.endsWith("'")) {
        const rawStr = trimmed.slice(1, -1);
        const replaced = rawStr.replace(/\$\{?([a-zA-Z0-9_.$@]+)\}?/g, (_, varName) => {
          const cleanVar = varName.replace(/^[$@]/, "");
          const val = this._values[cleanVar];
          return val !== void 0 ? String(val) : "";
        });
        return TemplateInterpolator.interpolate(replaced, this._values);
      }
      if (!isNaN(Number(trimmed)) && trimmed !== "") {
        return Number(trimmed);
      }
      const plusMatch = trimmed.match(/^([\w$@.]+)\s*\+\s*([\d.]+)$/);
      const minusMatch = trimmed.match(/^([\w$@.]+)\s*-\s*([\d.]+)$/);
      if (plusMatch) {
        const varName = plusMatch[1].replace(/^[$@]/, "");
        const cur = Number(this._values[varName] ?? 0);
        return cur + Number(plusMatch[2]);
      }
      if (minusMatch) {
        const varName = minusMatch[1].replace(/^[$@]/, "");
        const cur = Number(this._values[varName] ?? 0);
        return cur - Number(minusMatch[2]);
      }
      try {
        const evalRes = ExpressionEvaluator.evaluate(trimmed, this._values);
        if (evalRes !== void 0 && evalRes !== trimmed) {
          return evalRes;
        }
      } catch {
      }
      const cleanKey = trimmed.replace(/^[$@]/, "");
      if (this._values[cleanKey] !== void 0) {
        return this._values[cleanKey];
      }
      return trimmed;
    }
    splitTopLevel(str, delimiter) {
      const parts = [];
      let current = "";
      let inQuote = false;
      let quoteChar = "";
      let braceDepth = 0;
      let bracketDepth = 0;
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if ((ch === '"' || ch === "'") && (i === 0 || str[i - 1] !== "\\")) {
          if (!inQuote) {
            inQuote = true;
            quoteChar = ch;
          } else if (ch === quoteChar) {
            inQuote = false;
          }
        } else if (!inQuote) {
          if (ch === "{") braceDepth++;
          else if (ch === "}") braceDepth--;
          else if (ch === "[") bracketDepth++;
          else if (ch === "]") bracketDepth--;
        }
        if (ch === delimiter && !inQuote && braceDepth === 0 && bracketDepth === 0) {
          parts.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      if (current.trim()) parts.push(current.trim());
      return parts;
    }
    firstUnquotedColon(str) {
      let inQuote = false;
      let quoteChar = "";
      let braceDepth = 0;
      let bracketDepth = 0;
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if ((ch === '"' || ch === "'") && (i === 0 || str[i - 1] !== "\\")) {
          if (!inQuote) {
            inQuote = true;
            quoteChar = ch;
          } else if (ch === quoteChar) {
            inQuote = false;
          }
        } else if (!inQuote) {
          if (ch === "{") braceDepth++;
          else if (ch === "}") braceDepth--;
          else if (ch === "[") bracketDepth++;
          else if (ch === "]") bracketDepth--;
        }
        if (ch === ":" && !inQuote && braceDepth === 0 && bracketDepth === 0) {
          return i;
        }
      }
      return -1;
    }
    collectAllInputs(blocks) {
      const inputs = [];
      const walk = (b) => {
        if (b.kind === "input" && b.input) {
          inputs.push(b.input);
        }
        if (b.children && b.children.length > 0) {
          for (const child of b.children) {
            walk(child);
          }
        }
        if (b.elseChildren && b.elseChildren.length > 0) {
          for (const child of b.elseChildren) {
            walk(child);
          }
        }
        if (b.defaultChildren && b.defaultChildren.length > 0) {
          for (const child of b.defaultChildren) {
            walk(child);
          }
        }
        if (b.switchCases && b.switchCases.length > 0) {
          for (const sc of b.switchCases) {
            if (sc.children && sc.children.length > 0) {
              for (const child of sc.children) {
                walk(child);
              }
            }
          }
        }
      };
      for (const b of blocks) {
        walk(b);
      }
      return inputs;
    }
    validateForm(scopedFields) {
      const inputs = MarkdownValidationEngine.collectActiveInputs(this.cachedBlocks, this._values);
      const docRules = this._values["__rules__"] && typeof this._values["__rules__"] === "object" ? this._values["__rules__"] : void 0;
      const res = MarkdownValidationEngine.validateAll(this.cachedBlocks, this._values, docRules, scopedFields);
      for (const input of inputs) {
        const wrapper = this.querySelector(`#wrapper_${input.id}`);
        if (!wrapper) continue;
        const control = wrapper.querySelector(".mdui-input-control") || wrapper.querySelector(".mdui-selection-card") || wrapper.querySelector(".mdui-selection-label") || wrapper;
        const errorMsg = res.errors[input.id] || (input.group ? res.errors[input.group] : void 0);
        let errorEl = wrapper.querySelector(".mdui-input-error");
        if (errorMsg) {
          control.classList.add("mdui-input-invalid");
          if (!errorEl) {
            errorEl = document.createElement("div");
            errorEl.className = "mdui-input-error";
            wrapper.appendChild(errorEl);
          }
          errorEl.textContent = errorMsg;
          errorEl.style.display = "block";
        } else if (!scopedFields || scopedFields.includes(input.id) || input.group && scopedFields.includes(input.group)) {
          control.classList.remove("mdui-input-invalid");
          if (errorEl) {
            errorEl.textContent = "";
            errorEl.style.display = "none";
          }
        }
      }
      return res;
    }
    /**
     * Updates conditional blocks, interpolations, and live expressions
     * without re-parsing the AST.
     */
    _renderPending = false;
    updateLiveBindings() {
      if (this._renderPending) return;
      this._renderPending = true;
      const schedule = typeof queueMicrotask === "function" ? queueMicrotask : (fn) => setTimeout(fn, 0);
      schedule(() => {
        this._renderPending = false;
        this.render();
      });
    }
  };
  if (typeof customElements !== "undefined") {
    if (!customElements.get("a-mdui")) {
      customElements.define("a-mdui", MarkdownView);
    }
    if (!customElements.get("markdown-view")) {
      class LegacyMarkdownView extends MarkdownView {
      }
      customElements.define("markdown-view", LegacyMarkdownView);
    }
  }

  // packages/web/src/adaptive/AdaptiveFlexLayout.ts
  var AdaptiveFlexLayout = class {
    static apply(container) {
      container.classList.add("mdui-auto");
    }
  };

  // packages/web/src/adaptive/AdaptiveGridLayout.ts
  var AdaptiveGridLayout = class {
    static apply(container) {
      container.classList.add("mdui-grid");
    }
  };

  // packages/web/src/adaptive/AdaptiveFlowLayout.ts
  var AdaptiveFlowLayout = class {
    static apply(container) {
      container.classList.add("mdui-flow");
    }
  };

  // packages/web/src/components/AdaptiveDataView.ts
  function normalizeRow(row, headers) {
    if (Array.isArray(row)) return row;
    return headers.map((header) => row[header] ?? "\u2014");
  }
  var AdaptiveDataView = class {
    static render(props) {
      const {
        headers,
        rows,
        compactBreakpoint = 600,
        className = "",
        cardClassName = ""
      } = props;
      const container = document.createElement("div");
      container.className = `mdui-adaptive-data-view ${className}`.trim();
      container.style.width = "100%";
      const normalizedRows = rows.map((r) => normalizeRow(r, headers));
      const tableWrap = document.createElement("div");
      tableWrap.className = "mdui-table-wrapper";
      const table = document.createElement("table");
      table.className = "mdui-table";
      const thead = document.createElement("thead");
      thead.className = "mdui-table-thead";
      const headerTr = document.createElement("tr");
      headerTr.className = "mdui-table-header-row";
      headers.forEach((h) => {
        const th = document.createElement("th");
        th.className = "mdui-table-th";
        th.textContent = h;
        headerTr.appendChild(th);
      });
      thead.appendChild(headerTr);
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      tbody.className = "mdui-table-tbody";
      normalizedRows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.className = "mdui-table-row";
        headers.forEach((h, colIdx) => {
          const td = document.createElement("td");
          td.className = "mdui-table-td";
          td.setAttribute("data-header", h);
          const cellSpan = document.createElement("span");
          cellSpan.className = "mdui-table-cell-content";
          cellSpan.textContent = row[colIdx] ?? "\u2014";
          td.appendChild(cellSpan);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      const cardStack = document.createElement("div");
      cardStack.className = `mdui-card-stack ${cardClassName}`.trim();
      normalizedRows.forEach((row) => {
        const card = document.createElement("div");
        card.className = "mdui-data-card";
        const firstHeader = headers[0] ?? "";
        const firstVal = row[0] ?? "";
        if (firstVal) {
          const cardTitle = document.createElement("div");
          cardTitle.className = "mdui-data-card-title";
          const badgeSpan = document.createElement("span");
          badgeSpan.className = "mdui-data-card-badge";
          badgeSpan.textContent = firstHeader;
          const valSpan = document.createElement("span");
          valSpan.className = "mdui-data-card-main-val";
          valSpan.textContent = firstVal;
          cardTitle.appendChild(badgeSpan);
          cardTitle.appendChild(valSpan);
          card.appendChild(cardTitle);
        }
        const rowsContainer = document.createElement("div");
        rowsContainer.className = "mdui-data-card-rows";
        for (let i = 1; i < headers.length; i++) {
          const itemRow = document.createElement("div");
          itemRow.className = "mdui-data-card-item";
          const label = document.createElement("span");
          label.className = "mdui-data-card-label";
          label.textContent = headers[i];
          const value = document.createElement("span");
          value.className = "mdui-data-card-value";
          value.textContent = row[i] ?? "\u2014";
          itemRow.appendChild(label);
          itemRow.appendChild(value);
          rowsContainer.appendChild(itemRow);
        }
        card.appendChild(rowsContainer);
        cardStack.appendChild(card);
      });
      container.appendChild(tableWrap);
      container.appendChild(cardStack);
      const updateView = (width) => {
        if (width < compactBreakpoint) {
          tableWrap.style.display = "none";
          cardStack.style.display = "flex";
        } else {
          tableWrap.style.display = "block";
          cardStack.style.display = "none";
        }
      };
      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            updateView(entry.contentRect.width);
          }
        });
        observer.observe(container);
      } else {
        updateView(window.innerWidth);
      }
      return container;
    }
  };

  // packages/web/src/bundle.ts
  var AMarkdownUI = {
    ...dist_exports,
    ...index_exports
  };
  if (typeof window !== "undefined") {
    window.AMarkdownUI = AMarkdownUI;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.AMarkdownUI = AMarkdownUI;
  }
  var bundle_default = AMarkdownUI;
})();
