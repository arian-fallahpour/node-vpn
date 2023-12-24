import { element, elements, classes } from "../../base";

import Modal from "./modal";

class twoFactorModal extends Modal {
  _modalElement = element.twoFactorModal;

  addHandlerEnable2fa(handler) {
    this._overlayElement.addEventListener("click", (e) => {
      const btn = e.target.closest(classes.enableTwoFactorConfirm);
      if (!btn) return;

      handler(true, btn);
    });
  }

  addHandlerDisable2fa(handler) {
    this._overlayElement.addEventListener("click", (e) => {
      const btn = e.target.closest(classes.disableTwoFactorConfirm);
      if (!btn) return;

      handler(false, btn);
    });
  }

  _generateContentMarkup() {
    const enable = this._data;
    const content = {
      true: {
        word: "enable",
        message:
          "Once enabled, you must access your email for a specific code everytime you log in.",
        class: "enableTwoFactor__confirm",
      },
      false: {
        word: "disable",
        message:
          "Once disabled, you will no longer need to access your email for a specific code everytime you log in. However, this makes your account more vulnerable to being hacked.",
        class: "disableTwoFactor__confirm",
      },
    };

    return `
      <div class="modal__content">
        <h5 class="header-5 u-center-text">${content[enable].word} two factor authentication?</h5>
        <p class="paragraph u-center-text">Are you sure you want to ${content[enable].word} two factor authentication? ${content[enable].message}</p>
      </div>
      <div class="modal__buttons">
        <button class="btn btn__glass modal__exit" title="cancel">cancel</button>
        <button class="btn btn__primary ${content[enable].class}" title="confirm">
          <span>confirm</span>
          <i class="bi bi-check-lg success-icon"></i>
        </button>
      </div>
    `;
  }
}

export default new twoFactorModal();
