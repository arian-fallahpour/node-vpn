const express = require("express");
const rateLimit = require("express-rate-limit");

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

const plan = { path: "plan", match: { status: ["pending", "active"] } };

const forgotLimit = rateLimit({
  max: 1,
  windowMs: 60 * 1000,
  skipFailedRequests: true,
  onLimitReached: (req, res, options) => {
    options.message = {
      status: "fail",
      reason: "rateLimit",
      resetTime: req.rateLimit.resetTime,
      message: "You can only send one reset link every 60 seconds",
    };
  },
});

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

router.post("/forgot-password", forgotLimit, authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);

router.post("/reactivate-me", authController.requiresLogin, userController.reactivateMe);

// MUST BE LOGGED IN
router.use(authController.protect);

// user
router.get("/current-user", userController.getCurrentUser);
router.patch("/update-current-user", userController.updateCurrentUser);
router.patch("/update-password", authController.updatePassword);
router.delete(
  "/deactivate-me",
  authController.requiresLogin,
  userController.deactivateMe,
  authController.logout
);

// confirmation
router.post("/create-confirm-token", authController.createConfirmToken);
router.patch("/confirm-user/:token", authController.confirmUser);

// two factor
router.patch("/enable-twoFactor", authController.enableTwoFactor);
router.patch("/disable-twoFactor", authController.disableTwoFactor);

// MUST BE CONFIRMED
router.use(authController.mustBeConfirmed);

// checkout
router.get("/current-checkout", userController.populate(plan), userController.currentCheckoutInfo);

// payment methods
router.get("/current-payment-methods", userController.currentPaymentMethods);
router.patch("/update-payment-method/:id", userController.updatePaymentMethod);
router.delete("/detach-payment-method/:id", userController.detachPaymentMethod);

// MUST BE ADMIN
router.use(authController.restrictTo("admin"));

router.route("/").get(userController.getAllUsers).post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
