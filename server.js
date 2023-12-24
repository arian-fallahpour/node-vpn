const dotenv = require("dotenv");
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("💥 UNHANDLED EXCEPTION 💥 Shutting down...");
  console.log(err);
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });

const app = require("./app");

const DB = process.env.DB_CONNECT.replace("<password>", process.env.DB_PASS);
mongoose
  .connect(DB, {
    useCreateIndex: true,
    useFindAndModify: false,
    autoIndex: true,
    useUnifiedTopology: true,
    writeConcern: true,
  })
  .then(() => console.log("<-- DATABASE CONNECTION SUCCESS -->"));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`<-- App running on port ${port} - ${process.env.NODE_ENV} -->`);
});

process.on("unhandledRejection", (err) => {
  console.log("💥 UNHANDLED REJECTION 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("👍 SIGTERM RECIEVED 👍 Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
  });
});

/**
 * TO DO LIST
 * - renew subscription
 * - implement payment method management
 * - Finish front end functionality
 * - Implement profile picture functionality
 * - Review payment/subscription process for breaking bugs
 * - Set up integration with VPN api
 *
 * - Set up webhook in production
 * - Integrate Sendgrid in production
 **/
