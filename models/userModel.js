const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const mongoose = require("mongoose");

/** SCHEMA EXPLANATION
 *
 * plans
 * - array with start and end date
 * - indicates each and every time a user bought vpn
 * - includes a cancelDate for the day that they cancelled
 * - includes status: ["active", "cancelled", "passed", "removed"]
 *      - removed is when the whole period is cancelled
 *      - cancelled is when part of the period was cancelled
 *
 **/

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: [true, "Email already taken"],
      trim: true,
      lowercase: true,
      maxLength: [150, "Email cannot exceed 150 characters"],
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    fullName: {
      type: String,
      required: [true, "Please provide your full name"],
      trim: true,
      lowercase: true,
      maxLength: [100, "Your full name cannot exceed 100 characters"],
      validate: {
        validator: function (val) {
          return val.split(" ").length > 1;
        },
        message: "Please provide your first and last name with a space in between",
      },
    },
    photo: {
      type: String,
      maxLength: [300, "Image name cannot be more than 300 characters"],
      default: "default-1.png",
    },
    role: {
      type: String,
      default: "user",
      enum: {
        values: ["user", "admin"],
        message: "Role must be either user or admin",
      },
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minLength: [8, "Password must be at least 8 characters long"],
      maxLength: [300, "Password cannot be more than 300 characters long"],
      select: false,
    },
    passwordChangedAt: Date, // ADD: change on password modification
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactor: {
      type: Boolean,
      default: false,
    },
    twoFactorCode: String,
    twoFactorExpires: Date,
    confirmed: {
      type: Boolean,
      default: false,
    },
    confirmToken: String,
    confirmExpires: Date,
    customerId: {
      type: String,
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    pendingPlanCount: {
      type: Number,
      default: 0,
      max: [1, "You cannot have more than one pending plan"],
      min: 0,
    },
    activePlanCount: {
      type: Number,
      default: 0,
      max: [1, "You cannot have more than one active plan"],
      min: 0,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("plan", {
  ref: "Plan",
  foreignField: "user",
  localField: "_id",
  justOne: true,
});

// Encrypts password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// Sets passwordChangedAt
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

/** Automatically removes confirmed status if email has been changed */
userSchema.pre("save", async function (next) {
  if (!this.isModified("email")) return;
  this.confirmed = false;

  next();
});

/** Automatically create stripe customer if confirmed and haven't already*/
userSchema.pre("save", async function (next) {
  if (this.isModified("confirmed") && this.confirmed && !this.customerId) {
    const stripeCustomer = await stripe.customers.create({
      name: this.fullName,
      email: this.email,
    });
    this.customerId = stripeCustomer.id;
  }
  next();
});

// Compares password -> password must be selected
userSchema.methods.isCorrectPassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

// Checks if password has been changed after
userSchema.methods.changedPasswordAfter = function (candidate) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return candidate < changedAt;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  this.passwordResetExpires = Date.now() + 1000 * 60 * 5; // 5 minute expiry

  return token;
};

// Creates and manages confirmation token
userSchema.methods.createConfirmationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  this.confirmToken = crypto.createHash("sha256").update(token).digest("hex");
  this.confirmExpires = Date.now() + 1000 * 60 * 10; // 10 minute expiry

  return token;
};

// Creates and manages two factor authentication token
userSchema.methods.createTwoFactorCode = function () {
  const code = crypto.randomBytes(5).toString("hex");

  this.twoFactorCode = crypto.createHash("sha256").update(code).digest("hex");
  this.twoFactorExpires = Date.now() + 1000 * 60 * 5; // 5 minute expiry

  return code;
};

userSchema.methods.isTwoFactorExpired = function () {
  return Date.now() > this.twoFactorExpires.getTime();
};

userSchema.methods.isTwoFactorValid = function (candidate) {
  const code = crypto.createHash("sha256").update(candidate).digest("hex");
  return this.twoFactorCode === code;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
