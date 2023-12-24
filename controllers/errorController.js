const AppError = require("../utils/appError");
const fileFinder = require("../utils/fileFinder");

const sendErrorProd = (req, res, err) => {
  // API
  if (req.originalUrl.startsWith("/api")) {
    // operational
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        reason: err.reason,
        message: err.message,
      });
    }

    // non operational
    return res.status(500).json({
      status: "error",
      message: "Something went wrong on the server",
    });
  }

  // VIEW
  if (err.isOperational) {
    const statusCode = err.options.template ? 302 : err.statusCode;

    return res.status(statusCode).render(err.options.template || "error", {
      title: err.options.title || `Error ${err.statusCode}`,
      data: {
        statusCode: err.statusCode,
        reason: err.reason,
        message: err.message,
      },
      scripts: fileFinder.js(err.options.template || "error"),
      ...err.options.locals,
    });
  }

  // non operational
  res.status(err.statusCode).render("error", {
    title: `Error ${err.statusCode}`,
    data: {
      statusCode: err.statusCode,
      reason: err.reason,
      message: err.message,
    },
    scripts: fileFinder.js("error"),
  });
};

const sendErrorDev = (req, res, err) => {
  // API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      reason: err.reason,
      message: err.message,
      error: {
        statusCode: err.statusCode,
        reason: err.reason,
        message: err.message,
        error: err,
        stack: err.stack.split("\n"),
      },
    });
  }

  // VIEW
  if (err.isOperational) {
    const statusCode = err.options.template ? 302 : err.statusCode;

    return res.status(statusCode).render(err.options.template || "error", {
      title: err.options.title || `Error ${err.statusCode}`,
      data: {
        statusCode: err.statusCode,
        reason: err.reason,
        message: err.message,
      },
      scripts: fileFinder.js(err.options.template || "error"),
      ...err.options.locals,
    });
  }

  // non operational
  res.status(err.statusCode).render("error", {
    title: `Error ${err.statusCode}`,
    data: {
      statusCode: err.statusCode,
      reason: err.reason,
      message: err.message,
    },
    scripts: fileFinder.js("error"),
  });
};

// ERROR HANDLERS
const duplicateKeyHandler = (error) => {
  const path = error.message
    .split(/{([^}]*)}/)[1]
    .split(" ")[1]
    .split(":")[0];
  const pathCaps = path[0].toUpperCase() + path.substring(1);

  return new AppError(`${pathCaps} already taken`, 400);
};

const jsonWebTokenErrorHandler = () =>
  new AppError(`Login session invalid, please login again`, 401);

const tokenExpiredErrorHandler = () =>
  new AppError(`Login session expired, please login again`, 401);

const validationErrorHandler = (error) => {
  const err = error.errors[Object.keys(error.errors)[0]];
  return new AppError(err.message, 401);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // DEVELOPMENT
  if (process.env.NODE_ENV === "development") {
    return sendErrorDev(req, res, err);
  }

  // PRODUCTION
  if (process.env.NODE_ENV === "production") {
    let error = Object.create(err);

    if (err.code === 11000) error = duplicateKeyHandler(error);
    if (err.name === "JsonWebTokenError") error = jsonWebTokenErrorHandler();
    if (error.name === "TokenExpiredError") error = tokenExpiredErrorHandler();
    if (error.name === "ValidationError") error = validationErrorHandler(error);

    return sendErrorProd(req, res, error);
  }
};
