import * as config from "../config";
import { getJSON, throwErr, cleanObj, filterObj } from "../helper";

export const state = {
  page: "profile",
  user: {},
  paymentMethods: [],
  plan: {},
  users: [],
};

const fetchUser = async () => {
  return (
    await getJSON({
      method: "GET",
      url: `${config.API_URL}/users/current-user`,
    })
  ).data.data.user;
};

const fetchUsers = async () => {
  return (
    await getJSON({
      method: "GET",
      url: `${config.API_URL}/users`,
    })
  ).data.data.users;
};

const fetchPlan = async () => {
  return (
    await getJSON({
      method: "GET",
      url: `${config.API_URL}/plans/current-active-plan`,
    })
  ).data.data.plan;
};

export const setPage = () => {
  const values = window.location.pathname.split("/");
  const tab = values[values.indexOf("profile") + 1];

  if (tab) state.page = tab;

  return state.page;
};

export const fetchData = async (page) => {
  try {
    if (page === "profile") {
      if (!Object.keys(state.user).length) state.user = await fetchUser();
    }

    if (page === "options") return;

    if (page === "security") {
      if (!Object.keys(state.user).length) state.user = await fetchUser();
    }

    if (page === "plan") {
      if (!Object.keys(state.plan).length) state.plan = await fetchPlan();
    }

    if (page === "users") {
      if (!state.users.length) state.users = await fetchUsers();
    }
    if (page === "products") return;
  } catch (err) {
    console.error("PAGE ERROR (NOT TREATED):", err);
    // throw throwErr(err);
  }
};

export const getSecondsLeft = (resetDate) => {
  const now = Date.now();
  const end = new Date(resetDate).getTime();

  return Math.ceil((end - now) / 1000);
};

// NOT FINISHED - image --> image may break the identical data checker
export const updateUser = async (data) => {
  try {
    // Filter image for now
    data.photo = undefined;

    // Filter empty values
    data = cleanObj(data);

    // Check if updates were made
    if (Object.keys(data).length === 0)
      throw new Error("Please provide updates before performing this action");

    // Check if identical values have been entered
    const filtered = filterObj(state.user, "email", "fullName");
    if (JSON.stringify(filtered) === JSON.stringify(data))
      throw new Error("Please provide updates before performing this action");

    // Update in API
    state.user = (
      await getJSON({
        method: "PATCH",
        url: `${config.API_URL}/users/update-current-user`,
        data,
      })
    ).data.data.user;
  } catch (err) {
    throw throwErr(err);
  }
};

export const getPaymentMethods = async () => {
  try {
    if (state.paymentMethods.length) return;

    // Fetch API and update state
    state.paymentMethods = (
      await getJSON({
        method: "GET",
        url: `${config.API_URL}/users/current-payment-methods`,
      })
    ).data.data.paymentMethods;

    return state.paymentMethods;
  } catch (err) {
    throw throwErr(err);
  }
};

export const detachPaymentMethod = async (id) => {
  try {
    if (!state.paymentMethods.length) throw new Error("You do not have any payment methods");

    // Delete in API
    await getJSON({
      method: "DELETE",
      url: `${config.API_URL}/users/detach-payment-method/${id}`,
    });

    // Update state
    state.paymentMethods = state.paymentMethods.filter((method) => method.id !== id);
  } catch (err) {
    throw throwErr(err);
  }
};

export const updatePassword = async (data) => {
  try {
    if (!data.currentPassword || !data.newPassword)
      throw new Error("Please provide both your current password and a new one");

    await getJSON({
      method: "PATCH",
      url: `${config.API_URL}/users/update-password`,
      data,
    });
  } catch (err) {
    throw throwErr(err);
  }
};

export const toggleTwoFactor = async (enable = true) => {
  const word = enable ? "enable" : "disable";
  try {
    if (enable === state.user.twoFactor)
      throw new Error(`Two factor authentication is already ${word}d`);

    // Make request
    await getJSON({
      method: "PATCH",
      url: `${config.API_URL}/users/${word}-twoFactor`,
    });

    // Update user in state
    state.user.twoFactor = enable;
  } catch (err) {
    throw throwErr(err);
  }
};
