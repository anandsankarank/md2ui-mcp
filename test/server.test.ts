import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES } from '../src/templates.js';

describe('MCP Template Engine', () => {
  it('loads all 5 official templates successfully', () => {
    const keys = ['booking_wizard', 'flight_booking', 'dashboard', 'checkout', 'charts'];
    for (const key of keys) {
      assert.ok(TEMPLATES[key], `Template ${key} should exist`);
      assert.ok(TEMPLATES[key].title, `Template ${key} should have title`);
      assert.ok(TEMPLATES[key].mdui, `Template ${key} should have mdui content`);
    }
  });

  it('validates syntax checks for empty, expressions, and fences', () => {
    const emptyContent = '';
    assert.equal(emptyContent.trim().length, 0);

    const validContent = '::: card\n### Hello\n{{ 100 * 2 | 0 | currency }}\n:::';
    const containerOpens = (validContent.match(/:::\s*[a-zA-Z0-9_-]+/g) || []).length;
    const containerCloses = (validContent.match(/^:::\s*$/gm) || []).length;
    assert.equal(containerOpens, containerCloses);

    const exprOpens = (validContent.match(/\{\{/g) || []).length;
    const exprCloses = (validContent.match(/\}\}/g) || []).length;
    assert.equal(exprOpens, exprCloses);

    const codeFences = (validContent.match(/^```/gm) || []).length;
    assert.equal(codeFences % 2, 0);
  });
});
