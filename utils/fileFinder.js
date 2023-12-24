const fs = require("fs");
const path = require("path");

// Automatically determines the file with the correct hash for the select type of file

exports.js = (pageName) => {
  const dir = fs.readdirSync(path.join(__dirname, "../public/js"));

  return {
    js: dir.find((file) => file.startsWith(pageName)),
    pre: dir.find((file) => file.startsWith("preload")),
  };
};

exports.css = () => {
  const dir = fs.readdirSync(path.join(__dirname, "../public/css"));

  return dir[0];
};
