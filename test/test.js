'use strict';

var bufferEqual = require('buffer-equal');
var File = require('vinyl');
var isJpg = require('is-jpg');
var path = require('path');
var read = require('vinyl-file').read;
var test = require('ava');
var zip = require('../');

test('decompress a ZIP file', function (t) {
	t.plan(3);

	read(path.join(__dirname, 'fixtures/test.zip'), function (err, file) {
		t.assert(!err, err);

		var stream = zip();

		stream.on('data', function (file) {
			t.assert(file.path === 'test.jpg', file.path);
			t.assert(isJpg(file.contents));
		});

		stream.end(file);
	});
});

test('decompress a ZIP file with multiple files', function (t) {
	t.plan(6);

	read(path.join(__dirname, 'fixtures/test-multiple.zip'), function (err, file) {
		t.assert(!err, err);

		var count = 0;
		var stream = zip();

		stream.on('data', function (file) {
			t.assert(file.path === count++ + '.txt', file.path);
			t.assert(String(file.contents) === String(count));
		});

		stream.on('finish', function () {
			t.assert(count === 2, count);
		});

		stream.end(file);
	});
});

test('strip path level using the `strip` option', function (t) {
	t.plan(3);

	read(path.join(__dirname, 'fixtures/test-nested.zip'), function (err, file) {
		t.assert(!err, err);

		var stream = zip({strip: 1});

		stream.on('data', function (file) {
			t.assert(file.path === 'test.jpg', file.path);
			t.assert(isJpg(file.contents));
		});

		stream.end(file);
	});
});

test('skip decompressing a non-ZIP file', function (t) {
	t.plan(2);

	read(__filename, function (err, file) {
		t.assert(!err, err);

		var stream = zip();
		var contents = file.contents;

		stream.on('data', function (data) {
			t.assert(bufferEqual(data.contents, contents));
		});

		stream.end(file);
	});
});

test('skip decompressing an empty file', function (t) {
	t.plan(1);

	var stream = zip();

	stream.on('data', function (file) {
		t.assert(file.isNull());
	});

	stream.end(new File());
});

test('emit an error when a ZIP file is corrupt', function (t) {
	t.plan(3);

	read(path.join(__dirname, 'fixtures/test.zip'), function (err, file) {
		t.assert(!err, err);

		// break the ZIP data
		file.contents[98] = 0;

		var stream = zip();

		stream.on('error', function (err) {
			t.assert(err);
			t.assert(err.message === 'invalid literal/lengths set', err.message);
		});

		stream.end(file);
	});
});
