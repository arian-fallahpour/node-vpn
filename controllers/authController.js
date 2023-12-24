const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");

const AppError = require("../utils/appError");
const Email = require("../utils/email");
const catchAsync = require("../utils/catchAsync");
const { timeLeft } = require("../utils/helper");

const User = require("../models/userModel");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

const createSendToken = (res, user, statusCode) => {
  const token = signToken(user._id);

  // Hide password from output
  user.password = undefined;
  user.confirmToken = undefined;
  user.confirmExpires = undefined;

  // Send cookie
  res.cookie("jwt", token, {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    httpOnly: true,
  });

  // Send response
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const createSendTwoFactor = async (req, user) => {
  const code = user.createTwoFactorCode();
  await user.save({ validateBeforeSave: false });

  await new Email(req, user, { code }).sendTwoFactor();

  return code;
};

const validateLogin = async (email, password, next) => {
  if (!email || !password)
    return next(new AppError("Please provide an both email and password", 401));

  // Find user
  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new AppError("Email or password was incorrect", 401));

  // Check if passwords match
  const match = await user.isCorrectPassword(password);
  if (!match) return next(new AppError("Email or password was incorrect", 401));

  return user;
};

const protectError = (req, message, next) => {
  next(
    new AppError(message, 401, {
      template: "signup",
      title: "Sign up to continue",
      locals: { redirect: req.originalUrl, message: "Please sign up to continue" },
    })
  );
};

// FIX: TEST ALL POSSIBILITES
const handleTwoFactor = async (req, user, candidate) => {
  // Automatically create code if 1min has passed
  if (user.twoFactorExpires && timeLeft(user.twoFactorExpires) / 1000 / 60 < 4) {
    await createSendTwoFactor(req, user);
    return "Please provide the code that was just sent to your email";
  }

  // If no code provided and code is on user that is not expired
  if (!candidate && user.twoFactorCode && !user.isTwoFactorExpired())
    return "Please provide the code that was just sent to your email";

  // If code is invalid
  if (user.twoFactorCode && !user.isTwoFactorValid(candidate))
    return "Code is incorrect, please try again";

  // If code is expired
  if (user.twoFactorCode && user.isTwoFactorExpired()) {
    await createSendTwoFactor(req, user);
    return "Code is expired, a new one has been sent to your email";
  }

  // If no code exists on user
  if (!user.twoFactorCode) {
    await createSendTwoFactor(req, user);
    return "Please provide the code that was just sent to your email";
  }

  // If valid and not expired
  user.twoFactorCode = undefined;
  user.twoFactorExpires = undefined;
  await user.save({ validateBeforeSave: false });
};

/** Creates a new user and logs him in with signup details in req.body */
exports.signup = catchAsync(async (req, res, next) => {
  // Check if user exists and/or deactivated
  const existingUser = await User.findOne({ email: req.body.email }).select("active");
  if (existingUser)
    if (!existingUser.active)
      return next(
        new AppError("User has been deactivated, please reactivate your account and login", 400)
      );
    else return next(new AppError("Email has already been taken, please try another one", 400));

  // Create user
  const user = await User.create({
    email: req.body.email,
    fullName: req.body.fullName,
    password: req.body.password,
  });

  // Send welcome email
  await new Email(req, user, null).sendWelcome();

  // Send token and respond
  createSendToken(res, user, 201);
});

/** Logs user in give email and password in req.body */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password, twoFactorCode } = req.body;

  // Authenticate
  const user = await validateLogin(email, password, next);
  if (!user) return next(new AppError("Email or password was incorrect", 401));

  // Check if active
  if (!user.active)
    return next(new AppError("User have been deactivated, please reactivate to login", 401));

  // If 2fa enabled
  if (user.twoFactor) {
    const message = await handleTwoFactor(req, user, twoFactorCode);
    if (message) return next(new AppError(message, 401, { reason: "twoFactor" }));
  }

  // Send token and response
  createSendToken(res, user, 200);
});

/** Route required login credientials in req.body before proceeding */
exports.requiresLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError("You must provide login details before accessing this route", 401));

  // Authenticate
  const user = await validateLogin(email, password, next);

  // Save user to request
  req.user = user;

  // Allow next middleware if validated
  next();
});

/** Removes the "jwt" cookie, but does not remove the token in Postman */
exports.logout = catchAsync(async (req, res, next) => {
  // Not logged out in postman due to token still being there
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
  });
});

/** Protects route by only allowing logged in users to access it*/
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // Set token
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer"))
    token = req.headers.authorization.split(" ")[1];
  else if (req.cookies.jwt) token = req.cookies.jwt;

  // Check if token exists
  if (!token) return protectError(req, "Please log in to continue", next);
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user exists -> do NOT select password
  const user = await User.findById(decoded.id);
  if (!user) return protectError(req, "Invalid session id, please log in again", next);

  // Check if user recently changed password
  const changed = user.changedPasswordAfter(decoded.iat);
  if (changed)
    return protectError(req, "User recently changed password, please log in again", next);

  // Check if user has been deactivated
  if (!user.active)
    return protectError(
      req,
      "User has been deactivated, please reactivate to access this route",
      next
    );

  // Grant access to route
  req.user = user;
  res.locals.user = user;
  next();
});

/** Checks if user exists and adds to request if exists */
exports.isLoggedIn = async (req, res, next) => {
  try {
    let token;

    // Set token
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer"))
      token = req.headers.authorization.split(" ")[1];
    else if (req.cookies.jwt) token = req.cookies.jwt;

    // Check if token exists
    if (!token) return next();
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user exists -> do NOT select password
    const user = await User.findById(decoded.id).select("-pendingPlanCount");
    if (!user) return next();

    // Check if user recently changed password
    const changed = user.changedPasswordAfter(decoded.iat);
    if (changed) return next();

    // Check if user has been deactivated
    if (!user.active) return next();

    // Grant access to route
    req.user = user;
    res.locals.user = user;
    return next();
  } catch (err) {
    return next();
  }
};

/** User must be confirmed in order to access this route */
exports.mustBeConfirmed = (req, res, next) => {
  const { user } = req;

  if (!user.confirmed && user.role !== "admin")
    return next(new AppError("Please confirm your account before accessing this route", 401));

  next();
};

/** Does not allow logged in user to acces unless role is in parameter */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(new AppError("You do not have permission to access this route", 401));

    next();
  };
};

exports.mustBeLoggedOut = (req, res, next) => {
  if (req.user) {
    if (req.user.role === "admin") return next();

    return res.redirect("/");
  }

  return next();
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return next(new AppError("Please provide both your current password and a new one", 400));

  // Get user -> encryption fails due to no password in req.user
  const user = await User.findById(req.user.id).select("+password");

  // Check if currentPassword is correr
  const match = await user.isCorrectPassword(currentPassword);
  if (!match) return next(new AppError("Current password is incorrect", 400));

  // Check if new password is the same
  if (newPassword === currentPassword)
    return next(new AppError("New password must be different than current one", 400));

  // Update password
  user.password = newPassword;
  await user.save();

  createSendToken(res, user, 200);
});

/** Sends a password reset token to specified email */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Check if email was provided
  if (!email) return next(new AppError("Please provide an email to send the link to", 400));

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) return next(new AppError("Email does not belong to a user, please try again", 400));

  // Create password reset token
  const token = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Create reset link
  const link = `${req.protocol}://${req.get("host")}/reset-password/${token}`;

  // Send to user's email
  await new Email(req, user, { link }).sendPasswordReset();

  // Send response
  res.status(200).json({
    status: "success",
    message: "The password reset link/token has been sent to your email!",
  });
});

/** Accepts a password reset token with new password and confirm new password API ONLY*/
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;

  // Check if token has been provided
  if (!token)
    return next(
      new AppError("Please provide a password reset token", 401, { reason: "resetToken" })
    );

  // Check if new password and confirm password are present
  if (!newPassword || !confirmPassword)
    return next(new AppError("Please provide the new password and confirm password", 400));

  // Check if new password and confirm password are the same
  if (newPassword !== confirmPassword)
    return next(new AppError("Please provide the identical passwords", 400));

  // Create hashed version of token
  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  // Check if user exists with hash and is not expired
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("Reset token is invalid or has expired", 400));

  // Change password if user exists
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.password = newPassword;
  await user.save();

  // Send response
  createSendToken(res, user, 200);
});

exports.createConfirmToken = catchAsync(async (req, res, next) => {
  const { user } = req;
  if (!user) return next(new AppError("Please login to send confirmation token", 400));
  if (user.confirmed) return next(new AppError("You have already been confirmed!", 400));

  // Create confirmation token
  const token = user.createConfirmationToken();
  await user.save({ validateBeforeSave: false });

  const link = `${req.protocol}://${req.get("host")}/confirm-user/${token}`;

  // Send confirmation email
  await new Email(req, user, { link }).sendConfirm();

  res.status(200).json({
    status: "success",
    message: "Token successfully sent",
  });
});

exports.confirmUser = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  if (!token) return next(new AppError("Please provide a confirmation token", 400));

  // Create encryption
  const confirmToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user
  const user = await User.findOne({
    confirmToken,
    confirmExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("Confirmation token invalid or expired", 400));

  // Confirm user and remove token
  user.confirmed = true;
  user.confirmToken = undefined;
  user.confirmExpires = undefined;
  await user.save();

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      status: "success",
      message: "User successfully confirmed!",
    });
  }

  res.locals.data = {
    title: "Successfully confirmed!",
    message: "Your account has been successfully confirmed!",
  };
  return next();
});

exports.enableTwoFactor = catchAsync(async (req, res, next) => {
  const { user } = req;
  if (user.twoFactor)
    return next(new AppError("You already have two factor authentication enabled!", 400));

  user.twoFactor = true;
  await user.save();

  res.status(200).json({
    status: "Success",
    message: "Your account now has two factor authentication!",
  });
});

exports.disableTwoFactor = catchAsync(async (req, res, next) => {
  const { user } = req;
  if (!user.twoFactor)
    return next(new AppError("You do not have two factor authentication enabled!", 400));

  user.twoFactor = false;
  await user.save();

  res.status(200).json({
    status: "Success",
    message: "Your account no longer has two factor authentication!",
  });
});
