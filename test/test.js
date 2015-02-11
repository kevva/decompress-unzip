'use strict';

var isJpg = require('is-jpg');
var path = require('path');
var read = require('vinyl-file').read;
var test = require('ava');
var zip = require('../');

test('decompress a ZIP file', function (t) {
	t.plan(2);

	read(path.join(__dirname, 'fixtures/test.zip'), function (err, file) {
		t.assert(!err, err);

		var stream = zip();

		stream.on('data', function (file) {
			t.assert(isJpg(file.contents));
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
			t.assert(file.path === 'test.jpg');
			t.assert(isJpg(file.contents));
		});

		stream.end(file);
	});
});
