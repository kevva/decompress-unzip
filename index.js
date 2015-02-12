'use strict';

var BufferStreams = require('bufferstreams');
var File = require('vinyl');
var isZip = require('is-zip');
var stripDirs = require('strip-dirs');
var through = require('through2');
var yauzl = require('yauzl');

module.exports = function (opts) {
	opts = opts || {};
	opts.strip = +opts.strip || 0;

	return through.obj(function (file, enc, cb) {
		var count = 0;
		var self = this;

		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new Error('Streaming is not supported'));
			return;
		}

		if (!isZip(file.contents)) {
			cb(null, file);
			return;
		}

		yauzl.fromBuffer(file.contents, function (err, zipFile) {
			if (err) {
				cb(err);
				return;
			}

			zipFile
				.on('error', cb)
				.on('entry', function (entry) {
					count++;

					if (entry.fileName.charAt(entry.fileName.length - 1) === '/') {
						if (count === zipFile.entryCount) {
							cb();
						}

						return;
					}

					zipFile.openReadStream(entry, function (err, readStream) {
						if (err) {
							cb(err);
							return;
						}

						readStream
							.on('error', cb)
							.pipe(new BufferStreams(function (err, buf, done) {
								self.push(new File({
									contents: buf,
									path: stripDirs(entry.fileName, opts.strip)
								}));

								if (count === zipFile.entryCount) {
									cb();
								}

								done();
							}));
					});
			});
		});
	});
};
