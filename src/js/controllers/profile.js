import "../../sass/pages/profile.scss";
import "../preload";

import * as model from "../models/profileModel";
import * as authModel from "../models/authModel";
import {
  settingsView,
  securityView,
  editProfileView,
  methodsView,
  changePasswordView,
  forgotPasswordView,
  enableFactorView,
  disableFactorView,
  pageViews,
  sectionViews,
} from "../views/profileView";

import twoFactorModal from "../views/modals/twoFactorModal";

// NOTE: for removing cards, make a new cardsView and do it like that (apply to other scenarios as well) (brain kinda tired and broken rn)
// TODO: Implement profile photo change, redesign user cards

// PAGE HANDLERS
const handleLoad = async () => {
  try {
    // Set page in model
    const page = model.setPage();

    // Set relevant button to disabled
    settingsView.manageButtons(page);

    // Render loader and clear notice
    settingsView.renderLoader();

    // Fetch relevant data for current page
    await model.fetchData(page);

    // Remove loader
    settingsView.removeLoader();

    // Render page with data
    pageViews[page].render(model.state);

    // Initalize section views
    sectionViews[page].forEach((view) => view.init());
  } catch (err) {
    console.error(err);
  }
};

const handleTabClick = async (page) => {
  try {
    // Replace history
    history.replaceState(null, null, `/profile${page !== "profile" ? `/${page}` : ""}`);

    // Clear content element
    settingsView.clear();

    // Render loader and clear notice
    settingsView.renderLoader();

    // Fetch relevant data for current page
    await model.fetchData(page);

    // Remove loader
    settingsView.removeLoader();

    // Render page's content
    pageViews[page].render(model.state);

    // Initalize section views
    sectionViews[page].forEach((view) => view.init());
  } catch (err) {
    console.error(err);
  }
};

// NOT FINISHED - images
const handleUpdateUser = async (data, btn) => {
  try {
    // Add button loader
    editProfileView.renderButtonLoader(btn);

    // Update password in API
    await model.updateUser(data);

    // Remove button loader
    editProfileView.removeButtonLoader(btn);

    // Render button success
    editProfileView.renderButtonSuccess(btn);

    // Reset form and button
    window.setTimeout(() => {
      editProfileView.resetForm();
      editProfileView.removeButtonSuccess(btn);
      editProfileView.clearNotice();
    }, 2000);
  } catch (err) {
    console.error("SA", err);

    editProfileView.resetForm();
    editProfileView.removeButtonLoader(btn);
    editProfileView.renderError(err.message);
  }
};

const handleRevealMethods = async () => {
  try {
    // Clear UI
    methodsView.clear();

    // Add loader
    methodsView.renderLoader();

    // Fetch data
    await model.getPaymentMethods();

    // Remove loader
    methodsView.removeLoader();

    // Render content
    methodsView.render(model.state);
  } catch (err) {
    console.error(err);
  }
};

const handleDetachMethod = async (id, btn) => {
  try {
    // Render button loader
    methodsView.renderButtonLoader(btn);

    // Make API call
    await model.detachPaymentMethod(id);

    // Remove button loader
    methodsView.removeButtonLoader(btn);

    // Update UI
    methodsView.render(model.state);
  } catch (err) {
    console.error(err);
  }
};

// NOT FINISHED - add a unique view
const handlePassChange = async (data, btn) => {
  try {
    // Add button loader
    changePasswordView.renderButtonLoader(btn);

    // Update password in API
    await model.updatePassword(data);

    // Remove button loader
    changePasswordView.removeButtonLoader(btn);

    // Render button success
    changePasswordView.renderButtonSuccess(btn);

    // Reset form and button
    window.setTimeout(() => {
      changePasswordView.resetForm();
      changePasswordView.removeButtonSuccess(btn);
      changePasswordView.clearNotice();
    }, 2000);
  } catch (err) {
    console.error(err);
    changePasswordView.resetForm();
    changePasswordView.removeButtonLoader(btn);
    changePasswordView.renderError(err.message);
  }
};

const handleForgotPass = async (btn) => {
  try {
    // Render button loader
    forgotPasswordView.renderButtonLoader(btn);

    // Make API request
    await authModel.forgotPassword(model.state.user);

    // Remove button loader
    forgotPasswordView.removeButtonLoader(btn);

    // Render button success
    forgotPasswordView.renderButtonSuccess(btn);

    // Start button countdown
    forgotPasswordView.startBtnCountdown(btn);
  } catch (err) {
    console.error(err);
    forgotPasswordView.removeButtonLoader(btn);
    forgotPasswordView.renderError(err.message);

    // Reset timer if rateLimit error
    if (err.reason === "rateLimit") {
      const secondsLeft = model.getSecondsLeft(err.resetTime);
      forgotPasswordView.startBtnCountdown(btn, secondsLeft);
    }
  }
};

const handleTwoFactorModal = (enable) => {
  // Render modal with data
  twoFactorModal.render(enable);
};

const handleTwoFactor = async (enable, btn) => {
  const twoFactorView = enable ? enableFactorView : disableFactorView;

  try {
    // Add button loader
    twoFactorView.renderButtonLoader(btn);

    // make request to API
    await model.toggleTwoFactor(enable);

    // Remove button loader
    twoFactorView.removeButtonLoader(btn);

    // Render button success
    twoFactorView.renderButtonSuccess(btn);

    // Re-render page with data
    securityView.render(model.state);

    // reinitalize section views
    sectionViews.security.forEach((view) => view.init());

    // Remove modal
    window.setTimeout(() => twoFactorModal.remove(), 500);
  } catch (err) {
    console.error(err);
    twoFactorModal.remove();
    changePasswordView.removeButtonLoader(btn);
    twoFactorView.renderError(err.message);
  }
};

const init = () => {
  // Pages
  settingsView.addHandlerLoad(handleLoad);
  settingsView.addHandlerTabClick(handleTabClick);

  // Profile
  editProfileView.addHandlerSubmit(handleUpdateUser);
  methodsView.addHandlerReveal(handleRevealMethods);
  methodsView.addHandlerDetach(handleDetachMethod);

  // Security
  changePasswordView.addHandlerSubmit(handlePassChange);
  forgotPasswordView.addHandlerSubmit(handleForgotPass);
  enableFactorView.addHandlerSubmit(handleTwoFactorModal);
  disableFactorView.addHandlerSubmit(handleTwoFactorModal);
  twoFactorModal.addHandlerEnable2fa(handleTwoFactor);
  twoFactorModal.addHandlerDisable2fa(handleTwoFactor);
};
init();
