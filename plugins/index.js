const fs = require('fs');

const Plugin = function(name, impl) {
	if (!impl)
		throw new Error('Must provide impl to Plugin');
	this.name = name;
	this._impl = impl;
};

Plugin.prototype.onHoldingUpdate = function (holding) {
	return this._impl.onHoldingUpdate(holding);
};

function requirePlugin(name) {
	if (fs.existsSync(`${__dirname}/${name}`))
		return require(`./${name}`);
	if (fs.existsSync(`${__dirname}/${name}.js`))
		return require(`./${name}.js`);
	return require(`bitdo-plugin-${name}`);
}

module.exports = {
	createPlugin(name, context) {
		// Simple for now, will wrap in the future.
		return new Plugin(name, requirePlugin(name)(context));
	}
};
