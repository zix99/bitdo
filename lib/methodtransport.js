const moment = require('moment');
const winston = require('winston');
const util = require('util');

var MethodTransport = function(cb, options={}) {
  this.name = 'MethodTransport';
  this.level = options.level || 'info';
  this.cb = cb;
};
util.inherits(MethodTransport, winston.Transport);

MethodTransport.prototype.log = function(level, msg, meta, callback) {
	const fdate = moment().format('HH:mm:ss');
	this.cb(`[{#00f-fg}${fdate}{/}] [{#0f0-fg}${level}{/}] ${msg}`);
	callback(null, true);
}

module.exports = MethodTransport;