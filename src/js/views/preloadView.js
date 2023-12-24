import { changeShading } from "../helper";

class preloadView {
  preventPreloadTransitions() {
    window.addEventListener("load", () => {
      document.querySelector("body").classList.remove("css-transitions-only-after-page-load");
    });
  }

  removeFocusAfterClick() {
    document.addEventListener("click", function (e) {
      if (document.activeElement.toString() == "[object HTMLButtonElement]") {
        document.activeElement.blur();
      }
    });
  }

  // CHOOSE HOW TO IMPLEMENT IT ONTO BUTTONS
  addbuttonRipple() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(
        `.btn__primary,
        .btn__secondary,
        .btn__red,
        .btn__glass,
        .btn__shine,
        .btn__border,
        .btn__ripple,
        .btn__slide--icon`
      );
      if (!btn) return;

      // Remove existing ripple
      Array.from(btn.childNodes)
        .filter((el) => el.classList && el.classList.contains("ripple"))
        .forEach((el) => el.remove());

      // Get data
      const color =
        `${window.getComputedStyle(btn).color.split("(")[1]}`.split(")")[0] || "0, 0, 0";
      const width = (btn.clientWidth / 3) * 2;
      const rippleX = e.clientX - btn.getBoundingClientRect().x - width / 2;
      const rippleY = e.clientY - btn.getBoundingClientRect().y - width / 2;

      // Insert ripple markup
      const markup = `
        <div 
          class="ripple" 
          style="left: ${rippleX}px; top: ${rippleY}px; height: ${width}px; width: ${width}px; background: rgba(${color}, 0.2); animation: forwards scaleRipple 0.5s ease-out;"
        ></div>`;
      btn.insertAdjacentHTML("beforeend", markup);
    });
  }

  skewParagraph() {
    const paragraphs = document.querySelectorAll(".paragraph-skew");
    paragraphs.forEach((p) => {
      // p.style.transform = "skewX(0deg)";
      // const words = p.textContent.split(" ");
      // const markup = `<span>${words.join(`&nbsp</span><span>`)}</span>`;
      // p.innerHTML = markup;
    });
  }
}

export default new preloadView();
