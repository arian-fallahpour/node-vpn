const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { filterObj } = require("../utils/helper");

const factoryController = require("./factoryController");

const Plan = require("../models/planModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");

const updatePlan = async (id, body, next) => {
  // Filter updates
  const updates = filterObj(body, "recurring");
  if (Object.keys(updates).length === 0)
    return next(new AppError("Please provide updates before performing this action", 400));

  // Update in API
  return await Plan.findByIdAndUpdate(id, { options: updates }, { new: true, runValidators: true });
};

/** Create pendingPan for current user if not already */
exports.createMyPlan = catchAsync(async (req, res, next) => {
  const { user } = req;
  const product = req.params.productId || req.query.product;

  // Return if there is an active or pending plan
  if (user.plan) return next();

  // Return if view and no product in query
  if (!req.originalUrl.startsWith("/api") && !product) return next();

  // Create new Plan
  user.plan = await Plan.create({
    user: user.id,
    product,
  });

  next();
});

/** Retrieves current users's pending plan */
exports.currentPendingPlan = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { plan } = user;

  if (!user.pendingPlanCount) return next(new AppError("You do not have a pending plan", 404));

  const product = await Product.findById(user.plan.product).select(
    "photo name price durationMonths"
  );
  plan.product = product;

  res.status(200).json({
    status: "success",
    data: {
      plan: plan,
    },
  });
});

/** Retrieves current users's active plan */
exports.currentActivePlan = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { plan } = user;

  if (!user.activePlanCount) return next(new AppError("You do not have an active plan", 404));
  const product = await Product.findById(user.plan.product).select(
    "photo name price durationMonths"
  );
  plan.product = product;

  res.status(200).json({
    status: "success",
    data: {
      plan: plan,
    },
  });
});

/** Removes current pending plan */
exports.removePendingPlan = catchAsync(async (req, res, next) => {
  const { plan } = req.user;

  if (!plan) return next(new AppError("You currently do not have a plan", 400));
  if (plan.status !== "pending") return next(new AppError("Current plan is not pending", 400));

  await plan.deleteOne();

  // Send response if API
  res.status(204).json({
    status: "success",
    data: null,
  });
});

/** Removes current active plan */
exports.removeActivePlan = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { plan } = user;

  if (!plan) return next(new AppError("You currently do not have a plan", 400));
  if (plan.status !== "active") return next(new AppError("Current plan is not active", 400));

  await plan.deleteOne();

  res.status(204).json({
    staus: "success",
    data: null,
  });
});

/** Updates current pending plan's options */
exports.updatePendingPlanOptions = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { plan } = req.user;

  if (user.pendingPlanCount === 0)
    return next(new AppError("You do not have a pending plan!", 404));

  const updated = await updatePlan(plan.id, req.body, next);

  // Send response
  res.status(200).json({
    status: "success",
    data: {
      plan: updated,
    },
  });
});

/** Updates current active plan and subscription's options */
exports.updateActivePlanOptions = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { plan } = req.user;

  if (user.activePlanCount === 0) return next(new AppError("You do not have an active plan!", 404));

  const updated = updatePlan(plan.id, req.body, next);

  // Update subscription in stripe API
  await stripe.subscriptions.update(plan.subscriptionId, {
    cancel_at_period_end: !updated.options.recurring,
  });

  res.status(200).json({
    status: "success",
    data: {
      plan: updated,
    },
  });
});

/** Sets product in pending product as product in params/query */
exports.setProduct = catchAsync(async (req, res, next) => {
  const productId = req.params.productId || req.query.product;
  const { user } = req;
  const { plan } = user;

  if (!req.originalUrl.startsWith("/api") && !plan) return next();
  if (user.pendingPlanCount === 0)
    return req.originalUrl.startsWith("/api")
      ? next(new AppError("You already have an active plan!", 400))
      : next();

  // Update if not the same product
  const same = JSON.stringify(productId) === JSON.stringify(plan.product);
  if (productId && !same) {
    const product = await Product.findOne({ _id: productId, active: true }).select("active");
    if (!product)
      return next(new AppError("Product has not been found, or is not available for sale", 400));

    plan.product = productId;
    await plan.save();
  }

  if (!req.originalUrl.startsWith("/api")) return next();
  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

// SUBSCRIPTION OPERATIONS

/** Updates plan and also creates or retrieves stripe subscription info to set up payment */
exports.createSubscription = catchAsync(async (req, res, next) => {
  const { user } = req;

  // Check if any user has no plans, or any active ones
  if (user.activePlanCount > 0) return next(new AppError("You already have an active plan!", 400));
  if (user.pendingPlanCount === 0)
    return next(new AppError("Please select a plan before performing this action", 400));

  // Update plan if needed
  const updates = filterObj(req.body, "recurring");
  const plan = await Plan.findByIdAndUpdate(
    user.plan.id,
    { options: updates },
    { new: true, runValidators: true }
  ).select("+subscriptionId +clientSecret");

  // Get customer id
  const { customerId } = await User.findById(user.id).select("customerId");

  // Get product and check if it is active
  const product = await Product.findOne({ _id: plan.product, active: true }).select(
    "stripePriceId durationMonths"
  );
  if (!product) return next(new AppError("Product is not for sale, or has not been found", 404));

  // Create subscription if doesn't exist
  if (!plan.subscriptionId) {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      cancel_at_period_end: !plan.options.recurring,
      items: [{ price: product.stripePriceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    // Update plan
    plan.subscriptionId = subscription.id;
    plan.clientSecret = subscription.latest_invoice.payment_intent.client_secret;
    await plan.save();
  }

  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

/** Updates stripe subscription if exists*/
exports.updateSubscription = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { plan } = user;

  if (!plan) return next(new AppError("You currently do not have an active or pending plan", 400));
  if (!plan.subscriptionId)
    return next(new AppError("Please confirm your order before performing this action", 400));

  const subscription = await stripe.subscriptions.update(plan.subscriptionId, req.body);

  res.status(200).json({
    status: "success",
    data: {
      subscription,
    },
  });
});

/** Recycles stripe subscription for testing (must be put before updateSubscription) */
exports.recycleSubscription = catchAsync(async (req, res, next) => {
  req.body = {
    proration_behavior: "none",
    billing_cycle_anchor: "now",
  };

  next();
});

/**
 *  Cancels stripe subscription for testing
 * - This terminates the subscription in stripe without a refund
 * - It also sets active plan status to "cancelled"
 **/
exports.cancelSubscription = catchAsync(async (req, res, next) => {
  const plan = await Plan.findOne({ status: "active" }).select("+subscriptionId");
  if (!plan) return next(new AppError("You currently do not have an active plan", 400));

  // Delete subscription in Stripe
  await stripe.subscriptions.del(plan.subscriptionId);

  // Delete invoice

  // Set plan status to cancelled
  plan.status = "cancelled";
  plan.cancelDate = new Date(Date.now());
  await plan.save();

  // Charge user -> not for now, this function is only used for testing

  // Remove third party VPN functionality
  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

// WEBHOOK FULFILLEMENTS FOR PLANS

/** Sets current pending plan's status to "active" and fulfills it */
// FIX
exports.activatePlan = async (invoiceData) => {
  const plan = await Plan.findOne({ subscriptionId: invoiceData.subscription });

  // Update plan accordingly
  await plan.activate(); // HERE

  // Activate third party VPN functionality
};

/** Renews passed and active subscription plans if recurring is true */
// NOT TESTED - there may be bugs since it also finds for latest passed plan, try to think it out and fix if present
exports.renewPlan = async (invoiceData) => {
  // Get active plan or latest passed plan
  const plan = await Plan.findOne({
    subscriptionId: invoiceData.subscription,
    status: ["active", "passed"],
  })
    .select("+subscriptionId")
    .sort("-endDate")
    .populate("product", "durationMonths");
  if (!plan) return;

  // Set plan status to passed if active
  if (plan.status === "active") await plan.deactivate();

  // Create a new active plan
  await Plan.create({
    user: plan.user,
    product: plan.product._id,
    subscriptionId: plan.subscriptionId,
    options: {
      recurring: true,
    },
    status: "active",
  });

  // Update third party VPN functionality

  console.log("👍 Plan Renewed 👍");
};

/** Sets current active plan's status to "passed" */
exports.deactivatePlan = async (invoiceData) => {
  const plan = await Plan.findOne({
    subscriptionId: invoiceData.subscription,
    status: "active",
  }).populate("product", "durationMonths");

  // Set plan status to passed
  await plan.deactivate();

  // Remove third party VPN functionality
  console.log("👍 Plan deactivated 👍");
};

/** Sets current active plan's status to "cancelled" if not passed already */
exports.cancelPlan = async (subscription) => {
  const plan = await Plan.findOne({ subscriptionId: subscription.id, status: "active" }).populate(
    "product",
    "durationMonths"
  );
  if (!plan) return;

  // Set plan status to cancelled
  await plan.cancel();

  // Remove third party VPN functionality
  console.log("👍 Plan cancelled 👍");
};

exports.getPlan = factoryController.getOne(Plan);
exports.getAllPlans = factoryController.getAll(Plan);
exports.createPlan = factoryController.createOne(Plan);
exports.deletePlan = factoryController.deleteOne(Plan);
exports.updatePlan = factoryController.updateOne(Plan);
