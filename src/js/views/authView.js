import { element, elements, classes } from "../base";

import View from "./view";

class AuthView {
  /** Adds toggle reveal handler to all associated buttons */
  addHandlerToggleReveal(handler) {
    elements.btnReveal.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();

        const btn = e.target.closest(classes.btnReveal);
        if (!btn) return;

        handler(btn);
      });
    });
  }

  /** Adds logout handler to logout button in nav */
  addHandlerLogout(handler) {
    element.nav.addEventListener("click", (e) => {
      const btn = e.target.closest(classes.navLogout);
      if (!btn) return;

      handler();
    });
  }

  /** Toggles the icon on reveal button of input */
  toggleRevealIcon(btn) {
    btn.classList.toggle(classes.revealed.slice(1));
  }

  /** Toggles input type  */
  toggleRevealInput(btn) {
    const input = btn.closest(classes.inputFieldPass).children[0];
    const toggler = { text: "password", password: "text" };
    input.type = toggler[input.type];
  }
}

class CredentialsView extends View {
  _parentElement = element.panel;
  _formElement = element.credentialsForm;

  addHandlerSubmit(handler) {
    this._formElement.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = this.getFormData();
      const btn = element.credentialsFormSubmit;

      handler(formData, btn);
    });
  }

  resetPassword() {
    this.resetInputs("password");
  }

  getResetToken() {
    const arr = window.location.pathname.split("/");
    return arr[arr.indexOf("reset-password") + 1];
  }
}

class TwoFactorView extends View {
  _parentElement = element.panel;
  _formElement = element.twoFactorForm;

  addHandlerSubmit(handler) {
    this._formElement.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = this.getFormData();
      const btn = element.twoFactorFormSubmit;

      handler(formData, btn);
    });
  }

  resetCode() {
    this.resetInputs("twoFactorCode");
  }
}

export const authView = new AuthView();
export const credentialsView = new CredentialsView();
export const twoFactorView = new TwoFactorView();
