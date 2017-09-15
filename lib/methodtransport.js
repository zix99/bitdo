const moment = require('moment');
const winston = require('winston');
const util = require('util');
const _ = require('lodash');

var MethodTransport = function(cb, options={}) {
  this.name = 'MethodTransport';
  this.colorize = options.colorize || true;
  this.cb = cb;
};
util.inherits(MethodTransport, winston.Transport);

function getMessageColor(level) {
	switch(level) {
		case 'debug': return '#888';
		case 'info': return '#00f';
		case 'warn': return '#'
	}
}

const TAG_COLORS = {
	debug: '#aaa',
	info: 'blue',
	warn: 'yellow',
	error: 'red',
};
const TAG_COLOR_DEFAULT = 'blue';

const TEXT_COLORS = {
	debug: '#888',
	error: 'red',
};
const TEXT_COLOR_DEFAULT = 'white';

MethodTransport.prototype.log = function(level, msg, meta, callback) {
	const fdate = moment().format('HH:mm:ss');
	if (!this.colorize) {
		this.cb(`[${fdate}] [${level}] ${msg}`);
	} else {
		const lcol = _.get(TAG_COLORS, level, TAG_COLOR_DEFAULT);
		const tcol = _.get(TEXT_COLORS, level, TEXT_COLOR_DEFAULT);
		this.cb(`[{#aa4-fg}${fdate}{/}] [{${lcol}-fg}${level}{/}] {${tcol}-fg}${msg}{/}`);
	}
	callback(null, true);
}

module.exports = MethodTransport;