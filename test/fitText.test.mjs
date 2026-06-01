import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_MARQUEE_SPEED,
  DEFAULT_SIGN_COLOR,
  findLargestFittingFontSize,
  fitHorizontalTextToContainer,
  getAdjacentMarqueeSpeed,
  normalizeMessage,
  resolveMarqueeSpeed,
  resolveSignColor,
  resolveSignColorPreset,
} from "../src/fitText.mjs";

test("findLargestFittingFontSize returns the largest size accepted by the fit predicate", () => {
  const result = findLargestFittingFontSize({
    min: 8,
    max: 220,
    fits: (size) => size <= 137,
  });

  assert.equal(result, 137);
});

test("findLargestFittingFontSize keeps the configured minimum when nothing fits", () => {
  const result = findLargestFittingFontSize({
    min: 12,
    max: 72,
    fits: () => false,
  });

  assert.equal(result, 12);
});

test("normalizeMessage trims outside whitespace while preserving meaningful line breaks", () => {
  assert.equal(normalizeMessage("  LED 켜줘  "), "LED 켜줘");
  assert.equal(normalizeMessage("  첫 줄\n둘째 줄  "), "첫 줄\n둘째 줄");
  assert.equal(normalizeMessage("  \n  "), "");
});

test("fitHorizontalTextToContainer maximizes text size against sign height", () => {
  const textElement = {
    style: {},
    scrollWidth: 280,
    get scrollHeight() {
      return Number.parseInt(this.style.fontSize, 10);
    },
  };
  const containerElement = { clientWidth: 360, clientHeight: 96 };

  const result = fitHorizontalTextToContainer({
    textElement,
    containerElement,
    min: 12,
    max: 200,
  });

  assert.equal(result.fontSize, 96);
  assert.equal(result.shouldScroll, false);
  assert.equal(textElement.style.fontSize, "96px");
});

test("fitHorizontalTextToContainer scrolls horizontally when text is wider than the sign", () => {
  const textElement = {
    style: {},
    scrollWidth: 920,
    get scrollHeight() {
      return Number.parseInt(this.style.fontSize, 10);
    },
  };
  const containerElement = { clientWidth: 320, clientHeight: 80 };

  const result = fitHorizontalTextToContainer({
    textElement,
    containerElement,
    min: 12,
    max: 180,
  });

  assert.equal(result.fontSize, 80);
  assert.equal(result.shouldScroll, true);
  assert.equal(result.direction, "left");
  assert.equal(result.overflowWidth, 920);
  assert.equal(textElement.style.animationDuration, "7.2s");
  assert.equal(textElement.style["--marquee-start"], "320px");
  assert.equal(textElement.style["--marquee-end"], "-920px");
});

test("fitHorizontalTextToContainer applies marquee speed multipliers", () => {
  const textElement = {
    style: {},
    scrollWidth: 920,
    get scrollHeight() {
      return Number.parseInt(this.style.fontSize, 10);
    },
  };
  const containerElement = { clientWidth: 320, clientHeight: 80 };

  fitHorizontalTextToContainer({
    textElement,
    containerElement,
    min: 12,
    max: 180,
    speed: 1,
  });
  assert.equal(textElement.style.animationDuration, "14.4s");

  fitHorizontalTextToContainer({
    textElement,
    containerElement,
    min: 12,
    max: 180,
    speed: 0.8,
  });
  assert.equal(textElement.style.animationDuration, "18s");

  fitHorizontalTextToContainer({
    textElement,
    containerElement,
    min: 12,
    max: 180,
    speed: 3,
  });
  assert.equal(textElement.style.animationDuration, "4.8s");
});

test("fitHorizontalTextToContainer shrinks short overflow text instead of scrolling", () => {
  const textElement = {
    style: {},
    get scrollWidth() {
      return Number.parseInt(this.style.fontSize, 10) * 4;
    },
    get scrollHeight() {
      return Number.parseInt(this.style.fontSize, 10);
    },
  };
  const containerElement = { clientWidth: 320, clientHeight: 100 };

  const result = fitHorizontalTextToContainer({
    textElement,
    containerElement,
    min: 12,
    max: 200,
  });

  assert.equal(result.fontSize, 80);
  assert.equal(result.shouldScroll, false);
  assert.equal(textElement.style.fontSize, "80px");
});

test("fitHorizontalTextToContainer keeps tall text and scrolls when width fitting would be tiny", () => {
  const textElement = {
    style: {},
    get scrollWidth() {
      return Number.parseInt(this.style.fontSize, 10) * 20;
    },
    get scrollHeight() {
      return Number.parseInt(this.style.fontSize, 10);
    },
  };
  const containerElement = { clientWidth: 320, clientHeight: 100 };

  const result = fitHorizontalTextToContainer({
    textElement,
    containerElement,
    min: 12,
    max: 200,
  });

  assert.equal(result.fontSize, 100);
  assert.equal(result.shouldScroll, true);
});

test("fitHorizontalTextToContainer caps very long marquee duration", () => {
  const textElement = {
    style: {},
    scrollWidth: 12000,
    get scrollHeight() {
      return Number.parseInt(this.style.fontSize, 10);
    },
  };
  const containerElement = { clientWidth: 844, clientHeight: 370 };

  fitHorizontalTextToContainer({
    textElement,
    containerElement,
    min: 12,
    max: 600,
  });

  assert.equal(textElement.style.animationDuration, "24s");
});

test("resolveSignColor defaults to lime and only accepts known sign colors", () => {
  assert.equal(DEFAULT_SIGN_COLOR, "#b7ff00");
  assert.equal(resolveSignColor(), "#b7ff00");
  assert.equal(resolveSignColor("#26f1ff"), "#26f1ff");
  assert.equal(resolveSignColor("#123456"), "#b7ff00");
});

test("resolveSignColorPreset returns explicit mobile-safe color variables", () => {
  assert.deepEqual(resolveSignColorPreset("#26f1ff"), {
    name: "cyan",
    value: "#26f1ff",
    rgb: "38, 241, 255",
    contrast: "#050505",
  });
  assert.equal(resolveSignColorPreset("#123456").value, DEFAULT_SIGN_COLOR);
});

test("resolveMarqueeSpeed defaults to 2x and only accepts known speeds", () => {
  assert.equal(DEFAULT_MARQUEE_SPEED, 2);
  assert.equal(resolveMarqueeSpeed(), 2);
  assert.equal(resolveMarqueeSpeed("0.8"), 0.8);
  assert.equal(resolveMarqueeSpeed("1.5"), 1.5);
  assert.equal(resolveMarqueeSpeed("7"), 2);
});

test("getAdjacentMarqueeSpeed steps through speed presets without leaving bounds", () => {
  assert.equal(getAdjacentMarqueeSpeed(2, -1), 1.5);
  assert.equal(getAdjacentMarqueeSpeed(2, 1), 3);
  assert.equal(getAdjacentMarqueeSpeed(0.8, -1), 0.8);
  assert.equal(getAdjacentMarqueeSpeed(3, 1), 3);
  assert.equal(getAdjacentMarqueeSpeed("7", -1), 1.5);
});
