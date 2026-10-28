import { BirthdayScene } from "./scene.js";
import { BirthdaySong } from "./audio.js";

const name = "Linh Giang";
document.title = `Happy Birthday ${name}`;
document.getElementById("name").textContent = name;

const slides = [
  { kicker: "Happy Birthday", text: "Linh Giang", className: "is-name" },
  { kicker: "", text: "Chào cột mốc tuổi 20 đẹp nhất của thanh xuân", className: "is-wish" },
  { kicker: "", text: "Mong mỗi ngày trôi qua đều thết đãi em những điều ngọt ngào", className: "is-wish" },
  { kicker: "", text: "Luôn bình an, an nhiên và tỏa sáng theo cách của riêng em", className: "is-wish" },
  { kicker: "", text: "Mọi nỗ lực trong học tập đều mang lại kết quả như ý", className: "is-wish" },
{
    kicker: "",
    text: "Mong rằng mọi chặng đường sắp tới của em luôn có may mắn và những người trân trọng em đồng hành",
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
const letterEl = document.getElementById("letter");
const canvas = document.getElementById("scene");
const audioEl = document.getElementById("song");
const birthdayEl = document.getElementById("birthday");

const scene = new BirthdayScene(canvas);
scene.start();

const song = new BirthdaySong(audioEl, birthdayEl);
let started = false;
let storyDone = false;
let letterShown = false;
let index = -1;
let timer = 0;

function isChrome(target) {
  return target instanceof Element && target.closest(".wish, .letter");
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

function openLetter() {
  if (letterShown) return;
  letterShown = true;
  wishBtn.hidden = true;
  guideEl.classList.remove("is-shown");
  letterEl.hidden = false;
  document.body.classList.add("is-letter");
  requestAnimationFrame(() => letterEl.classList.add("is-open"));
}

function closeLetter() {
  if (!letterEl.classList.contains("is-open")) return;
  letterEl.classList.remove("is-open");
  document.body.classList.remove("is-letter");
  window.setTimeout(() => {
    letterEl.hidden = true;
    wishBtn.hidden = false;
    guideEl.classList.add("is-shown");
    syncWishButton();
  }, 520);
}

function onWish(e) {
  e.stopPropagation();
  if (scene.candlesLit && !scene.blown) {
    scene.blowCandles();
    song.resumeBg();
    if (!letterShown) {
      wishBtn.hidden = true;
      guideEl.classList.remove("is-shown");
      document.body.classList.add("is-letter");
      timer = window.setTimeout(openLetter, 1200);
    }
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
letterEl.addEventListener("pointerdown", (e) => {
  e.stopPropagation();
  closeLetter();
});
