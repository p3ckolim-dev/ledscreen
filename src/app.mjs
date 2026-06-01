import {
  fitHorizontalTextToContainer,
  getAdjacentMarqueeSpeed,
  normalizeMessage,
  resolveMarqueeSpeed,
  resolveSignColor,
  resolveSignColorPreset,
} from "./fitText.mjs?v=20260601-default-3x";
import {
  readCachedMessage,
  writeCachedMessage,
} from "./preferences.mjs?v=20260601-default-3x";

const form = document.querySelector("[data-setup-form]");
const input = document.querySelector("[data-message-input]");
const startButton = document.querySelector("[data-start-button]");
const setupView = document.querySelector("[data-setup-view]");
const screenView = document.querySelector("[data-screen-view]");
const signArea = document.querySelector("[data-sign-area]");
const signText = document.querySelector("[data-sign-text]");
const editButton = document.querySelector("[data-edit-button]");
const fullScreenButton = document.querySelector("[data-fullscreen-button]");
const charCount = document.querySelector("[data-char-count]");
const colorInputs = [...document.querySelectorAll("[data-color-input]")];
const speedInput = document.querySelector("[data-speed-input]");
const speedDownButton = document.querySelector("[data-speed-down]");
const speedUpButton = document.querySelector("[data-speed-up]");
const speedValue = document.querySelector("[data-speed-value]");

let controlsTimer = 0;
let fitFrame = 0;

function scheduleFit() {
  cancelAnimationFrame(fitFrame);
  fitFrame = requestAnimationFrame(() => {
    const result = fitHorizontalTextToContainer({
      textElement: signText,
      containerElement: signArea,
      min: 4,
      max: 1100,
      speed: getSelectedSpeed(),
    });

    signArea.classList.toggle("is-scrolling", result.shouldScroll);
    signText.classList.remove("is-marquee");

    if (result.shouldScroll) {
      signText.getBoundingClientRect();
      signText.classList.add("is-marquee");
    }
  });
}

function getSelectedColor() {
  return resolveSignColor(colorInputs.find((input) => input.checked)?.value);
}

function applySignColor(color) {
  const preset = resolveSignColorPreset(color);

  document.documentElement.style.setProperty("--sign-color", preset.value);
  document.documentElement.style.setProperty("--sign-rgb", preset.rgb);
  document.documentElement.style.setProperty("--sign-contrast", preset.contrast);
}

function getSelectedSpeed() {
  return resolveMarqueeSpeed(speedInput?.value);
}

function setSelectedSpeed(speed) {
  const nextSpeed = resolveMarqueeSpeed(speed);

  speedInput.value = String(nextSpeed);
  speedValue.textContent = `${nextSpeed}x`;
  speedDownButton.disabled = nextSpeed === 0.8;
  speedUpButton.disabled = nextSpeed === 3;
  scheduleFit();
}

function setStartState() {
  const message = normalizeMessage(input.value);
  startButton.disabled = message.length === 0;
  charCount.textContent = `${message.length}`;
}

async function requestFullScreen() {
  const target = screenView;

  if (!target.requestFullscreen) {
    return;
  }

  try {
    await target.requestFullscreen({ navigationUI: "hide" });
  } catch {
    // Mobile browsers can reject fullscreen while still showing the full viewport.
  }
}

async function requestLandscapeOrientation() {
  if (!screen.orientation?.lock) {
    return;
  }

  try {
    await screen.orientation.lock("landscape");
  } catch {
    // Orientation locking is intentionally best-effort across mobile browsers.
  }
}

function showControls() {
  screenView.classList.add("show-controls");
  clearTimeout(controlsTimer);
  controlsTimer = setTimeout(() => {
    screenView.classList.remove("show-controls");
  }, 2600);
}

async function enterDisplay(message) {
  writeCachedMessage(message);
  applySignColor(getSelectedColor());
  signText.textContent = message;
  setupView.hidden = true;
  screenView.hidden = false;
  document.body.classList.add("is-displaying");

  scheduleFit();
  showControls();
  await requestFullScreen();
  await requestLandscapeOrientation();
  scheduleFit();
}

async function exitDisplay() {
  screen.orientation?.unlock?.();

  if (document.fullscreenElement && document.exitFullscreen) {
    try {
      await document.exitFullscreen();
    } catch {
      // The edit flow should still work if fullscreen exit is denied.
    }
  }

  screenView.hidden = true;
  setupView.hidden = false;
  document.body.classList.remove("is-displaying");
  input.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = normalizeMessage(input.value);

  if (message) {
    enterDisplay(message);
  }
});

input.addEventListener("input", () => {
  writeCachedMessage(input.value);
  setStartState();
});
colorInputs.forEach((input) => {
  input.addEventListener("change", () => applySignColor(input.value));
});
speedDownButton.addEventListener("click", () => {
  setSelectedSpeed(getAdjacentMarqueeSpeed(getSelectedSpeed(), -1));
});
speedUpButton.addEventListener("click", () => {
  setSelectedSpeed(getAdjacentMarqueeSpeed(getSelectedSpeed(), 1));
});

screenView.addEventListener("click", (event) => {
  if (event.target.closest("button")) {
    return;
  }

  showControls();
});

editButton.addEventListener("click", exitDisplay);
fullScreenButton.addEventListener("click", () => {
  showControls();
  requestFullScreen();
});

window.addEventListener("resize", scheduleFit);
window.visualViewport?.addEventListener("resize", scheduleFit);
window.addEventListener("orientationchange", scheduleFit);
document.fonts?.ready.then(scheduleFit);

new ResizeObserver(scheduleFit).observe(signArea);

input.value = readCachedMessage();
applySignColor(getSelectedColor());
setSelectedSpeed(getSelectedSpeed());
setStartState();
