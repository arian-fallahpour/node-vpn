exports.filterObj = (obj, ...allowed) => {
  const filtered = {};
  Object.keys(obj).forEach((key) => {
    if (allowed.includes(key)) filtered[key] = obj[key];
  });
  return filtered;
};

/** Returns difference in time of timestamp and now in ms */
exports.timeLeft = (timestamp) => {
  return new Date(timestamp).getTime() - Date.now();
};
