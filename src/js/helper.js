import * as config from "./config";
import axios from "axios";

export const timeout = function (s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(`Request took too long! Timeout after ${s} seconds`));
    }, s * 1000);
  });
};

export const getJSON = async function (options) {
  try {
    return await axios(options);
  } catch (err) {
    throw err;
  }
};

export const wait = (fn, params, ms, removeDelay = false) => {
  if (removeDelay) {
    return fn(params);
  }

  return new Promise((resolve) => {
    // wait ms before calling fn(params)
    setTimeout(() => resolve(fn(params)), ms);
  });
};

export const throwErr = (err) => {
  if (err.isAxiosError) throw err.response.data;
  throw err;
};

// Objects
export const isSameObject = (obj1 = {}, obj2 = {}) => {
  let same = true;

  Object.keys(obj1).forEach((key) => {
    if (obj1[key] !== obj2[key]) same = false;
  });

  return same;
};

export const cleanObj = (obj = {}) => {
  Object.keys(obj).forEach((key) => {
    if (!obj[key]) delete obj[key];
  });

  return obj;
};

export const filterObj = (obj, ...allowed) => {
  const filtered = {};
  Object.keys(obj).forEach((key) => {
    if (allowed.includes(key)) filtered[key] = obj[key];
  });
  return filtered;
};

// DOM
export const getElement = (selector) => {
  return document.querySelector(selector);
};

export const getElements = (selector) => {
  return document.querySelectorAll(selector);
};

export const combineClasses = (classList) => {
  return Array.from(classList)
    .map((e) => `.${e}`)
    .join("");
};

// Parsing
export const parseCardExpiry = (month, year) => {
  return `${month.toString().length > 1 ? month : `0${month}`}/${year}`;
};
