const idValidator = require("mongoose-id-validator");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

const User = require("./userModel");
const Product = require("./productModel");

const AppError = require("../utils/appError");

const optionsSchema = new mongoose.Schema({
  recurring: {
    type: Boolean,
    default: false,
  },
});

const planSchema = new mongoose.Schema(
  {
    cardName: String,
    user: {
      type: mongoose.Schema.ObjectId,
      required: [true, "Please provide a user for this plan"],
      ref: "User",
    },
    product: {
      type: mongoose.Schema.ObjectId,
      required: [true, "Please provide the product for this plan"],
      ref: "plan",
    },
    subscriptionId: {
      type: String,
      select: false,
    },
    clientSecret: {
      type: String,
      select: false,
    },
    status: {
      type: String,
      enum: {
        // Cancelled = cancelled mid-plan, passed = plan was used up
        values: ["pending", "active", "cancelled", "passed"],
        message:
          "Status can only be one of the following: 'pending', 'active', 'cancelled', 'passed'",
      },
      default: "pending",
    },
    startDate: Date,
    endDate: Date,
    cancelDate: Date,
    options: {
      type: optionsSchema,
      default: () => ({}),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

planSchema.plugin(idValidator, {
  message: function (obj) {
    const path = obj.path.charAt(0).toUpperCase() + obj.path.slice(1);
    return `${path} id not found`;
  },
});

planSchema.virtual("progress").get(function () {
  if (this.status !== "active") return;

  const end = this.endDate.getTime();
  const start = this.startDate.getTime();
  const now = new Date(Date.now()).getTime();

  return (now - start) / (end - start);
});

planSchema.virtual("daysLeft").get(function () {
  if (this.status !== "active") return;

  const end = this.endDate.getTime() / 1000 / 60 / 60 / 24;
  const now = new Date(Date.now()).getTime() / 1000 / 60 / 60 / 24;

  return Math.ceil(end - now);
});

// PLAN COUNT MIDDLEWARE
/** Increments Pending plan count only if no active/pending plans */
planSchema.pre("save", async function (next) {
  if (
    (this.isNew && this.status === "pending") ||
    (this.isModified("status") && this.status === "pending")
  ) {
    const user = await User.findById(this.user).select("pendingPlanCount activePlanCount");

    // Only allow one pending plan
    if (user.pendingPlanCount > 0)
      return next(new AppError("You already have a pending plan", 400));

    // Do not allow if there is already an active plan
    if (user.activePlanCount > 0)
      return next(new AppError("You already have an active plan!", 400));

    // Update user pending count
    user.pendingPlanCount += 1;
    await user.save();
  }
  next();
});

/** Increments activePlanCount AND resets pendingPlanCount */
planSchema.pre("save", async function (next) {
  if (
    (this.isNew && this.status === "active") ||
    (this.isModified("status") && this.status === "active")
  ) {
    const user = await User.findById(this.user).select("activePlanCount pendingPlanCount");

    // Only allow one pending plan
    if (user.activePlanCount > 0) return next(new AppError("You already have an active plan", 400));

    // Update user pending count
    user.activePlanCount += 1;
    user.pendingPlanCount = 0;
    await user.save();
  }
  next();
});

/** Resets user's activePlanCount if plan has been cancelled */
planSchema.pre("save", async function (next) {
  if (this.isModified("status") && this.status === "cancelled")
    await User.findByIdAndUpdate(this.user, { activePlanCount: 0 });

  next();
});

/** Resets user's activePlanCount if plan has been passed */
planSchema.pre("save", async function (next) {
  if (this.isModified("status") && this.status === "passed")
    await User.findByIdAndUpdate(this.user, { activePlanCount: 0 });

  next();
});

/** Resets user's activePlanCount OR pendingPlanCount if plan is deleted */
planSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  const paths = {
    pending: "pendingPlanCount",
    active: "activePlanCount",
  };

  // Reset pendingPlanCount OR activePlanCount
  await User.findByIdAndUpdate(this.user, { [paths[this.status]]: 0 }, { runValidators: true });

  next();
});

/** Adds relative fields when a new active plan is created*/
planSchema.pre("save", async function (next) {
  if (!this.isNew || this.status !== "active") return next();

  const product = await Product.findById(this.product);
  if (!product) return next(new AppError("Product not found, please try again", 400));

  this.startDate = new Date(Date.now());
  this.endDate = new Date(Date.now() + product.durationMonths * 30 * 24 * 60 * 60 * 1000);
});

// SUBSCRIPTIONID AND CLIENTSECRET MIDDLEWARE
/** Removes subscriptionId and clientSecret if product has been changed */
planSchema.pre("save", function (next) {
  if (this.isNew || !this.isModified("product")) return next();

  this.subscriptionId = undefined;
  this.clientSecret = undefined;

  next();
});

/** Activates plan, adds and removes relevant fields */
planSchema.methods.activate = async function () {
  const product = await Product.findById(this.product).select("durationMonths");
  if (!product) return;

  this.status = "active";
  this.startDate = new Date(Date.now());
  this.endDate = new Date(Date.now() + product.durationMonths * 30 * 24 * 60 * 60 * 1000);
  this.clientSecret = undefined;

  await this.save();
};

/** Deactivates plan, adds and removes relevant fields */
planSchema.methods.deactivate = async function () {
  this.status = "passed";

  await this.save();
};

/** Cancels plan, adds and removes relevant fields */
planSchema.methods.cancel = async function () {
  this.status = "cancelled";
  this.cancelDate = new Date(Date.now());

  await this.save();
};

const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;
