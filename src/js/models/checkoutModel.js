import * as config from "../config";
import { getJSON, throwErr, isSameObject } from "../helper";

export const state = {
  plan: {},
  paymentMethod: "",
  hasPaymentMethods: true, // Default true to test
  paymentMethods: [],
};

const parseOptions = (options) => {
  return {
    recurring: options.recurring === "on" ? true : false,
  };
};

export const getCheckoutInfo = async () => {
  try {
    const plan = (
      await getJSON({
        method: "GET",
        url: `${config.API_URL}/users/current-checkout`,
      })
    ).data.data.plan;

    state.plan = plan;

    return plan;
  } catch (err) {
    throw throwErr(err);
  }
};

export const removePendingPlan = async () => {
  try {
    await getJSON({
      method: "DELETE",
      url: `${config.API_URL}/plans/remove-pending-plan`,
    });

    state.plan = {};
  } catch (err) {
    throw throwErr(err);
  }
};

// NO LONGER USED
export const updatePlanOptions = async (data) => {
  try {
    // Get parsed options
    const options = parseOptions(data);

    // Create non referenced objects
    const original = { ...state.plan };
    const modified = Object.assign(state.plan.options, options);

    // If no changes, don't send to API
    if (isSameObject(original, modified)) return;

    // Update plan in API
    const plan = (
      await getJSON({
        method: "PATCH",
        url: `${config.API_URL}/plans/update-pending-plan`,
        data: options,
      })
    ).data.data.plan;

    // Update plan in state if successful
    state.plan = plan;
  } catch (err) {
    throw throwErr(err);
  }
};

// UPDATE/FIX: now that this url can update the plan, implement the features in the function above to it. Also edit the response of the url so that it resends the plan.
export const createSubscription = async (data) => {
  try {
    // NOT TESTED
    if (!state.plan) throw new Error("Please select a plan before performing this action");

    // Get parsed options
    const options = parseOptions(data);

    // Create subscription AND update plan info
    const res = (
      await getJSON({
        method: "POST",
        url: `${config.API_URL}/plans/create-subscription`,
        data: options,
      })
    ).data.data;

    // Add data to plan in state
    state.plan = Object.assign(res.plan, state.plan);

    return state.plan;
  } catch (err) {
    throw throwErr(err);
  }
};

export const getPaymentMethods = async () => {
  try {
    if (!state.hasPaymentMethods) throw new Error("No payment methods attached to account");

    // Fetch payment methods
    const res = (
      await getJSON({
        method: "GET",
        url: `${config.API_URL}/users/current-payment-methods`,
      })
    ).data.data;

    // Update state
    state.paymentMethods = res.paymentMethods;

    // If no payment methods, set hasPaymentMethods to false
    if (state.paymentMethods.length === 0) {
      state.hasPaymentMethods = false;
      throw new Error("No payment methods attached to account");
    }
  } catch (err) {
    throw throwErr(err);
  }
};

// https://stripe.com/docs/js/payment_intents/confirm_acss_debit_payment --> for existing payment methods

// ADD --> if recurring = false, don't add payment method
export const confirmCardPayment = async (stripe, formData) => {
  console.log(state, formData);
  try {
    if (!state.plan) throw new Error("Please select a plan before performing this action");
    if (!formData.name) throw new Error("Please provide the cardholder's name to continue");
    if (!formData.postalCode) throw new Error("Please provide a postal code to continue");

    // Confirm payment on stripe API
    const res = await stripe.confirmCardPayment(state.plan.clientSecret, {
      payment_method: {
        card: formData.number,
        billing_details: {
          name: formData.name,
          address: { postal_code: formData.postalCode },
        },
      },
    });

    // Handle stripe error
    if (res.error) throw throwErr(res.error);
  } catch (err) {
    throw throwErr(err);
  }
};

export const confirmMethodPayment = async (stripe, cardId) => {
  try {
    if (!state.plan) throw new Error("Please select a plan before performing this action");
    if (!cardId) throw new Error("Please select a card before performing this action");

    // Confirm payment on stripe API
    const res = await stripe.confirmCardPayment(state.plan.clientSecret, {
      payment_method: cardId,
    });

    // Handle stripe error
    if (res.error) throw throwErr(res.error);
  } catch (err) {
    throw throwErr(err);
  }
};
