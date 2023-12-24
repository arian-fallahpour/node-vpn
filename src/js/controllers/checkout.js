import "../../sass/pages/checkout.scss";
import "../preload";

import { element, elements, classes } from "../base";
import * as config from "../config";

import * as model from "../models/checkoutModel";

import "./components/authentication";
import * as sliderController from "./components/slider";

import {
  orderView,
  orderCostView,
  orderOptionsView,
  cardFormView,
  existingMethodView,
  applePayView,
  formViews,
} from "../views/checkoutView";

const stripe = Stripe(config.STRIPE_PUBLIC_KEY);

/** Initializes checkout page, does not prerender forms */
const controlLoad = async () => {
  try {
    // sliderController.setSlide(0, 2);

    // Disable slider before use
    sliderController.disableSlider(0);

    // Remove query to prevent api spam
    window.history.replaceState({}, null, location.pathname);

    // Render loaders
    orderView.renderLoader();
    orderCostView.renderLoader();
    orderOptionsView.renderLoader();

    // Fetch checkout info from api
    await model.getCheckoutInfo();

    // Enable slider
    sliderController.enableSlider(0);

    // Remove loaders
    orderView.removeLoader();
    orderCostView.removeLoader();
    orderOptionsView.removeLoader();

    // Render views
    orderView.render(model.state);
    orderCostView.render(model.state);
    orderOptionsView.render(model.state);
  } catch (err) {
    console.error(err);

    orderCostView.removeLoader();
    orderOptionsView.removeLoader();
    orderCostView.render(model.state);

    if (err.reason === "noPlan") return orderView.renderInfo(err.message);
    if (err.reason === "activePlan") return orderView.renderError(err.message);
  }
};

/** Removes plan if trash button is clicked */
const controlRemovePlan = async (type, id) => {
  try {
    // Remove product from API
    await model.removePendingPlan(type, id);

    // Add info message and disable slider if no plan
    if (!Object.keys(model.state.plan).length) {
      orderView.renderInfo("Please add a plan to proceed with your order");
      sliderController.disableSlider(0);
    }

    // Re-render page
    orderView.render(model.state);
    orderCostView.render(model.state);
  } catch (err) {
    console.error(err);
    orderView.renderError(err.message);
  }
};

/** Automatically sets up payment page form based on state */
const controlSetupForm = async (btn) => {
  const method = orderOptionsView.getPaymentMethod();
  const options = orderOptionsView.getPaymentOptions();
  const formView = formViews[method];

  try {
    // Update payment method in state
    model.state.paymentMethod = method;

    // Add loader to button
    orderOptionsView.renderButtonLoader(btn);

    // Fetch existing cards if corresponding method
    if (method === "existingCard") await model.getPaymentMethods();

    // Render payment method's specific form
    formView.render(model.state);

    // Initialize forView --> not needed for now, since it is alr in render
    // formView.init();

    // Set up form's stripe elements
    formView.setupForm(stripe);

    // Update plan and Create/retrieve new subscription in API
    await model.createSubscription(options);

    // Remove loader from button
    orderOptionsView.removeButtonLoader(btn);

    // Go to next checkout page
    sliderController.nextSlide(0);
  } catch (err) {
    console.error(err);

    orderOptionsView.renderError(err.message);
    orderOptionsView.removeButtonLoader(btn);
  }
};

/** Toggles existing card selection and updates state */
const controlSelectCard = async (btn, id) => {
  // Set card button to selected
  existingMethodView.toggleCardSelect(btn);

  // Set method id in model
  model.state.existingCardId = id;

  // Toggle button if card has been selected
  existingMethodView.toggleSubmitButton(model.state.existingCardId);
};

/** Handles new card form submission */
const controlSubmitCardForm = async (formData, btn) => {
  try {
    // Render button loader
    cardFormView.renderButtonLoader(btn);

    // Send request to Stripe API
    await model.confirmCardPayment(stripe, formData);

    // Remove button loader
    cardFormView.removeButtonLoader(btn);

    // Render button success
    cardFormView.renderButtonSuccess(btn);

    // Redirect
    window.setTimeout(() => location.assign("/"), 1500);
  } catch (err) {
    console.error(err);
    cardFormView.renderError(err.message);
    cardFormView.removeButtonLoader(btn);
  }
};

/** Handles existing card form submission */
const controlSubmitMethodForm = async (cardId, btn) => {
  try {
    // Render button loader
    existingMethodView.renderButtonLoader(btn);

    // Send request to stripe API
    await model.confirmMethodPayment(stripe, cardId);

    // Remove button loader
    existingMethodView.removeButtonLoader(btn);

    // Render button sucess
    existingMethodView.renderButtonSuccess(btn);

    // Redirect
    window.setTimeout(() => location.assign("/"), 1500);

    // submit with info
    console.log(cardId, btn);
  } catch (err) {
    console.error(err);
  }
};

/** Handles apple pay form submission */
const controlSubmitAppleForm = async (method, btn) => {};

const init = () => {
  sliderController.init(element.sliderCheckout, {
    type: "progressive",
    stages: ["order summary", "order options", "payment page"],
    number: 0,
  });

  orderView.addHandlerDOMLoad(controlLoad);
  orderView.addHandlerRemoveProduct(controlRemovePlan);

  orderView.addHandlerOptionsNext(sliderController.nextSlide);
  orderView.addHandlerPaymentNext(controlSetupForm);

  cardFormView.addHandlerSubmit(controlSubmitCardForm);
  existingMethodView.addHandlerSubmit(controlSubmitMethodForm);
  existingMethodView.addHandlerSelectCard(controlSelectCard);
};
init();
