const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const planController = require("./planController");

// CMD command: stripe listen --forward-to 127.0.0.1:3000/api/v1/stripe-webhooks

module.exports = async (req, res) => {
  try {
    // SIGNATURE VERIFICATION
    const event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
    const data = event.data.object;

    // console.log(event.type, data.billing_reason);

    // WEBHOOK HANDLER -> Should work, but can be weird
    switch (event.type) {
      case "invoice.payment_succeeded":
        // Subscription created
        if (data.billing_reason === "subscription_create")
          return await planController.activatePlan(data);

        // Subscription renewed
        if (data.billing_reason === "subscription_cycle")
          return await planController.renewPlan(data);

        // Subscription renewed test
        if (data.billing_reason === "subscription_update" && process.env.NODE_ENV === "development")
          return await planController.renewPlan(data);
        break;

      case "invoice.payment_failed":
        // Failed subscription reniew
        if (data.billing_reason === "subscription_cycle")
          return await planController.deactivatePlan(data);

        // Failed subscription reniew test
        if (data.billing_reason === "subscription_update" && process.env.NODE_ENV === "development")
          return await planController.deactivatePlan(data);
        break;

      // Subscription cancelled
      case "customer.subscription.deleted":
        await planController.cancelPlan(data);
        break;

      default:
    }
  } catch (err) {
    return res.sendStatus(400);
  }

  res.sendStatus(200);
};
