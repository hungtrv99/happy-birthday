export class BirthdaySong {
  constructor(audio) {
    this.audio = audio;
    this.audio.loop = true;
    this.playing = false;
  }

  async play() {
    if (this.playing) return;
    try {
      this.audio.currentTime = 0;
      await this.audio.play();
      this.playing = true;
    } catch {
      this.audio.src = "https://programmergaurav.github.io/happy-birthday/music.mp3";
      this.audio.currentTime = 0;
      await this.audio.play();
      this.playing = true;
    }
  }

  stop() {
    this.audio.pause();
    this.playing = false;
  }
}
