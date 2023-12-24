const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const rateLimit = require("express-rate-limit");

const AppError = require("./utils/appError");

const viewRoutes = require("./routes/viewRoutes");
const userRoutes = require("./routes/userRoutes");
const planRoutes = require("./routes/planRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");

const errorHandler = require("./controllers/errorController");
const webhookHandler = require("./controllers/webhookController");

const app = express();

// Configure live server
const liveReloadServer = livereload.createServer({
  applyCSSLive: true,
});
liveReloadServer.watch(path.join(__dirname, "public"));
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 50);
});

app.use(connectLivereload());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Development logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Rate Limiter
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  onLimitReached: (req, res, options) => {
    options.message = {
      status: "fail",
      reason: "rateLimit",
      resetTime: req.rateLimit.resetTime,
      message: "You are sending too many requests, please try again later",
    };
  },
});
app.use("/api", limiter);

// Parse request body
app.use(process.env.STRIPE_WEBHOOKS_URL, express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10kb" }));

// Implement cors
if (process.env.NODE_ENV === "development") app.use(cors());

// TEST - may be removed
app.enable("trust proxy");

// Set rendering engin
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Parse cookies
app.use(cookieParser());

// ROUTES
app.post(process.env.STRIPE_WEBHOOKS_URL, webhookHandler); // Req.body is rawed already
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/plans", planRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/", viewRoutes);

app.all("*", (req, res, next) => {
  next(new AppError("Route not found!", 404));
});

app.use(errorHandler);

module.exports = app;
