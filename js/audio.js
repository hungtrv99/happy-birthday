export class BirthdaySong {
  constructor(bg, wish) {
    this.bg = bg;
    this.wish = wish;
    this.bg.loop = true;
    this.wish.loop = true;
  }

  async startBg() {
    this.wish.pause();
    this.wish.currentTime = 0;
    this.bg.loop = true;
    try {
      if (this.bg.paused) await this.bg.play();
    } catch {
      this.bg.src = "https://programmergaurav.github.io/happy-birthday/music.mp3";
      this.bg.loop = true;
      await this.bg.play();
    }
  }

  async playWish() {
    this.bg.pause();
    this.wish.loop = true;
    this.wish.currentTime = 0;
    await this.wish.play();
  }

  resumeBg() {
    this.wish.pause();
    this.wish.currentTime = 0;
    this.startBg().catch(() => {});
  }
}
