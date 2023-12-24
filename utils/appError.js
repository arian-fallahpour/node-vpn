module.exports = class AppError extends Error {
  constructor(message, statusCode, options = {}) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.reason = options.reason || null;
    this.isOperational = true;

    /**
     * template: rendered template
     *
     * title: title of website
     *
     * locals: destructered into render globals data
     *
     * reason: optional data used to distinction between different reasons for the error
     */
    this.options = options;

    Error.captureStackTrace(this, this.constructor);
  }
};
