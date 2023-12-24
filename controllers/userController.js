const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { filterObj } = require("../utils/helper");

const factoryController = require("./factoryController");

const User = require("../models/userModel");
const Product = require("../models/productModel");

/** Retrieves logged in user's data */
exports.getCurrentUser = catchAsync(async (req, res, next) => {
  const { user } = req;

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

/** Updates current user's name, email and/or photo */
exports.updateCurrentUser = catchAsync(async (req, res, next) => {
  const updates = filterObj(req.body, "email", "fullName", "photo");

  // If no changes in filtered
  if (Object.keys(updates).length === 0)
    return next(new AppError("Please provide updates before performing this action", 400));

  // Update user
  const user = await User.findById(req.user.id).select("email fullName photo");
  if (updates.email) user.email = updates.email;
  if (updates.fullName) user.fullName = updates.fullName;
  if (updates.photo) user.photo = updates.photo;
  await user.save();

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

/** Sets current user's active to false */
exports.deactivateMe = catchAsync(async (req, res, next) => {
  const { user } = req;

  if (user) await User.findByIdAndUpdate(user.id, { active: false });

  next();
});

/** Sets current user's active to true */
exports.reactivateMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: true });

  res.status(200).json({
    status: "success",
    message: "User has been successfully reactivated!",
    user,
  });
});

exports.currentCheckoutInfo = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { plan } = user;

  if (!plan)
    return next(
      new AppError("Please add a plan to proceed with your order", 400, { reason: "noPlan" })
    );
  if (plan.status === "active")
    return next(new AppError("You already have an active plan!", 400, { reason: "activePlan" }));

  const product = await Product.findById(plan.product).select("photo name price durationMonths");
  plan.product = product;

  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

exports.currentPaymentMethods = catchAsync(async (req, res, next) => {
  const { user } = req;

  // Get user's customerId
  const { customerId } = await User.findById(user.id).select("customerId");

  // Get user's payment methods from stripe
  const paymentMethods = (
    await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    })
  ).data;

  // First card is default one
  res.status(200).json({
    status: "success",
    results: paymentMethods.length,
    data: {
      paymentMethods: paymentMethods,
    },
  });
});

// NOT DONE
exports.updatePaymentMethod = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const paymentMethod = await stripe.paymentMethods.update(id, {
    card: {},
  });
});

exports.detachPaymentMethod = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  await stripe.paymentMethods.detach(id);

  res.status(204).json({
    status: "success",
    message: "Payment method successfully removed",
  });
});

exports.populate = (...populates) =>
  catchAsync(async (req, res, next) => {
    const { user } = req;
    if (!user) return next();

    await User.populate(user, populates);

    next();
  });

exports.getUser = factoryController.getOne(User, "currentOrder");
exports.getAllUsers = factoryController.getAll(User);
exports.createUser = factoryController.createOne(User);
exports.deleteUser = factoryController.deleteOne(User);
exports.updateUser = factoryController.updateOne(User);

exports.login = catchAsync(async (req, res, next) => {});
