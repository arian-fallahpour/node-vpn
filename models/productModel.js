const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * NOTES:
 * - MAY NEED TO CREATE INVOICES TO COMBINE SUBSCRIPTIONS AND ONE TIME PAYMENTS https://stackoverflow.com/questions/59687006/adding-products-to-a-payment-with-paymentintents-api
 * - KEEP IN MIND - Adding a new product type may need to be configured in order, stripe and fulfillment
 * - Find way to delete product/price when product is deleted
 */

/**
 * PRODUCTSCHEMA
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      lowercase: true,
      unique: [true, "Please provide another name"],
      maxLength: [50, "Name cannot exceed 50 characters"],
      required: [true, "Please provide a name for this product"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      immutable: true,
    },
    // One time payment price or monthly cost price
    price: {
      type: Number,
      required: [true, "Please provide a price for this product"],
      min: [0, "Price cannot have a negative value"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (discount) {
          if (discount) {
            return discount < this.price;
          }
          return true;
        },
        message: "Discount price must be lower than normal price",
      },
    },
    stripeProductId: {
      type: String,
      immutable: true,
      select: false,
    },
    stripePriceId: {
      type: String,
      immutable: true,
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    photo: {
      type: String,
      default: "default-1.png",
    },
  },
  {
    discriminatorKey: "type",
  }
);

/**
 * PLANSCHEMA
 */
const planSchema = new mongoose.Schema({
  durationMonths: {
    type: Number,
    required: [true, "Please provide the durationMonths"],
    min: [1, "DurationMonths must be at least one month"],
  },
});

/** Creates stripeProduct*/
planSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  // Create product
  const stripeProduct = await stripe.products.create({
    name: this.name,
  });

  // Set stripeProductId
  this.stripeProductId = stripeProduct.id;

  next();
});

/** Creates recurring stripePrice */
planSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  // Create custom pricing for product.type = plan
  const stripePrice = await stripe.prices.create({
    product: this.stripeProductId,
    unit_amount: Math.floor(this.price * this.durationMonths * 100), // cents
    currency: "cad",
    recurring: {
      interval: "month",
      interval_count: this.durationMonths,
    },
  });

  // Set pricing id
  this.stripePriceId = stripePrice.id;

  next();
});

/** enable/disable PRODUCT */
planSchema.pre("save", async function (next) {
  if (!this.isModified("active")) return next();

  await stripe.products.update(this.stripeProductId, { active: this.active });
  next();
});

const Product = mongoose.model("Product", productSchema);
Product.discriminator("plan", planSchema);

module.exports = Product;
