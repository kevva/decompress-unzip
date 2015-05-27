'use strict';

var concatStream = require('concat-stream');
var ifStream = require('if-stream');
var isZip = require('is-zip');
var stripDirs = require('strip-dirs');
var yauzl = require('yauzl');

module.exports = function (opts) {
	opts = opts || {};
	opts.strip = typeof opts.strip === 'number' ? opts.strip : 0;

	var concat = concatStream(unzip);
	var ret = ifStream(isZip, concat);

	function finish(entry, err, stream) {
		if (err) {
			ret.emit('error', err);
			return;
		}

		stream.on('error', ret.emit.bind(ret, 'error'));
		ret.emit('entry', entry, stream);
	}

	function unzip(buf) {
		yauzl.fromBuffer(buf, function (err, zip) {
			if (err) {
				ret.emit('error', err);
				return;
			}

			zip.on('error', ret.emit.bind(ret, 'error'));
			zip.on('entry', function (entry) {
				var name = entry.fileName;
				var path = stripDirs(name, opts.strip);

				if (path === '.') {
					return;
				}

				if (name.charAt(name.length - 1) === '/') {
					return;
				}

				entry.fileName = path;
				zip.openReadStream(entry, finish.bind(null, entry));
			});
		});
	}

	return ret;
};
