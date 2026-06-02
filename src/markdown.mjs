const TOKEN_START = "\uE000";
const TOKEN_END = "\uE001";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stashToken(tokens, html) {
  const index = tokens.length;
  tokens.push(html);
  return `${TOKEN_START}${index}${TOKEN_END}`;
}

function restoreTokens(value, tokens) {
  let previous = "";
  let next = value;
  const tokenPattern = new RegExp(`${TOKEN_START}(\\d+)${TOKEN_END}`, "g");

  while (next !== previous) {
    previous = next;
    next = next.replace(tokenPattern, (match, index) => {
      return tokens[Number(index)] ?? match;
    });
  }

  return next;
}

function applyInlineRule(value, tokens, pattern, render) {
  return value.replace(pattern, (...args) => {
    const match = args[0];
    const html = render(...args);

    return html === match ? match : stashToken(tokens, html);
  });
}

export function renderInlineMarkdown(value) {
  const tokens = [];
  let html = escapeHtml(value).replace(/\r\n?/g, "\n").replace(/\n+/g, " ");

  html = applyInlineRule(html, tokens, /`([^`]+)`/g, (_, content) => {
    return `<code>${content}</code>`;
  });
  html = applyInlineRule(
    html,
    tokens,
    /\[([^\][]+)\]\(([^)\s]+)\)/g,
    (_, label) => {
      return `<span class="md-link">${label}</span>`;
    },
  );
  html = applyInlineRule(html, tokens, /~~([^~]+)~~/g, (_, content) => {
    return `<s>${content}</s>`;
  });
  html = applyInlineRule(html, tokens, /\*\*([^*]+)\*\*/g, (_, content) => {
    return `<strong>${content}</strong>`;
  });
  html = applyInlineRule(html, tokens, /__([^_]+)__/g, (_, content) => {
    return `<strong>${content}</strong>`;
  });
  html = applyInlineRule(html, tokens, /\*([^*]+)\*/g, (_, content) => {
    return `<em>${content}</em>`;
  });
  html = applyInlineRule(html, tokens, /_([^_]+)_/g, (_, content) => {
    return `<em>${content}</em>`;
  });

  return restoreTokens(html, tokens);
}
