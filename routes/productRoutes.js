const express = require("express");

const productController = require("../controllers/productController");
const authController = require("../controllers/authController");

const router = express.Router();

// MUST BE LOGGED IN
router.use(authController.protect);

// MUST BE CONFIRMED
router.use(authController.mustBeConfirmed);

// MUST BE ADMIN
router.use(authController.restrictTo("admin"));

router.patch("/toggle-product-activity/:id", productController.toggleActivity);

router.route("/").get(productController.getAllProducts).post(productController.createProduct);
router
  .route("/:id")
  .get(productController.getProduct)
  .patch(productController.updateProduct) // testing purposes only
  .delete(productController.deleteProduct); // testing purposes only -> Remove from stripe dashboard

module.exports = router;
