'use strict';

var bufferEqual = require('buffer-equal');
var File = require('vinyl');
var got = require('got');
var isJpg = require('is-jpg');
var path = require('path');
var test = require('ava');
var zip = require('../');
var vinylFile = require('vinyl-file');

test('decompress a ZIP file', function (t) {
	t.plan(2);

	var file = vinylFile.readSync(path.join(__dirname, 'fixtures/test.zip'));
	var stream = zip();

	file.extract = true;

	stream.on('data', function (file) {
		t.assert(!file.stat.isDirectory());
		t.assert(isJpg(file.contents));
	});

	stream.end(file);
});

test('decompress a ZIP file with multiple files', function (t) {
	t.plan(7);

	var count = 0;
	var file = vinylFile.readSync(path.join(__dirname, 'fixtures/test-multiple.zip'));
	var stream = zip();

	file.extract = true;

	stream.on('data', function (file) {
		t.assert(!file.stat.isDirectory());
		t.assert(file.path === count++ + '.txt');
		t.assert(String(file.contents) === String(count));
	});

	stream.on('end', function () {
		t.assert(count === 2, count);
	});

	stream.end(file);
});

test('decompress a large ZIP file', function (t) {
	t.plan(3);

	var url = 'https://github.com/facebook/flow/releases/download/v0.2.0/flow-linux64-v0.2.0.zip';

	got(url, {encoding: null}, function (err, data) {
		t.assert(!err, err);

		var file = new File({contents: data});
		var files = [];
		var stream = zip({strip: 1});

		file.extract = true;

		stream.on('data', function (file) {
			files.push(file.path);
		});

		stream.on('end', function () {
			t.assert(files.length === 44);
			t.assert(files[43] === 'flow');
		});

		stream.end(file);
	});
});

test('decompress a ZIP file including symlink', function (t) {
	t.plan(4);

	var file = vinylFile.readSync(path.join(__dirname, 'fixtures/test-symlink.zip'));
	var stream = zip();

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
	var stream = zip({strip: 1});

	file.extract = true;

	stream.on('data', function (file) {
		t.assert(!file.stat.isDirectory());
		t.assert(file.path === 'test.jpg');
		t.assert(isJpg(file.contents));
	});

	stream.end(file);
});

test('skip decompressing a non-ZIP file', function (t) {
	t.plan(1);

	var file = vinylFile.readSync(__filename);
	var stream = zip();
	var contents = file.contents;

	file.extract = true;

	stream.on('data', function (file) {
		t.assert(bufferEqual(file.contents, contents));
	});

	stream.end(file);
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
	t.plan(2);

	var file = vinylFile.readSync(path.join(__dirname, 'fixtures/test.zip'));
	var stream = zip();

	file.contents[98] = 0;
	file.extract = true;

	stream.on('error', function (err) {
		t.assert(err);
		t.assert(err.message === 'invalid literal/lengths set');
	});

	stream.end(file);
});
