const Entries = require("./utils/entryManager");

module.exports = {
  entry: new Entries().getEntries(),
};
