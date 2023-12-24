const express = require("express");

const viewController = require("../controllers/viewController");
const authController = require("../controllers/authController");
const planController = require("../controllers/planController");
const userController = require("../controllers/userController");

const router = express.Router();

const plan = { path: "plan", match: { status: ["pending", "active"] } };

// PUBLIC
router.get("/", authController.isLoggedIn, viewController.getHome);

router.get(
  "/login",
  authController.isLoggedIn,
  authController.mustBeLoggedOut,
  viewController.getLogin
);
router.get(
  "/signup",
  authController.isLoggedIn,
  authController.mustBeLoggedOut,
  viewController.getSignup
);

router.get(
  "/forgot-password",
  authController.isLoggedIn,
  authController.mustBeLoggedOut,
  viewController.getForgotPassword
);
router.get(
  "/reset-password/:token",
  authController.isLoggedIn,
  authController.mustBeLoggedOut,
  viewController.getResetPassword
);

router.get(
  "/confirm-user/:token",
  authController.isLoggedIn,
  authController.confirmUser,
  viewController.getSuccess
);

// LOGGED IN
router.get(["/profile", "/profile/:page"], authController.protect, viewController.getProfile);
router.get(
  "/checkout",
  authController.protect,
  userController.populate(plan),
  planController.createMyPlan,
  planController.setProduct,
  viewController.getCheckout
);

// ADMIN ONLY
router.use(authController.protect, authController.restrictTo("admin"));

// TEST
router.get("/error", viewController.getError);
router.get("/success", viewController.getSuccess);
router.get("/emails/:template", viewController.getEmail);

module.exports = router;
