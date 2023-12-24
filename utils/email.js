const nodemailer = require("nodemailer");
const pug = require("pug");
const { convert } = require("html-to-text");

module.exports = class Email {
  constructor(req, user, data) {
    this.to = user.email;
    this.from = process.env.EMAIL_FROM;
    this.fullName = user.fullName;
    this.data = data;
    this.host = `${req.protocol}://${req.get("host")}`;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      ...this.data,
      host: this.host,
      fullName: this.fullName,
      subject,
    });

    const options = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    await this.newTransport().sendMail(options);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to vpn!");
  }

  async sendConfirm() {
    await this.send("confirm", "Please confirm your account! (valid for 10 minutes)");
  }

  async sendTwoFactor() {
    await this.send(
      "twoFactor",
      "Your two factor authentication code is here! (valid for 5 minutes)"
    );
  }

  async sendPasswordReset() {
    await this.send("passwordReset", "Your password reset link is here! (valid for 5 minutes)");
  }
};
