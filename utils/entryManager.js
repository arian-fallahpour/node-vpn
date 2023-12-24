const fs = require("fs");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// FOR WEBACK
// automatically does all the things that are repetitive

module.exports = class Entries {
  constructor() {
    this.scripts = fs.readdirSync(path.join(__dirname, "../src/js/controllers"));

    // REMOVABLES
    this.scripts.splice(this.scripts.indexOf("components"), 1);
  }

  getEntries() {
    const entries = {};

    this.scripts.forEach((script) => {
      const name = script.split(".")[0];

      entries[name] = `./src/js/controllers/${script}`;
    });

    entries.preload = "./src/js/preload.js";

    return entries;
  }

  cleanJsFolder() {
    const scripts = this.scripts.map((script) => script.split(".")[0]);
    const dir = fs.readdirSync(path.join(__dirname, "../public/js"));

    dir.forEach((file) => {
      const name = file.split(".")[0];

      if (!scripts.includes(name)) return;

      fs.unlinkSync(path.join(__dirname, `../public/js/${file}`));
    });
  }

  cleanCssFolder() {
    const files = this.scripts.map((script) => script.split(".")[0]);
    const dir = fs.readdirSync(path.join(__dirname, "../public/css"));

    dir.forEach((file) => {
      const name = file.split(".")[0];

      if (!files.includes(name)) return;

      fs.unlinkSync(path.join(__dirname, `../public/css/${file}`));
    });
  }
};
