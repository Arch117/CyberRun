import { CyberRunGame } from "./game.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
  start: $("#start-screen"),
  pause: $("#pause-screen"),
  gameover: $("#gameover-screen"),
  score: $("#score-value"),
  coins: $("#coin-value"),
  best: $("#best-value"),
  bestBottom: $("#best-value-bottom"),
  finalScore: $("#final-score"),
  finalCoins: $("#final-coins"),
  newRecord: $("#new-record"),
  startButton: $("#start-button"),
  resumeButton: $("#resume-button"),
  restartButton: $("#restart-button"),
  pauseButton: $("#pause-button"),
  soundButton: $("#sound-button"),
  toast: $("#toast"),
  stage: $("#game-stage"),
  infoButton: $("#info-button"),
  infoOverlay: $("#game-info"),
  closeInfoButton: $("#close-info-button"),
  fullscreenToggle: $("#fullscreen-toggle")
};

const audio = createAudioController();
let game;
let toastTimeout;
let resumeAfterInfo = false;
let nativeFullscreen = false;

function createAudioController() {
  let context;
  let master;
  let enabled = true;
  let musicNodes = [];

  function start() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = enabled ? 0.13 : 0;
      master.connect(context.destination);
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 230;
      const musicGain = context.createGain();
      musicGain.gain.value = 0.24;
      filter.connect(musicGain);
      musicGain.connect(master);
      for (const [frequency, type, volume] of [[55, "sawtooth", 0.22], [82.4, "triangle", 0.12]]) {
        const oscillator = context.createOscillator();
        const voiceGain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        voiceGain.gain.value = volume;
        oscillator.connect(voiceGain);
        voiceGain.connect(filter);
        oscillator.start();
        musicNodes.push(oscillator, voiceGain);
      }
    }
    context.resume();
  }

  function play(kind) {
    if (!context || !enabled) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const settings = {
      jump: [440, 700, 0.11, "sine"],
      coin: [720, 1180, 0.16, "sine"],
      crash: [170, 45, 0.3, "sawtooth"]
    }[kind];
    oscillator.type = settings[3];
    oscillator.frequency.setValueAtTime(settings[0], now);
    oscillator.frequency.exponentialRampToValueAtTime(settings[1], now + settings[2]);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "crash" ? 0.34 : 0.2, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + settings[2] + 0.1);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + settings[2] + 0.12);
  }

  function setEnabled(value) {
    enabled = value;
    if (context && master) master.gain.setTargetAtTime(enabled ? 0.13 : 0, context.currentTime, 0.04);
    if (enabled) start();
    return enabled;
  }

  return { start, play, setEnabled, get enabled() { return enabled; } };
}

function formatScore(value) {
  return String(Math.floor(value)).padStart(6, "0");
}

function updateHud({ score, coins, best }) {
  elements.score.textContent = formatScore(score);
  elements.coins.textContent = String(coins);
  elements.best.textContent = formatScore(best);
  elements.bestBottom.textContent = formatScore(best);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => elements.toast.classList.remove("visible"), 1400);
}

function setState(state) {
  elements.start.classList.toggle("is-hidden", state !== "ready");
  elements.pause.classList.toggle("is-hidden", state !== "paused");
  elements.gameover.classList.toggle("is-hidden", state !== "gameover");
  elements.pauseButton.disabled = state === "ready" || state === "gameover";
  elements.pauseButton.setAttribute("aria-label", state === "paused" ? "Resume game" : "Pause game");
  elements.pauseButton.title = state === "paused" ? "Resume game" : "Pause game";
  elements.pauseButton.querySelector(".button-state").textContent = state === "paused" ? "RESUME" : "PAUSE";
  elements.pauseButton.firstChild.textContent = state === "paused" ? "▶" : "Ⅱ";
}

game = new CyberRunGame($("#canvas-host"), {
  onState: setState,
  onHud: updateHud,
  onSound: (kind) => audio.play(kind),
  onCoin: () => showToast("ENERGY +1"),
  onSpeedUp: () => showToast("SPEED UP · GET READY"),
  onCollision: ({ score, coins, isNewBest }) => {
    elements.finalScore.textContent = formatScore(score);
    elements.finalCoins.textContent = String(coins);
    elements.newRecord.classList.toggle("is-hidden", !isNewBest);
  }
});
updateHud({ score: 0, coins: 0, best: game.best });

function startGame() {
  audio.start();
  game.start();
  enterMobileFullscreen();
}

function isMobileLayout() {
  return window.matchMedia("(max-width: 760px), (pointer: coarse) and (max-height: 550px)").matches;
}

function setMobileFullscreen(active) {
  elements.stage.classList.toggle("mobile-fullscreen", active);
  document.body.classList.toggle("mobile-run-active", active);
  elements.fullscreenToggle.textContent = active ? "EXIT FULL SCREEN" : "ENTER FULL SCREEN";
  if (!active && document.fullscreenElement === elements.stage) {
    nativeFullscreen = false;
    document.exitFullscreen?.();
  }
}

function enterMobileFullscreen() {
  if (!isMobileLayout()) return;
  setMobileFullscreen(true);
  if (!elements.stage.requestFullscreen) return;
  elements.stage.requestFullscreen().then(() => {
    nativeFullscreen = document.fullscreenElement === elements.stage;
  }).catch(() => {
    showToast("FULLSCREEN LIMITED BY BROWSER");
  });
}

function openGameInfo() {
  resumeAfterInfo = game.state === "running";
  if (resumeAfterInfo) game.pause();
  elements.infoOverlay.classList.remove("is-hidden");
  elements.closeInfoButton.focus();
}

function closeGameInfo() {
  if (elements.infoOverlay.classList.contains("is-hidden")) return;
  elements.infoOverlay.classList.add("is-hidden");
  if (resumeAfterInfo && game.state === "paused") game.resume();
  resumeAfterInfo = false;
  elements.infoButton.focus();
}

elements.startButton.addEventListener("click", startGame);
elements.restartButton.addEventListener("click", startGame);
elements.resumeButton.addEventListener("click", () => game.resume());
elements.pauseButton.addEventListener("click", () => {
  if (game.state === "paused") game.resume();
  else game.pause();
});
elements.soundButton.addEventListener("click", () => {
  const enabled = audio.setEnabled(!audio.enabled);
  elements.soundButton.querySelector(".button-state").textContent = enabled ? "ON" : "OFF";
  elements.soundButton.setAttribute("aria-label", `Turn sound ${enabled ? "off" : "on"}`);
  elements.soundButton.title = `Turn sound ${enabled ? "off" : "on"}`;
  showToast(enabled ? "SOUND ON" : "SOUND OFF");
});
elements.infoButton.addEventListener("click", openGameInfo);
elements.closeInfoButton.addEventListener("click", closeGameInfo);
elements.infoOverlay.addEventListener("click", (event) => {
  if (event.target === elements.infoOverlay) closeGameInfo();
});
elements.fullscreenToggle.addEventListener("click", () => {
  const isFullscreen = elements.stage.classList.contains("mobile-fullscreen");
  if (!isFullscreen) enterMobileFullscreen();
  else setMobileFullscreen(false);
});

document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement === elements.stage) {
    nativeFullscreen = true;
    return;
  }
  if (nativeFullscreen) {
    nativeFullscreen = false;
    setMobileFullscreen(false);
  }
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(key)) event.preventDefault();
  if (key === "escape") {
    if (!elements.infoOverlay.classList.contains("is-hidden")) {
      closeGameInfo();
      return;
    }
    if (game.state === "running") game.pause();
    else if (game.state === "paused") game.resume();
    return;
  }
  if (key === "arrowleft" || key === "a") game.move(-1);
  else if (key === "arrowright" || key === "d") game.move(1);
  else if (key === "arrowup" || key === "w" || key === " ") game.jump();
  else if (key === "arrowdown" || key === "s") game.slide();
});

let touchStart = null;
$("#game-stage").addEventListener("touchstart", (event) => {
  if (game.state !== "running" || !elements.infoOverlay.classList.contains("is-hidden") || event.target.closest("button, .info-dialog")) return;
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });
$("#game-stage").addEventListener("touchend", (event) => {
  if (!touchStart || game.state !== "running" || !elements.infoOverlay.classList.contains("is-hidden")) {
    touchStart = null;
    return;
  }
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) game.jump();
  else if (Math.abs(dx) > Math.abs(dy)) game.move(dx > 0 ? 1 : -1);
  else if (dy < 0) game.jump();
  else game.slide();
  touchStart = null;
}, { passive: true });
