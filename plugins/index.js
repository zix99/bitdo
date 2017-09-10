

const Plugin = function(name, impl) {
	if (!impl)
		throw new Error('Must provide impl to Plugin');
	this.name = name;
	this._impl = impl;
};

Plugin.prototype.onHoldingUpdate = function (holding) {
	return this._impl.onHoldingUpdate(holding);
};

module.exports = {
	createPlugin(name) {
		// Simple for now, will wrap in the future.
		return new Plugin(name, require(`./${name}`));
	}
};
