const winston = require('winston');
const moment = require('moment');
const util = require('util');

module.exports = new (winston.Logger)({
  level: 'info',
  handleExceptions: false,
  transports: [
    new (winston.transports.Console)({
      timestamp() {
        return moment().format('YYYY-MM-DD HH:mm:ss.SSSS');
      },
      formatter(params) {
        return `[${params.timestamp()}] [${params.level}] *** ${params.message}`;
      },
    }),
  ],
});