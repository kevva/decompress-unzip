'use strict';

var fs = require('fs');
var path = require('path');
var test = require('ava');
var decompressUnzip = require('../');

test('decompress a ZIP file', function (t) {
	t.plan(1);

	var read = fs.createReadStream(path.join(__dirname, 'fixtures/test.zip'));
	var stream = decompressUnzip();

	stream.on('entry', function (header, stream) {
		t.assert(header.fileName === 'test.jpg', header.fileName);
	});

	read.pipe(stream);
});

test('decompress a ZIP file with multiple files and directories', function (t) {
	t.plan(2);

	var read = fs.createReadStream(path.join(__dirname, 'fixtures/test-multiple.zip'));
	var stream = decompressUnzip();
	var i = 0;

	stream.on('entry', function (header, stream) {
		t.assert(header.fileName === i + '.txt', header.fileName);
		i++;
	});

	read.pipe(stream);
});

test('strip path level using the `strip` option', function (t) {
	t.plan(1);

	var read = fs.createReadStream(path.join(__dirname, 'fixtures/test-nested.zip'));
	var stream = decompressUnzip({strip: 1});

	stream.on('entry', function (header, stream) {
		t.assert(header.fileName === 'test.jpg', header.fileName);
	});

	read.pipe(stream);
});

test('emit an error when a ZIP file is corrupt', function (t) {
	t.plan(2);

	var buf = fs.readFileSync(path.join(__dirname, 'fixtures/test.zip'));
	var stream = decompressUnzip();

	buf[98] = 0;

	stream.on('error', function (err) {
		t.assert(err, err);
		t.assert(err.message === 'invalid literal/lengths set', err.message);
	});

	stream.end(buf);
});
