import { element, elements, classes } from "../../base";
import { getElement } from "../../helper";

export default class Modal {
  _overlayElement = element.overlay;
  _modalElement;
  _data;

  // not pretty but works
  addHandlerExit() {
    this._overlayElement.addEventListener("click", (e) => {
      if (
        e.target.closest(`${classes.modalClose}, ${classes.modalExit}`) ||
        e.target.classList.contains(classes.overlay.slice(1))
      ) {
        this.remove();
      }
    });
  }

  /** Renders a new modal, places it in the overlay and reveals it */
  render(data) {
    this._data = data;
    this.clearOverlay();

    const content = this._generateContentMarkup();
    const modal = this._generateMarkup(content);

    this._overlayElement.insertAdjacentHTML("beforeend", modal);

    // Needed for animation
    window.setTimeout(() => this.revealOverlay());
  }

  /** Hides overlay and removes modal */
  remove() {
    const ms = getComputedStyle(this._overlayElement).transitionDuration.split("s")[0] * 1000;

    this.hideOverlay();
    window.setTimeout(() => this.clearOverlay(), ms);
  }

  _generateMarkup(content) {
    return `
      <div class="modal">
        <button class="btn btn__glass modal__close" title="Exit modal"><i class="bi bi-x"></i></button>
        <div class="modal__inner">${content}</div>
      </div>
    `;
  }

  clearOverlay() {
    this._overlayElement.innerHTML = "";
  }

  revealOverlay() {
    this._overlayElement.classList.remove("hide");
    getElement("body").classList.add("noScroll");
  }

  hideOverlay() {
    this._overlayElement.classList.add("hide");
    getElement("body").classList.remove("noScroll");
  }
}

export const modalView = new Modal();
