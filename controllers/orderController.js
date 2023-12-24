const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const factoryController = require("./factoryController");

const Order = require("../models/orderModel");
const Product = require("../models/productModel");

/**
 * REMEMBER - Use amazon for functionality reference
 *
 * Payment process for "items" and "plans"
 * 1. User clicks checkout
 *  a. If order contains items -> createPaymentIntent
 * 2. User adds payment info and clicks pay
 *  a. If order contains items -> one time payment for each "item" product
 *  b. If order contains a plan -> create customer -> create subscription
 *
 */

/** Creates order for current user if not already*/
exports.createMyOrder = catchAsync(async (req, res, next) => {
  // Check if current order exists and is pending
  if (req.user.currentOrder && req.user.currentOrder.status === "pending") return next();

  req.user.currentOrder = await Order.create({
    user: req.user._id,
  });

  next();
});

/** Checks if current order exists and throws error if it doesn't */
exports.checkMyOrder = catchAsync(async (req, res, next) => {
  const order = req.user.currentOrder;
  if (!order) return next(new AppError("Please create a new order to access this route", 404));
  if (order.items.length === 0)
    return next(new AppError("Please add items to your order to access this route", 404));

  next();
});

/** Queries current order with populated plans and items */
exports.getMyOrder = catchAsync(async (req, res, next) => {
  if (!req.user.currentOrder)
    return next(new AppError("Please add a product to create an order", 404));

  // FIX - select limited
  const order = await Order.findById(req.user.currentOrder.id).populate("plan");
  // .populate("items.product");

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

/** Adds items in BODY to current order */
exports.addProducts = catchAsync(async (req, res, next) => {
  const { user } = req;
  const order = user.currentOrder;
  const { items, plan } = req.body;

  if (items.length < 0) return next(new AppError("Please provide items to add to this order", 400));

  // Combine items
  order.items = order.items.concat(items);

  // Replace plan if plan is there
  if (plan) order.plan = plan;

  await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

// PLAN
/** Replaces current order's plan */
exports.replacePlan = catchAsync(async (req, res, next) => {
  const { user } = req;
  const order = user.currentOrder;
  const { plan } = req.params;

  if (!plan) return next(new AppError("Please provide a plan id to replace in order", 400));

  order.plan = plan;
  await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.removePlan = catchAsync(async (req, res, next) => {
  const { user } = req;
  const order = user.currentOrder;

  order.plan = undefined;
  await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

// ITEMS -> removed for now
/** Adds item in PARAM to current order */ // -> removed for now
exports.addItem = catchAsync(async (req, res, next) => {
  const order = req.user.currentOrder;
  const { productId } = req.params;

  if (!productId) return next(new AppError("Please provide item's product id", 400));

  // Parse item into object
  const item = { product: productId };

  // Add to order
  order.items.push(item);
  await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

/** Removes PARAM item from current order */ // -> removed for now
exports.removeItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const order = req.user.currentOrder;

  // Remove item
  const exists = order.removeItem(productId);
  if (!exists) return next(new AppError("Item does not exist, please try again", 404));

  await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

/** Clear ALL items in current order */ // -> removed for now
exports.clearItems = catchAsync(async (req, res, next) => {
  const order = req.user.currentOrder;

  // Remove all items
  order.items = [];
  await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

/** Changes PARAM item quantity */ // -> removed for now
exports.changeItemQty = catchAsync(async (req, res, next) => {
  const order = req.user.currentOrder;
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!productId) return next(new AppError("Please provide item's product id", 400));
  if (!quantity) return next(new AppError("Please provide a quantity", 400));

  // Change item quantity
  const exists = order.changeQuantity(productId, quantity);
  if (!exists) return next(new AppError("Item does not exist, please try again", 404));

  await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

// PAYMENT PROCESS
exports.createPlanSubscription = catchAsync(async (req, res, next) => {
  const { user } = req;
  const order = user.currentOrder;

  if (!order.plan)
    return next(new AppError("Please select a plan for this order to be processed", 400));

  // Get plan
  const plan = await Product.findOne({
    _id: order.plan,
    active: true,
  });
  if (!plan) return next(new AppError("Could not find plan in this order", 404));
  if (!user.customerId)
    return next(
      new AppError(
        "Customer Id not found, you may need to confirm your account again to make this payment"
      ),
      404
    );

  let subscription;

  // Retrieve old subscription if available
  if (order.stripeSubscriptionId) {
    subscription = await stripe.subscriptions.retrieve(order.stripeSubscriptionId);
  }

  // Create new subscription if not already created
  if (!order.stripeSubscriptionId) {
    subscription = await stripe.subscriptions.create({
      customer: user.customerId,
      payment_behavior: "default_incomplete", // If no payment method, payment is incomplete
      expand: ["latest_invoice.payment_intent"],
      items: [
        {
          price: plan.stripePriceId,
        },
      ],
    });

    order.stripeSubscriptionId = subscription.id;
  }

  // Respond with client secret
  res.status(200).json({
    subscriptionId: subscription.id,
    clientSecret: subscription.latest_invoice.payment_intent.client_secret,
  });
});

exports.getOrder = factoryController.getOne(Order);
exports.getAllOrders = factoryController.getAll(Order, "items.product", "plan");
exports.createOrder = factoryController.createOne(Order);
exports.deleteOrder = factoryController.deleteOne(Order);
exports.updateOrder = factoryController.updateOne(Order);
