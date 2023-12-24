const mongoose = require("mongoose");
const idValidator = require("mongoose-id-validator");

/**
 * ORDER MODEL EXPLANATION
 *
 * - You can get current order
 * - You can add one or multiple items
 * - You can change quantity of an item
 * - You can delete an item
 *
 * - Status indicates if order is pending, payed, or cancelled
 */

const itemSchema = new mongoose.Schema({
  _id: { select: false },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "item",
    required: [true, "Please provide the product ID for this item"],
  },
  quantity: {
    type: Number,
    default: 1,
    min: [0, "Cannot have negative quantity values"],
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Please provide a user for this order"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      immutable: true,
    },
    fulfilledAt: Date,
    status: {
      type: String,
      enum: {
        values: ["pending", "success", "cancelled"],
      },
      default: "pending",
    },
    stripeSubscriptionId: String,
    plan: {
      type: mongoose.Schema.ObjectId,
      ref: "plan",
    },
    // Items removed for now since we don't need it
    // items: {
    //   type: [itemSchema],
    //   validate: {
    //     // Limit of 10 items
    //     validator: function (items) {
    //       let sum = 0;

    //       items.forEach((item) => {
    //         sum += item.quantity;
    //       });

    //       return sum <= 10;
    //     },
    //     message: "Cannot have more than 10 items in your order",
    //   },
    // },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** Validates if provided id is from defined ref */
orderSchema.plugin(idValidator, {
  message: function (obj) {
    const path = obj.path.charAt(0).toUpperCase() + obj.path.slice(1);
    return `${path} id does not appear to be from correct collection`;
  },
});

/** Automatically remove items that have 0 quantity */
// orderSchema.pre("save", function (next) {
//   this.items = this.filterEmptyItems(this.items);
//   next();
// });

/** Automatically combine items */
// orderSchema.pre("save", function (next) {
//   this.items = this.combineItems(this.items);
//   next();
// });

// OPERATIONS
/** Removes items from order*/
orderSchema.methods.removeItem = function (productId) {
  const index = this.items.findIndex(
    (item) => JSON.stringify(item.product) === JSON.stringify(productId)
  );

  // Return false if item does not exist
  if (index === -1) return false;
  this.items.splice(index, 1);

  return true;
};

/** Changes quantity of item with productId */
orderSchema.methods.changeQuantity = function (productId, quantity) {
  const index = this.items.findIndex(
    (item) => JSON.stringify(item.product) === JSON.stringify(productId)
  );

  // Return false if item exists
  if (index === -1) return false;
  this.items[index].quantity = quantity;

  return true;
};

// FUNCTIONS
orderSchema.methods.filterEmptyItems = function (items) {
  return items.filter((item) => item.quantity && item.quantity > 0);
};

/** Combines same items and changes their quantity */
orderSchema.methods.combineItems = function (items) {
  const result = [];

  items.forEach(function (item) {
    // *useful before saving* -> sets any undefined quantity to 1
    if (!item.quantity) item.quantity = 1;

    // Combines duplicate items
    if (!this[item.product]) {
      this[item.product] = { product: item.product, quantity: 0 };
      result.push(this[item.product]);
    }
    this[item.product].quantity += item.quantity;
  }, Object.create(null));

  return result;
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
