import * as config from "../config";
import { getJSON, throwErr, cleanObj } from "../helper";

export const login = async (data) => {
  try {
    if (!data.email || !data.password) throw new Error("Please provide both an email and password");

    const parsed = cleanObj(data);

    await getJSON({
      method: "POST",
      url: `${config.API_URL}/users/login`,
      data: parsed,
    });
  } catch (err) {
    throw throwErr(err);
  }
};

export const signup = async (data) => {
  try {
    if (!data.email || !data.fullName || !data.password)
      throw new Error("Please provide an email, password and your fullName");

    await getJSON({
      method: "POST",
      url: `${config.API_URL}/users/signup`,
      data,
    });
  } catch (err) {
    throw throwErr(err);
  }
};

export const forgotPassword = async (data) => {
  try {
    // Check if email was provided
    if (!data.email) throw new Error("Please provide an email to send the link to");

    // Send request
    await getJSON({
      method: "POST",
      url: `${config.API_URL}/users/forgot-password`,
      data,
    });
  } catch (err) {
    throw throwErr(err);
  }
};

export const resetPassword = async (data) => {
  try {
    // Check if both passwords were provided
    if (!data.newPassword || !data.confirmPassword)
      throw new Error("Please provide a new password and confirm password");

    // Make request
    await getJSON({
      method: "PATCH",
      url: `${config.API_URL}/users/reset-password/${data.token}`,
      data,
    });
  } catch (err) {
    throw throwErr(err);
  }
};

export const logout = async () => {
  try {
    await getJSON({
      method: "GET",
      url: `${config.API_URL}/users/logout`,
    });
  } catch (err) {
    throw throwErr(err);
  }
};
