const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const getName = (Model, plural = false) => {
  if (plural) {
    return Model.collection.collectionName;
  }

  return Model.collection.collectionName.substring(0, Model.collection.collectionName.length - 1);
};

exports.getOne = (Model, ...populates) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const name = getName(Model);

    if (!id) return next(new AppError("Please provide an ID", 400));

    let query = Model.findById(id);

    populates.forEach((pop) => {
      query = query.populate(pop);
    });

    const doc = await query;
    if (!doc)
      return next(new AppError(`${name.charAt(0).toUpperCase() + name.slice(1)} not found`, 404));

    res.status(200).json({
      status: "success",
      data: { [name]: doc },
    });
  });

exports.getAll = (Model, ...populates) =>
  catchAsync(async (req, res, next) => {
    let query = Model.find();

    populates.forEach((pop) => {
      query = query.populate(pop);
    });

    const docs = await query;
    const name = getName(Model, true);

    // if (!docs || docs.length === 0) return next(new AppError(`No ${name} found`, 404));

    res.status(200).json({
      status: "success",
      data: { [name]: docs },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    if (!req.body) return next(new AppError("Please provide JSON data in the body", 400));

    const newDoc = await Model.create(req.body);
    const name = getName(Model);

    res.status(201).json({
      status: "success",
      data: { [name]: newDoc },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const name = getName(Model);

    if (!id) return next(new AppError("Please provide an ID", 400));

    const doc = await Model.findById(id);
    if (!doc) return next(new AppError(`${name} not found`, 404));
    await doc.deleteOne();

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const name = getName(Model);

    if (!id) return next(new AppError("Please provide an ID", 400));

    const newDoc = await Model.updateOne({ id });

    res.status(204).json({
      status: "success",
      data: {
        [name]: newDoc,
      },
    });
  });
