const _ = require('lodash');
const log = require('./logger');

function PluginSet(pluginSet) {
	this._plugins = pluginSet || [];
};

PluginSet.prototype.push = function(plugin){
	this._plugins.push(plugin);
};

PluginSet.prototype.event = function(name, ...args) {
	_.each(this._plugins, plugin => {
		try {
			const fn = plugin[name];
			if (_.isFunction(fn))
				fn.apply(plugin, args);
		} catch(e) {
			log.warn(`Error invoking plugin ${plugin.name}: ${e.message}`);
		}
	});
}

module.exports = PluginSet;
