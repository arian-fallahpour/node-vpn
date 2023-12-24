const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const factoryController = require("./factoryController");
const Product = require("../models/productModel");

exports.toggleActivity = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) return next(new AppError("Please provide a product id", 400));

  const product = await Product.findById(id);
  product.active = !product.active;
  await product.save();

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});

exports.getProduct = factoryController.getOne(Product);
exports.getAllProducts = factoryController.getAll(Product);
exports.createProduct = factoryController.createOne(Product);
exports.deleteProduct = factoryController.deleteOne(Product);
exports.updateProduct = factoryController.updateOne(Product);
