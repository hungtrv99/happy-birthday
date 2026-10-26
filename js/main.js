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
    text: "Luôn được yêu thương và giữ mãi nụ cười trên môi nhé",
    className: "is-wish is-long",
  },
];

const storyEl = document.getElementById("story");
const kickerEl = document.getElementById("storyKicker");
const textEl = document.getElementById("storyText");
const stageEl = document.getElementById("stage");
const hintEl = document.getElementById("hint");
const guideEl = document.getElementById("guide");
const wishBtn = document.getElementById("wish");
const canvas = document.getElementById("scene");
const audioEl = document.getElementById("song");
const birthdayEl = document.getElementById("birthday");

const scene = new BirthdayScene(canvas);
scene.start();

const song = new BirthdaySong(audioEl, birthdayEl);
let started = false;
let storyDone = false;
let index = -1;
let timer = 0;

function isChrome(target) {
  return target instanceof Element && target.closest(".wish");
}

function syncWishButton() {
  const lit = scene.candlesLit && !scene.blown;
  wishBtn.classList.toggle("is-blow", lit);
  wishBtn.setAttribute("aria-label", lit ? "Thổi nến" : "Đốt nến");
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
  wishBtn.hidden = false;
  syncWishButton();
  requestAnimationFrame(() => guideEl.classList.add("is-shown"));
}

function onWish(e) {
  e.stopPropagation();
  if (scene.candlesLit && !scene.blown) {
    scene.blowCandles();
    song.resumeBg();
  } else {
    scene.lightCandles();
    song.playWish().catch(() => {});
  }
  syncWishButton();
}

async function onPointer(e) {
  if (isChrome(e.target)) return;
  if (started) return;
  started = true;
  hintEl.classList.add("is-gone");
  song.startBg().catch(() => {});
  nextSlide();
}

window.addEventListener("pointerdown", onPointer);
window.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") onPointer(e);
});
wishBtn.addEventListener("click", onWish);
wishBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
