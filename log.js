const winston = require('winston');
const ui = require('./ui')
const MethodTransport = require('./lib/methodtransport');

const log = new (winston.Logger)({
  level: 'info',
  handleExceptions: false,
  transports: [
    new MethodTransport(ui.log),
    new (winston.transports.File)({
      filename: 'bitdo.log',
      maxsize: 1024 * 128,
      json: false,
    }),
  ],
});

console.log = function(txt) {
	log.info(txt);
};

console.dir = function(obj) {
	log.info(JSON.stringify(obj));
}

module.exports = log;