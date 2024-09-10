import Timeout from './Timeout.js';

class Slide {
  public container: Element;
  public slides: Element[];
  public slide: Element;
  public controls: Element;
  public time: number;
  public thumb: HTMLElement | null;
  public thumbItems: HTMLElement[] | null;
  public index: number;
  public timeout: Timeout | null;
  public pausedTimeout: Timeout | null;
  public paused: boolean;

  constructor(
    container: Element,
    slides: Element[],
    controls: Element,
    time: number = 5000
  ) {
    this.container = container;
    this.slides = slides;
    this.controls = controls;
    this.time = time;
    this.thumb = null;
    this.thumbItems = null;
    this.index = localStorage.getItem('activeSlide')
      ? Number(localStorage.getItem('activeSlide'))
      : 0;
    this.slide = this.slides[this.index];
    this.timeout = null;
    this.pausedTimeout = null;
    this.paused = false;

    this.init();
  }

  public hide(element: Element) {
    element.classList.remove('active');

    if (element instanceof HTMLVideoElement) {
      element.currentTime = 0;
      element.pause();
    }
  }

  public show(index: number) {
    this.index = index;
    this.slide = this.slides[this.index];
    localStorage.setItem('activeSlide', String(this.index));

    if (this.thumbItems) {
      this.thumb = this.thumbItems[this.index];
      this.thumbItems.forEach((element) => element.classList.remove('active'));
      this.thumb.classList.add('active');
    }

    this.slides.forEach((element) => this.hide(element));
    this.slide.classList.add('active');
    if (this.slide instanceof HTMLVideoElement) {
      this.autoVideo(this.slide);
    } else {
      this.auto(this.time);
    }
  }

  public autoVideo(video: HTMLVideoElement) {
    video.muted = true;
    video.play();
    let firstPlay = true;
    video.addEventListener('playing', () => {
      if (firstPlay) {
        this.auto(video.duration * 1000);
        firstPlay = false;
      }
    });
  }

  public auto(time: number) {
    this.timeout?.clear();
    this.timeout = new Timeout(() => this.next(), time);

    if (this.thumb) {
      this.thumb.style.animationDuration = `${time}ms`;
    }
  }

  public prev() {
    if (this.paused) {
      return;
    }

    const prev = this.index > 0 ? this.index - 1 : this.slides.length - 1;
    this.show(prev);
  }

  public next() {
    if (this.paused) {
      return;
    }

    const next = this.index + 1 < this.slides.length ? this.index + 1 : 0;
    this.show(next);
  }

  public pause() {
    document.body.classList.add('paused');

    this.pausedTimeout = new Timeout(() => {
      this.timeout?.pause();
      this.paused = true;
      this.thumb?.classList.add('paused');

      if (this.slide instanceof HTMLVideoElement) {
        this.slide.pause();
      }
    }, 300);
  }

  public continue() {
    document.body.classList.remove('paused');

    this.pausedTimeout?.clear();
    if (this.paused) {
      this.paused = false;
      this.timeout?.continue();
      this.thumb?.classList.remove('paused');
      if (this.slide instanceof HTMLVideoElement) {
        this.slide.play();
      }
    }
  }

  private addControls() {
    const prevButton = document.createElement('button');
    const nextButton = document.createElement('button');
    prevButton.innerText = 'Slide Anterior';
    nextButton.innerText = 'Próximo Slide';

    this.controls.appendChild(prevButton);
    this.controls.appendChild(nextButton);

    this.controls.addEventListener('pointerdown', () => this.pause());
    document.addEventListener('pointerup', () => this.continue());
    document.addEventListener('touchend', () => this.continue());

    prevButton.addEventListener('pointerup', () => this.prev());
    nextButton.addEventListener('pointerup', () => this.next());
  }

  private addThumbItems() {
    const thumbContainer = document.createElement('div');
    thumbContainer.id = 'slide-thumb';

    for (let i = 0; i < this.slides.length; i++) {
      thumbContainer.innerHTML += `
      <span>
        <span class="thumb-item"></span>
      </span>`;
    }
    this.controls.appendChild(thumbContainer);
    this.thumbItems = Array.from(document.querySelectorAll('.thumb-item'));
  }

  private init() {
    this.addControls();
    this.addThumbItems();
    this.show(this.index);
  }
}

export default Slide;
