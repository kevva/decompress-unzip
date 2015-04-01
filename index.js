'use strict';

var File = require('vinyl');
var fs = require('fs');
var isZip = require('is-zip');
var stripDirs = require('strip-dirs');
var through = require('through2');
var yauzl = require('yauzl');

module.exports = function (opts) {
	opts = opts || {};
	opts.strip = +opts.strip || 0;

	return through.obj(function (file, enc, cb) {
		var self = this;

		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new Error('Streaming is not supported'));
			return;
		}

		if (!file.extract || !isZip(file.contents)) {
			cb(null, file);
			return;
		}

		yauzl.fromBuffer(file.contents, function (err, zipFile) {
			var count = 0;

			if (err) {
				cb(err);
				return;
			}

			zipFile.on('error', cb);
			zipFile.on('entry', function (entry) {
				var filePath = stripDirs(entry.fileName, opts.strip);
				
				if (filePath === '.') {
					if (++count === zipFile.entryCount) {
						cb();
					}

					return;
				}

				var stat = new fs.Stats();
				var mode = (entry.externalFileAttributes >> 16) & 0xFFFF;

				if (mode) {
					stat.mode = mode;
				}

				if (entry.getLastModDate()) {
					stat.mtime = entry.getLastModDate();
				}

				if (stat.isDirectory()) {
					self.push(new File({
						path: filePath,
						stat: stat
					}));

					if (++count === zipFile.entryCount) {
						cb();
					}

					return;
				}

				zipFile.openReadStream(entry, function (err, readStream) {
					if (err) {
						cb(err);
						return;
					}

					var chunks = [];
					var len = 0;

					readStream.on('error', cb);
					readStream.on('data', function (data) {
						chunks.push(data);
						len += data.length;
					});

					readStream.on('end', function () {
						self.push(new File({
							contents: Buffer.concat(chunks, len),
							path: filePath,
							stat: stat
						}));

						if (++count === zipFile.entryCount) {
							cb();
						}
					});
				});
			});
		});
	});
};
