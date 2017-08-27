

const Exchange = function(impl) {
	this._impl = impl;
};

Exchange.prototype.getCurrentPrice = function () {
	return this._impl.getCurrentPrice();
};

module.exports = {
	getExchange(name, config) {
		// Simple for now, will wrap in the future.
		return new Exchange(require(`./${name}`)(config));
	}
};
