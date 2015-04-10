'use strict';

var path = require('path');
var bufferEqual = require('buffer-equal');
var got = require('got');
var isJpg = require('is-jpg');
var test = require('ava');
var Vinyl = require('vinyl');
var vinylFile = require('vinyl-file');
var decompressUnzip = require('../');

test('decompress a ZIP file', function (t) {
	t.plan(2);

	var file = vinylFile.readSync(path.join(__dirname, 'fixtures/test.zip'));
	var stream = decompressUnzip();

	file.extract = true;

	stream.on('data', function (file) {
		t.assert(!file.stat.isDirectory());
		t.assert(isJpg(file.contents));
	});

	stream.end(file);
});

test('decompress a ZIP file with multiple files and directories', function (t) {
	t.plan(7);

	var count = 0;
	var file = vinylFile.readSync(path.join(__dirname, 'fixtures/test-multiple.zip'));
	var stream = decompressUnzip();

	file.extract = true;

	stream.on('data', function (file) {
		if (count < 2) {
			t.assert(file.path === count++ + '.txt', file.path);
			t.assert(!file.stat.isDirectory());
			t.assert(String(file.contents) === String(count), String(file.contents));
			return;
		}

		if (count === 2) {
			t.assert(file.path === String(count++), file.path);
		} else {
			t.assert(file.path === path.join('3', '4'), file.path);
		}

		t.assert(file.path === String(count++), file.path);
		t.assert(file.isNull());
		t.assert(file.stat.isDirectory());
		return;
	});

	stream.on('end', function () {
		t.assert(count === 3, count);
	});

	stream.end(file);
});

test('decompress a large ZIP file', function (t) {
	t.plan(3);

	var url = 'https://github.com/facebook/flow/releases/download/v0.2.0/flow-linux64-v0.2.0.zip';

	got(url, {encoding: null}, function (err, data) {
		t.assert(!err, err);

		var file = new Vinyl({contents: data});
		var files = [];
		var stream = decompressUnzip({strip: 1});

		file.extract = true;

		stream.on('data', function (file) {
			files.push(file.path);
		});

		stream.on('end', function () {
			t.assert(files.length === 66, files.length);
			t.assert(files[65] === 'flow', files[65]);
		});

		stream.end(file);
	});
});

test('decompress a ZIP file including symlink', function (t) {
	t.plan(4);

	var file = vinylFile.readSync(path.join(__dirname, 'fixtures/test-symlink.zip'));
	var stream = decompressUnzip();

	file.extract = true;

	stream.on('data', function (file) {
		t.assert(file.path === 'ReactiveCocoa', file.path);
		t.assert(file.stat, 'Not stats');
		t.assert(file.stat.isSymbolicLink(), 'Not a symbolic link');
	});

	stream.end(file);
});

test('strip path level using the `strip` option', function (t) {
	t.plan(3);

	var file = vinylFile.readSync(path.join(__dirname, 'fixtures/test-nested.zip'));
	var stream = decompressUnzip({strip: 1});

	file.extract = true;

	stream.on('data', function (file) {
		t.assert(!file.stat.isDirectory());
		t.assert(file.path === 'test.jpg', file.path);
		t.assert(isJpg(file.contents));
	});

	stream.end(file);
});

test('skip decompressing a non-ZIP file', function (t) {
	t.plan(1);

	var file = vinylFile.readSync(__filename);
	var stream = decompressUnzip();
	var contents = file.contents;

	file.extract = true;

	stream.on('data', function (file) {
		t.assert(bufferEqual(file.contents, contents));
	});

	stream.end(file);
});

test('skip decompressing an empty file', function (t) {
	t.plan(1);

	var stream = decompressUnzip();

	stream.on('data', function (file) {
		t.assert(file.isNull());
	});

	stream.end(new Vinyl());
});

test('emit an error when a ZIP file is corrupt', function (t) {
	t.plan(2);

	var file = vinylFile.readSync(path.join(__dirname, 'fixtures/test.zip'));
	var stream = decompressUnzip();

	file.contents[98] = 0;
	file.extract = true;

	stream.on('error', function (err) {
		t.assert(err, err);
		t.assert(err.message === 'invalid literal/lengths set', err.message);
	});

	stream.end(file);
});
