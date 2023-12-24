const axios = require("axios"); // AXIOS WORKS IN BACKEND
const crypto = require("crypto");

const fileFinder = require("../utils/fileFinder");
const catchAsync = require("../utils/catchAsync");

const Product = require("../models/productModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");

exports.getHome = catchAsync(async (req, res, next) => {
  const plans = await Product.find({ type: "plan", active: true }).select("name price photo");
  res.render("home", {
    title: "Home - VPN",
    scripts: fileFinder.js("home"),
    plans,
  });
});

exports.getLogin = (req, res, next) => {
  if (req.user && req.user.role !== "admin") return res.redirect("/");

  res.render("login", {
    title: "Login - VPN",
    scripts: fileFinder.js("login"),
  });
};

exports.getSignup = (req, res, next) => {
  if (req.user && req.user.role !== "admin") return res.redirect("/");

  res.render("signup", {
    title: "Sign up - VPN",
    scripts: fileFinder.js("signup"),
  });
};

exports.getForgotPassword = (req, res, next) => {
  res.render("forgotPassword", {
    title: "Forgot password - VPN",
    scripts: fileFinder.js("forgotPassword"),
  });
};

exports.getResetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  console.log("ads");

  // Create hashed version of token
  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  // Check if user exists with hash and is not expired
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select("passwordResetToken passwordResetExpires");
  // if (!user) return next(new AppError("Reset token is invalid or has expired"));

  res.render("resetPassword", {
    title: "Reset password - VPN",
    scripts: fileFinder.js("resetPassword"),
  });
});

exports.getProfile = (req, res, next) => {
  const page = req.params.page || "profile";
  // const pages = {
  //   user: ["profile", "options", "security", "plan"],
  //   admin: ["users"],
  // };

  // // If not in either pages or admin
  // if (!pages.user.includes(page) && !pages.admin.includes(page)) return next();

  // // If in admin, but role is not admin
  // if (pages.admin.includes(page) && req.user.role !== "admin") return next();

  res.render("profile", {
    title: "Profile - VPN",
    scripts: fileFinder.js("profile"),
    page,
  });
};

exports.getSuccess = (req, res, next) => {
  const data = res.locals.data || {
    title: "Success!",
    message: "Task successfully accomplished!",
  };

  res.render("success", {
    title: `${data.title} - VPN`,
    scripts: fileFinder.js("success"),
    data,
  });
};

// CURRENTLY ONLY SUPPORTS PLANS
exports.getCheckout = catchAsync(async (req, res, next) => {
  const { plan } = req.user;

  res.render("checkout", {
    title: "checkout - VPN",
    scripts: fileFinder.js("checkout"),
    plan,
  });
});

// TESTING
exports.getEmail = (req, res, next) => {
  const { template } = req.params;

  res.render(`email/${template}`, {
    title: `${template} - VPN`,
    scripts: fileFinder.js("email"),
    host: `${req.protocol}://${req.get("host")}`,
    link: "/google.com",
  });
};

exports.getError = (req, res, next) => {
  res.render("error", {
    title: "error - VPN",
    data: {
      statusCode: 500,
      message: "Error has occurred!",
    },
    scripts: fileFinder.js("error"),
  });
};
