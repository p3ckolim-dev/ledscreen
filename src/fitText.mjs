export const SIGN_COLOR_PRESETS = [
  { name: "lime", value: "#b7ff00", rgb: "183, 255, 0", contrast: "#050505" },
  { name: "red", value: "#ff2d2d", rgb: "255, 45, 45", contrast: "#050505" },
  { name: "amber", value: "#ffc247", rgb: "255, 194, 71", contrast: "#050505" },
  { name: "cyan", value: "#26f1ff", rgb: "38, 241, 255", contrast: "#050505" },
  { name: "pink", value: "#ff4fd8", rgb: "255, 79, 216", contrast: "#050505" },
  { name: "white", value: "#f7f7f2", rgb: "247, 247, 242", contrast: "#050505" },
];

export const DEFAULT_SIGN_COLOR = SIGN_COLOR_PRESETS[0].value;
export const MARQUEE_SPEED_PRESETS = [0.8, 1, 1.5, 2, 3];
export const DEFAULT_MARQUEE_SPEED = 3;

export function findLargestFittingFontSize({ min = 4, max = 960, fits }) {
  if (typeof fits !== "function") {
    throw new TypeError("fits must be a function");
  }

  const floorMin = Math.max(1, Math.floor(min));
  let low = floorMin;
  let high = Math.max(floorMin, Math.floor(max));
  let best = floorMin;

  while (low <= high) {
    const size = Math.floor((low + high) / 2);

    if (fits(size)) {
      best = size;
      low = size + 1;
    } else {
      high = size - 1;
    }
  }

  return best;
}

export function normalizeMessage(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();
}

export function resolveSignColor(value) {
  return resolveSignColorPreset(value).value;
}

export function resolveSignColorPreset(value) {
  return (
    SIGN_COLOR_PRESETS.find((preset) => preset.value === value) ??
    SIGN_COLOR_PRESETS[0]
  );
}

export function resolveMarqueeSpeed(value) {
  const speed = Number(value);
  return MARQUEE_SPEED_PRESETS.includes(speed) ? speed : DEFAULT_MARQUEE_SPEED;
}

export function getAdjacentMarqueeSpeed(value, direction) {
  const speed = resolveMarqueeSpeed(value);
  const currentIndex = MARQUEE_SPEED_PRESETS.indexOf(speed);
  const nextIndex =
    direction < 0
      ? Math.max(0, currentIndex - 1)
      : Math.min(MARQUEE_SPEED_PRESETS.length - 1, currentIndex + 1);

  return MARQUEE_SPEED_PRESETS[nextIndex];
}

function assignStyle(style, name, value) {
  if (typeof style.setProperty === "function" && name.startsWith("--")) {
    style.setProperty(name, value);
    return;
  }

  style[name] = value;
}

function formatSeconds(value) {
  return `${Math.round(value * 10) / 10}s`;
}

export function fitHorizontalTextToContainer({
  textElement,
  containerElement,
  min = 4,
  max = 960,
  speed = DEFAULT_MARQUEE_SPEED,
}) {
  if (!textElement || !containerElement) {
    return {
      fontSize: 0,
      direction: "left",
      shouldScroll: false,
      overflowWidth: 0,
    };
  }

  const width = containerElement.clientWidth;
  const height = containerElement.clientHeight;

  if (width <= 0 || height <= 0) {
    return {
      fontSize: 0,
      direction: "left",
      shouldScroll: false,
      overflowWidth: 0,
    };
  }

  const cappedMax = Math.max(min, Math.min(max, Math.ceil(height * 1.35)));
  const fitsHeight = (size) => {
    textElement.style.fontSize = `${size}px`;
    return textElement.scrollHeight <= height;
  };

  const fontSize = findLargestFittingFontSize({
    min,
    max: cappedMax,
    fits: fitsHeight,
  });

  textElement.style.fontSize = `${fontSize}px`;

  const widthAtHeight = textElement.scrollWidth;
  const fitsBoth = (size) => {
    textElement.style.fontSize = `${size}px`;
    return textElement.scrollHeight <= height && textElement.scrollWidth <= width + 1;
  };
  const widthFitFontSize = findLargestFittingFontSize({
    min,
    max: fontSize,
    fits: fitsBoth,
  });
  const canFitBoth = fitsBoth(widthFitFontSize);
  const shouldScroll =
    widthAtHeight > width + 1 && (!canFitBoth || widthFitFontSize < fontSize * 0.58);
  const finalFontSize = shouldScroll ? fontSize : widthFitFontSize;

  textElement.style.fontSize = `${finalFontSize}px`;

  const overflowWidth = textElement.scrollWidth;
  const baseDuration = Math.min(48, Math.max(8, (overflowWidth + width) / 86));
  const duration = formatSeconds(baseDuration / resolveMarqueeSpeed(speed));

  textElement.style.animationDuration = shouldScroll ? duration : "";
  assignStyle(textElement.style, "--marquee-start", `${width}px`);
  assignStyle(textElement.style, "--marquee-end", `-${overflowWidth}px`);
  assignStyle(textElement.style, "--marquee-distance", `${overflowWidth + width}px`);
  assignStyle(textElement.style, "--marquee-duration", duration);

  return {
    fontSize: finalFontSize,
    direction: "left",
    shouldScroll,
    overflowWidth,
  };
}

export function fitTextToContainer({
  textElement,
  containerElement,
  min = 4,
  max = 960,
}) {
  if (!textElement || !containerElement) {
    return 0;
  }

  const width = containerElement.clientWidth;
  const height = containerElement.clientHeight;

  if (width <= 0 || height <= 0) {
    return 0;
  }

  const cappedMax = Math.max(min, Math.min(max, Math.ceil(height * 1.35)));
  const fits = (size) => {
    textElement.style.fontSize = `${size}px`;
    return (
      textElement.scrollWidth <= width + 1 &&
      textElement.scrollHeight <= height + 1
    );
  };

  const fontSize = findLargestFittingFontSize({
    min,
    max: cappedMax,
    fits,
  });

  textElement.style.fontSize = `${fontSize}px`;
  return fontSize;
}
