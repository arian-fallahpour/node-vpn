import { element } from "../../base";

import * as model from "../../models/authModel";

import * as sliderController from "./slider";

import { authView, credentialsView, twoFactorView } from "../../views/authView";

export const login = async (data, btn) => {
  try {
    // Render loader
    credentialsView.renderButtonLoader(btn);

    // Make request
    await model.login(data);

    // Remove loader
    credentialsView.removeButtonLoader(btn);

    // Render success
    credentialsView.renderButtonSuccess(btn);

    // Relocate user
    window.setTimeout(() => location.assign("/"), 1000);
  } catch (err) {
    // Remove loader
    credentialsView.removeButtonLoader(btn);

    // If two factor is required
    if (err.reason === "twoFactor") {
      sliderController.nextSlide(0);

      // Render error
      return credentialsView.renderInfo(err.message);
    }

    // Remove password
    credentialsView.resetPassword();

    // Render error
    credentialsView.renderError(err.message);
  }
};

export const signup = async (data, btn) => {
  try {
    // Render loader
    credentialsView.renderButtonLoader(btn);

    // Make request
    await model.signup(data);

    // Remove loader
    credentialsView.removeButtonLoader(btn);

    // Render success
    credentialsView.renderButtonSuccess(btn);

    // Relocate user
    window.setTimeout(() => location.assign("/"), 1000);
  } catch (err) {
    // Remove loader
    credentialsView.removeButtonLoader(btn);

    // Remove password
    credentialsView.resetPassword();

    // Render error
    credentialsView.renderError(err.message);

    console.error(err);
  }
};

export const authenticate = async (data, btn) => {
  try {
    // Render loader
    twoFactorView.renderButtonLoader(btn);

    // Get credentials data
    const creds = credentialsView.getFormData();

    // Make request with combined data
    await model.login({ ...data, ...creds });

    // Remove loader
    twoFactorView.removeButtonLoader(btn);

    // Render success
    twoFactorView.renderButtonSuccess(btn);

    // Relocate user
    window.setTimeout(() => location.assign("/"), 1000);
  } catch (err) {
    // Remove loader
    twoFactorView.removeButtonLoader(btn);

    // Remove password
    twoFactorView.resetCode();

    // Render error
    twoFactorView.renderError(err.message);
  }
};

export const forgotPassword = async (data, btn) => {
  try {
    // Render loader
    credentialsView.renderButtonLoader(btn);

    // Make request to API
    await model.forgotPassword(data);

    // Remove loader
    credentialsView.removeButtonLoader(btn);

    // Render button success
    credentialsView.renderButtonSuccess(btn);

    // Change to success slide
    window.setTimeout(() => sliderController.nextSlide(0), 1000);
  } catch (err) {
    console.error(err);

    // Remove loader
    credentialsView.removeButtonLoader(btn);

    // Reset email input
    credentialsView.resetInputs("email");

    // Render error
    credentialsView.renderError(err.message);
  }
};

export const resetPassword = async (data, btn) => {
  try {
    // Render loader
    credentialsView.renderButtonLoader(btn);

    // Get token from location
    data.token = credentialsView.getResetToken();
    console.log(data.token);

    // Make request to API
    await model.resetPassword(data);

    // Remove loader
    credentialsView.removeButtonLoader(btn);

    // Render button success
    credentialsView.renderButtonSuccess(btn);

    // Change to success slide
    window.setTimeout(() => location.assign("/"), 1000);
  } catch (err) {
    console.error(err);

    // Remove loader
    credentialsView.removeButtonLoader(btn);

    // If two factor is required
    if (err.reason === "resetToken") {
      // Render error
      return credentialsView.renderInfo(err.message);
    }

    // Remove password
    credentialsView.resetInputs("newPassword", "confirmPassword");

    // Render error
    credentialsView.renderError(err.message);
  }
};

const logout = async () => {
  try {
    // Logout through API
    await model.logout();

    // Reload page
    window.setTimeout(() => location.assign("/"), 500);
  } catch (err) {
    console.error(err);
  }
};

const toggleReveal = (btn) => {
  // Toggle button icon
  authView.toggleRevealIcon(btn);

  // Toggle input type
  authView.toggleRevealInput(btn);
};

const init = () => {
  // sliderController.init(element.sliderLogin); --> Why was this here? shouldn't be here even though its okay if it is

  authView.addHandlerToggleReveal(toggleReveal);
  authView.addHandlerLogout(logout);
};
init();
