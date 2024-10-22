const si = require("systeminformation"); module.exports = { getStats: async () => await si.currentLoad() };
