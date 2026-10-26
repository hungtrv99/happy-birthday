import { BirthdayScene } from "./scene.js";
import { BirthdaySong } from "./audio.js";

const name = "Linh Giang";
document.title = `Happy Birthday ${name}`;
document.getElementById("name").textContent = name;

const slides = [
  { kicker: "Happy Birthday", text: "Linh Giang", className: "is-name" },
  { kicker: "", text: "Chúc em tuổi 20 thật rực rỡ", className: "is-wish" },
  { kicker: "", text: "Luôn vui vẻ", className: "is-wish" },
  { kicker: "", text: "Bình an, hạnh phúc", className: "is-wish" },
  { kicker: "", text: "Học hành thuận lợi", className: "is-wish" },
  {
    kicker: "",
    text: "Luôn được yêu thương và giữ mãi nụ cười trên môi",
    className: "is-wish is-long",
  },
];

const storyEl = document.getElementById("story");
const kickerEl = document.getElementById("storyKicker");
const textEl = document.getElementById("storyText");
const stageEl = document.getElementById("stage");
const hintEl = document.getElementById("hint");
const guideEl = document.getElementById("guide");
const soundBtn = document.getElementById("sound");
const canvas = document.getElementById("scene");
const audioEl = document.getElementById("song");

const scene = new BirthdayScene(canvas);
scene.start();

const song = new BirthdaySong(audioEl);
let musicOn = false;
let started = false;
let storyDone = false;
let index = -1;
let timer = 0;

function isSoundButton(target) {
  return target instanceof Element && target.closest(".sound");
}

async function enableMusic() {
  try {
    await song.play();
    musicOn = true;
    soundBtn.hidden = false;
    soundBtn.classList.add("is-on");
    soundBtn.setAttribute("aria-label", "Tắt nhạc");
  } catch {
    hintEl.textContent = "Chạm thêm một lần nữa để bật nhạc";
  }
}

function showSlide(i) {
  const slide = slides[i];
  storyEl.classList.remove("is-in");
  window.setTimeout(() => {
    kickerEl.textContent = slide.kicker;
    textEl.textContent = slide.text;
    textEl.className = `story-text ${slide.className}`.trim();
    storyEl.classList.add("is-in");
  }, 280);
}

function nextSlide() {
  if (storyDone) return;
  index += 1;
  if (index >= slides.length) {
    finishStory();
    return;
  }
  showSlide(index);
  const hold = slides[index].className.includes("is-long") ? 4800 : 3200;
  timer = window.setTimeout(nextSlide, hold);
}

function finishStory() {
  storyDone = true;
  window.clearTimeout(timer);
  storyEl.classList.remove("is-in");
  storyEl.classList.add("is-done");
  stageEl.classList.remove("is-hidden");
  requestAnimationFrame(() => stageEl.classList.add("is-shown"));
  scene.reveal();
  hintEl.classList.add("is-gone");
  guideEl.hidden = false;
  requestAnimationFrame(() => guideEl.classList.add("is-shown"));
}

async function onPointer(e) {
  if (isSoundButton(e.target)) return;
  if (started) return;
  started = true;
  hintEl.classList.add("is-gone");
  enableMusic();
  nextSlide();
}

async function toggleMusic(e) {
  e.stopPropagation();
  if (!musicOn) {
    await enableMusic();
    return;
  }
  song.stop();
  musicOn = false;
  soundBtn.classList.remove("is-on");
  soundBtn.setAttribute("aria-label", "Bật nhạc");
}

window.addEventListener("pointerdown", onPointer);
window.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") onPointer(e);
});
soundBtn.addEventListener("click", toggleMusic);
soundBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
