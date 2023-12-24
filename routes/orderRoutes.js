const express = require("express");

const orderController = require("../controllers/orderController");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const router = express.Router();

router.use((req, res, next) => {
  res.status(503).json({
    status: "error",
    message: "This route is currently disabled because it is being either unused, or modified",
  });
});

const populate = { path: "currentOrder", match: { status: "pending" } };

// MUST BE LOGGED IN
// router.use(authController.protect(populate));
router.use(authController.protect);
router.use(userController.populate(populate));

// MUST BE CONFIRMED
router.use(authController.mustBeConfirmed);

// all
router.get("/my-order", orderController.getMyOrder);
// router.put("/create-add-products", orderController.createMyOrder, orderController.addProducts); -> Removed for now

// plan
router.put("/create-add-plan/:plan", orderController.createMyOrder, orderController.replacePlan);
router.delete("/remove-plan", orderController.checkMyOrder, orderController.removePlan);

// items -> (REMOVED FOR NOW)
// router.put("/create-add-item/:productId", orderController.createMyOrder, orderController.addItem);
// router.delete("/remove-item/:productId", orderController.checkMyOrder, orderController.removeItem);
// router.delete("/clear-items", orderController.checkMyOrder, orderController.clearItems);
// router.patch(
//   "/change-item-quantity/:productId",
//   orderController.checkMyOrder,
//   orderController.changeItemQty
// );

// payment process
router.post("/create-plan-subscription", orderController.createPlanSubscription);

// MUST BE ADMIN
router.use(authController.restrictTo("admin"));

router.post("/create-my-order", orderController.createMyOrder); // testing purposes only -> does not return response

router.route("/").get(orderController.getAllOrders).post(orderController.createOrder); // testing purposes only

router // for Testing purposes
  .route("/:id")
  .get(orderController.getOrder)
  .patch(orderController.updateOrder) // testing purposes only
  .delete(orderController.deleteOrder); // testing purposes only

module.exports = router;
