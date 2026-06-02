import assert from "node:assert/strict";
import test from "node:test";

import {
  escapeHtml,
  renderInlineMarkdown,
} from "../src/markdown.mjs";

test("escapeHtml converts user HTML into display text", () => {
  assert.equal(
    escapeHtml(`<script>alert("x")</script>`),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
  );
});

test("renderInlineMarkdown supports LED-friendly inline markdown", () => {
  assert.equal(
    renderInlineMarkdown("**BOLD** _ITALIC_ ~~OLD~~ `CODE`"),
    "<strong>BOLD</strong> <em>ITALIC</em> <s>OLD</s> <code>CODE</code>",
  );
});

test("renderInlineMarkdown displays link labels without making the sign navigable", () => {
  assert.equal(
    renderInlineMarkdown("[HOME](https://example.com)"),
    '<span class="md-link">HOME</span>',
  );
});

test("renderInlineMarkdown collapses line breaks into a single marquee line", () => {
  assert.equal(renderInlineMarkdown("첫 줄\n둘째 줄"), "첫 줄 둘째 줄");
});

test("renderInlineMarkdown escapes HTML before applying markdown", () => {
  assert.equal(
    renderInlineMarkdown("<script>alert(1)</script> **OK**"),
    "&lt;script&gt;alert(1)&lt;/script&gt; <strong>OK</strong>",
  );
});

test("renderInlineMarkdown preserves user text that resembles internal tokens", () => {
  const userText = `${String.fromCharCode(0xe000)}99${String.fromCharCode(0xe001)}`;

  assert.equal(
    renderInlineMarkdown(`${userText} **OK**`),
    `${userText} <strong>OK</strong>`,
  );
});
