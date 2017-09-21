const fs = require('fs');
const yaml = require('js-yaml');


const lib = {
	load(filename) {
		return lib.smartParse(fs.readFileSync(filename, 'utf-8'));
	},

	smartParse(str) {
		try {
			if (str[0] === '{') {
				// Likely JSON
				return JSON.parse(str);
			}
			return yaml.safeLoad(str)
		} catch(err) {
			console.err(`Error parsing data: ${err.message}`);
		}
	}
};

module.exports = lib;
