import { element, elements, classes } from "../base";
import { getElement } from "../helper";

/**
 *  ### Class Guide
 * #### .slider
 * + The main component
 *    - Used to locate elements inside the slider
 *    - Parent of all elements below, does not need to be direct parent
 *
 * #### .slides
 * +The parent element that contains all the slides
 *    - Relative element
 *
 * #### .slide
 * + One slide of many
 *    - Absolute elements
 *    - Position automatically determined
 *    - .slide--main is used to determine which slide to set initial visibility to visible
 *
 * #### .dots
 * + The parent element that contains all the dots
 *
 * #### .dot
 * + A dot element that is used for navigation purposes
 */
class SliderView {
  _slider;
  _slides;
  _disabled;
  type;
  number;
  length;
  stages;
  duration;

  constructor(slider, options = {}) {
    this._slider = slider;
    this._slides = this.getSlidesDOM();

    this.type = options.type || "normal";
    this.number = options.number;
    this.stages = options.stages || [];
    this.length = this.getElementDOM(classes.slides).children.length;

    // Set properties when page is FULLY loaded
    window.addEventListener("load", () => {
      this.duration = getComputedStyle(element.slide).transitionDuration.split("s")[0] * 1000;
    });
  }

  /** Adds page load event listener and handles it */
  addHandlerDOMLoad(handler) {
    window.addEventListener("DOMContentLoaded", (e) => {
      handler(this.number);
    });
  }

  /** Adds event listener for each next button click */
  addHandlerNext(handler) {
    this._slider.addEventListener("click", (e) => {
      const btn = e.target.closest(classes.sliderNext);
      if (!btn) return;
      if (btn.classList.contains("btn--loading")) return;
      if (this.type === "progressive") return;

      handler(this.number);
    });
  }

  /** Adds event listener for each back button click */
  addHandlerBack(handler) {
    this._slider.addEventListener("click", (e) => {
      const btn = e.target.closest(classes.sliderBack);
      if (!btn) return;

      handler(this.number);
    });
  }

  /** Adds event listener for each dot button click */
  addHandlerDot(handler) {
    this._slider.addEventListener("click", (e) => {
      const btn = e.target.closest(classes.dot);
      if (!btn) return;

      const page = JSON.parse(btn.dataset.slide);
      handler(this.number, page);
    });
  }

  /** Creates a loop and handles it if type is "loop" */
  addHandlerLoop(handler) {
    if (this.type === "loop") setInterval(handler, 10000, this.number);
  }

  /** Automatically generates markup with dot elements based on amount of slides */
  _generateDotsMarkup() {
    const markup = [];

    for (let i = 1; i <= this.length; i++) {
      let dot = `<button class="btn dot" data-slide="${i}"></button>`;

      if (this.type === "progressive")
        dot = `
          <button class="btn dot" data-slide="${i}"><span>${this.stages[i - 1]}</span></button>
        `;

      markup.push(dot);
    }

    return markup.join(" ");
  }

  /** Renders dots in the DOM*/
  renderDots() {
    const container = this.getDotsDOM();
    if (!container) return;

    // Generate markup
    const markup = this._generateDotsMarkup();

    // Clear html
    container.innerHTML = "";

    // Insert markup
    container.insertAdjacentHTML("beforeend", markup);
  }

  /** Used to set the shown slide */
  setSlide(page) {
    if (this._disabled) return;

    this._slides.forEach((s, i) => {
      s.style.transform = `translateX(${(i + 1 - page) * 100}%)`;
      s.style.visibility = "visible";

      const hideSLide = () => (s.style.visibility = "hidden");

      if (page !== i + 1)
        !this.duration ? hideSLide() : window.setTimeout(() => hideSLide(), this.duration || 0);
    });
  }

  /** Gives the "active" class to the dot that represents the current page */
  setDot(page) {
    if (this._disabled) page = 1;
    if (!this.getDotsDOM()) return;

    const dots = this.getDotsDOM().children;

    for (let i = 1; i <= dots.length; i++) {
      const dot = dots[i - 1];

      // Determine if active slide
      if (JSON.parse(dot.dataset.slide) === page) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }

      // Determine if passed if progressive
      if (this.type === "progressive" && i < page) {
        dot.classList.add("passed");
      } else {
        dot.classList.remove("passed");
      }
    }
  }

  /** Disables/Enables buttons automatically based on the slide's page */
  manageButtons(page, removeDelay = false, enableButtons = true) {
    if (this._disabled) return this.disableButtons();

    const btnsNext = this.getElementsDOM(classes.sliderNext);
    const btnsBack = this.getElementsDOM(classes.sliderBack);

    // Disable all
    if (!removeDelay) this.disableButtons();

    // Disable buttons at start and end if normal/progressive
    if (["normal", "progressive"].includes(this.type)) {
      const manager = (btn) => {
        if (enableButtons) this.enableButtons();
        this.disableElement(btn);
      };

      // At start
      if (page === 1)
        return removeDelay
          ? manager(btnsBack)
          : window.setTimeout(() => manager(btnsBack), removeDelay ? 0 : this.duration);

      // At end
      if (page === this.length)
        return removeDelay
          ? manager(btnsNext)
          : window.setTimeout(() => manager(btnsNext), removeDelay ? 0 : this.duration);
    }

    // In middle
    window.setTimeout(() => this.enableButtons(), removeDelay ? 0 : this.duration);
  }

  manageDots(page) {
    if (this._disabled) page = 1;
    if (!this.getDotsDOM()) return;
    const dots = this.getDotsDOM().children;

    // Disable all
    this.disableDots();

    // If progressive, only enable passed ones
    if (this.type === "progressive")
      return dots.forEach((dot, i) => {
        if (page > i + 1) window.setTimeout(() => this.enableElement(dot), 1000);
      });

    // Disable current dot if other
    dots.forEach((dot, i) => {
      if (page !== i + 1) window.setTimeout(() => this.enableElement(dot), 1000);
    });
  }

  /** Gets elements related to the current slide */
  getElementsDOM(selector) {
    const elements = Array.from(document.querySelectorAll(selector));

    return elements.filter((el) => el.closest(classes.slider).isSameNode(this._slider));
  }

  getElementDOM(selector) {
    const element = getElement(selector);
    const slider = element.closest(classes.slider);

    if (slider.isSameNode(this._slider)) return element;
  }

  /** Gets buttons related to the current slide */
  getButtonsDOM() {
    const buttons = Array.from(elements.sliderBtn);
    return buttons.filter((btn) => btn.closest(classes.slider).isSameNode(this._slider));
  }

  /** Gets dots related to the current slide */
  getDotsDOM() {
    const dots = Array.from(elements.dots);
    return dots.find((dots) => dots.closest(classes.slider).isSameNode(this._slider));
  }

  /** Gets slides related to the current slider */
  getSlidesDOM() {
    const slides = Array.from(elements.slide);
    return slides.filter((slide) => slide.closest(classes.slider).isSameNode(this._slider));
  }

  /** Sets this._disabled to true and disables buttons */
  disable() {
    this._disabled = true;
    this.disableButtons();
  }

  /** Sets this._disabled to false and enables buttons */
  enable() {
    this._disabled = false;
    this.enableButtons();
  }

  /** Disables all buttons related to current slider */
  disableButtons() {
    const buttons = this.getButtonsDOM();
    buttons.forEach((btn) => (btn.disabled = true));
  }

  /** Enables all buttons related to current slider */
  enableButtons() {
    const buttons = this.getButtonsDOM();
    buttons.forEach((btn) => (btn.disabled = false));
  }

  /** Disables all dots related to current slider */
  disableDots() {
    const dots = this.getDotsDOM().children;
    dots.forEach((dot) => (dot.disabled = true));
  }

  /** Enables all dots related to current slider */
  enableDots() {
    const dots = this.getDotsDOM().children;
    dots.forEach((dot) => (dot.disabled = false));
  }

  /** Disables element(s) */
  disableElement(element) {
    if (Array.isArray(element)) return element.forEach((el) => (el.disabled = true));
    element.disabled = true;
  }

  /** Enables elements(s) */
  enableElement(element) {
    if (Array.isArray(element)) return element.forEach((el) => (el.disabled = false));
    element.disabled = false;
  }
}

export default SliderView;
