

function Exchange(impl) {
	this._impl = impl;
};

Exchange.prototype.getCurrentPrice = function () {
	return this._impl.getCurrentPrice();
};

Exchange.prototype.getHoldings = function () {
	return this._impl.getHoldings();
}

module.exports = {
	createExchange(name) {
		// Simple for now, will wrap in the future.
		return new Exchange(require(`./${name}`));
	}
};
