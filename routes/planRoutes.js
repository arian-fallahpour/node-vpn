const express = require("express");

const planController = require("../controllers/planController");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const router = express.Router();

// populates
const plan = { path: "plan", match: { status: ["pending", "active"] } };
const subscription = { ...plan, select: "+subscriptionId +clientSecret" };

// MUST BE LOGGED IN
router.use(authController.protect);

// MUST BE CONFIRMED
router.use(authController.mustBeConfirmed);

router.put(
  "/set-plan-product/:productId",
  userController.populate(plan),
  planController.createMyPlan,
  planController.setProduct
);
router.delete(
  "/remove-pending-plan",
  userController.populate(plan),
  planController.removePendingPlan
);
router.patch(
  "/update-pending-plan",
  userController.populate(plan),
  planController.updatePendingPlanOptions
);
router.patch(
  "/update-active-plan",
  userController.populate(subscription),
  planController.updateActivePlanOptions
);
router.get(
  "/current-pending-plan",
  userController.populate(plan),
  planController.currentPendingPlan
);
router.get("/current-active-plan", userController.populate(plan), planController.currentActivePlan);

router.post(
  "/create-subscription",
  userController.populate({ ...plan, select: "id" }),
  planController.createSubscription
);

// MUST BE ADMIN
router.use(authController.restrictTo("admin"));

router.delete("/cancel-subscription", planController.cancelSubscription);
router.patch(
  "/update-subscription",
  userController.populate(subscription),
  planController.updateSubscription
);
router.patch(
  "/recycle-subscription",
  userController.populate(subscription),
  planController.recycleSubscription,
  planController.updateSubscription
);

router.delete(
  "/remove-active-plan",
  userController.populate(plan),
  planController.removeActivePlan
);

router.route("/").get(planController.getAllPlans).post(planController.createPlan);
router
  .route("/:id")
  .get(planController.getPlan)
  .patch(planController.updatePlan)
  .delete(planController.deletePlan);

module.exports = router;
