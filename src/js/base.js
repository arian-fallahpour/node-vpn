export const classes = {
  // Modifiers
  revealed: ".revealed",
  passed: ".passed",
  active: ".active",
  inputFieldPass: ".inputField--pass",
  btnLoading: ".btn--loading",
  btnSuccess: ".btn--success",
  smoothGridCss: ".smooth-grid-css",
  splitLines: ".split-lines",
  selected: ".selected",

  // Components
  nav: ".nav",
  login: ".login",
  signup: ".signup",
  input: ".input",
  panel: ".panel",

  // Error
  notice: ".notice",
  info: ".info",
  error: ".error",
  changePasswordError: ".changePassword__error",
  editProfileError: ".editProfile__error",

  // Modal
  overlay: ".overlay",
  modal: ".modal",
  twoFactorModal: ".twoFactorModal",
  modalInner: ".modal__inner",
  modalClose: ".modal__close",
  modalExit: ".modal__exit",

  // Buttons
  settingsBtn: ".settings__btn",
  tabBtn: ".tab__btn",
  orderOptionsBtn: ".order__options-btn",
  orderPaymentBtn: ".order__payment-btn",
  changePasswordBtn: ".changePassword__btn",
  editProfileBtn: ".editProfile__btn",
  btnReveal: ".btn__reveal",
  btnSubmit: ".btn__submit",
  checkoutCardRemove: ".checkoutCard__remove",
  revealMethodsBtn: ".revealMethods__btn",
  detachCardBtn: ".card__remove-btn",
  forgotPasswordBtn: ".forgotPassword__btn",
  enableFactorAuthBtn: ".enableTwoFactor__btn",
  enableTwoFactorConfirm: ".enableTwoFactor__confirm",
  disableFactorAuthBtn: ".disableTwoFactor__btn",
  disableTwoFactorConfirm: ".disableTwoFactor__confirm",
  paymentFormSubmit: ".paymentForm__submit",

  // Slider
  slider: ".slider",
  slide: ".slide",
  slides: ".slides",
  sliderHeader: ".slider--header",
  sliderCheckout: ".slider--checkout",
  sliderLogin: ".slider--login",
  sliderLoop: ".slider--loop",
  sliderNext: ".slider__next",
  sliderBack: ".slider__back",
  sliderBtn: ".slider__btn",
  dot: ".dot",
  dots: ".dots",

  // Navigation
  navLogout: ".navMenu__logout",

  // Credentials
  credentialsForm: ".credentialsForm",
  credentialsFormSubmit: ".credentialsForm__submit",
  twoFactorForm: ".twoFactorForm",
  twoFactorFormSubmit: ".twoFactorForm__submit",

  // Checkout
  plans: ".plans",
  checkoutCard: ".checkoutCard",
  orderCostContent: ".orderCost__content",
  orderCost: ".orderCost",
  orderOptions: ".orderOptions",
  paymentForms: ".paymentForms",
  paymentForm: ".paymentForm",
  paymentMethod: ".paymentMethod",
  paymentOptions: ".paymentOptions",
  newCard: ".newCard",
  existingCard: ".existingCard",

  // Settings
  settings: ".settings",
  settingsMain: ".settings__main",
  settingsContent: ".settings__content",
  editProfile: ".editProfile",
  paymentMethods: ".paymentMethods",
  changePassword: ".changePassword",
  forgotPassword: ".forgotPassword",
  forgotPasswordTime: ".forgotPassword__time",
  forgotPasswordSeconds: ".forgotPassword__time--seconds",
  enableFactorAuth: ".enableTwoFactor",
  disableFactorAuth: ".disableTwoFactor",
  cards: ".cards",
  card: ".card",
};

export const ids = {
  cardName: "card-name",
  cardNumber: "card-number",
  cardExpiry: "card-expiry",
  cardCvc: "card-cvc",
};

export const element = {};

export const elements = {
  btnReveal: document.querySelectorAll(classes.btnReveal),
  slide: document.querySelectorAll(classes.slide),
  sliderBtn: document.querySelectorAll(classes.sliderBtn),
  dots: document.querySelectorAll(classes.dots),
  dot: document.querySelectorAll(classes.dot),
  checkoutCard: document.querySelectorAll(classes.checkoutCard),
  error: document.querySelectorAll(classes.error),
  notice: document.querySelectorAll(classes.notice),
  info: document.querySelectorAll(classes.info),
  settingsBtn: document.querySelectorAll(classes.settingsBtn),
};

/** Automatically creates elements */
for (const key in classes) {
  element[key] = document.querySelector(classes[key]);
}
