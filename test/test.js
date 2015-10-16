import path from 'path';
import bufferEqual from 'buffer-equal';
import got from 'got';
import isJpg from 'is-jpg';
import test from 'ava';
import Vinyl from 'vinyl';
import vinylFile from 'vinyl-file';
import decompressUnzip from '../';

test('decompress a ZIP file', t => {
	const file = vinylFile.readSync(path.join(__dirname, 'fixtures/test.zip'));
	const stream = decompressUnzip();

	file.extract = true;

	stream.on('data', file => {
		t.false(file.stat.isDirectory());
		t.true(isJpg(file.contents));
		t.end();
	});

	stream.end(file);
});

test('decompress a ZIP file with multiple files and directories', t => {
	t.plan(13);

	let count = 0;
	const file = vinylFile.readSync(path.join(__dirname, 'fixtures/test-multiple.zip'));
	const stream = decompressUnzip();

	file.extract = true;

	stream.on('data', file => {
		if (count < 2) {
			t.is(file.path, count++ + '.txt');
			t.false(file.stat.isDirectory());
			t.is(String(file.contents), String(count));
			return;
		}

		if (count === 2) {
			t.is(file.path, String(count++));
		} else {
			t.is(file.path, path.join('3', '4'));
		}

		t.true(file.isNull());
		t.true(file.stat.isDirectory());
	});

	stream.on('end', () => t.is(count, 3));
	stream.end(file);
});

test('decompress a large ZIP file', t => {
	t.plan(3);

	const url = 'https://github.com/facebook/flow/releases/download/v0.2.0/flow-linux64-v0.2.0.zip';

	got(url, {encoding: null}, function (err, data) {
		t.assert(!err, err);

		const file = new Vinyl({contents: data});
		const files = [];
		const stream = decompressUnzip({strip: 1});

		file.extract = true;

		stream.on('data', file => files.push(file.path));

		stream.on('end', () => {
			t.is(files.length, 66);
			t.is(files[65], 'flow');
		});

		stream.end(file);
	});
});

test('decompress a ZIP file including symlink', t => {
	const file = vinylFile.readSync(path.join(__dirname, 'fixtures/test-symlink.zip'));
	const stream = decompressUnzip();

	file.extract = true;

	stream.on('data', file => {
		t.is(file.path, 'ReactiveCocoa');
		t.ok(file.stat);
		t.true(file.stat.isSymbolicLink());
		t.end();
	});

	stream.end(file);
});

test('strip path level using the `strip` option', t => {
	const file = vinylFile.readSync(path.join(__dirname, 'fixtures/test-nested.zip'));
	const stream = decompressUnzip({strip: 1});

	file.extract = true;

	stream.on('data', file => {
		t.true(file.stat.isFile());
		t.is(file.path, 'test.jpg');
		t.true(isJpg(file.contents));
		t.end();
	});

	stream.end(file);
});

test('skip decompressing a non-ZIP file', t => {
	t.plan(1);

	const file = vinylFile.readSync(__filename);
	const stream = decompressUnzip();
	const contents = file.contents;

	file.extract = true;

	stream.on('data', file => t.true(bufferEqual(file.contents, contents)));

	stream.end(file);
});

test('skip decompressing an empty file', t => {
	t.plan(1);

	const stream = decompressUnzip();

	stream.on('data', function (file) {
		t.assert(file.isNull());
	});

	stream.end(new Vinyl());
});

test('emit an error when a ZIP file is corrupt', t => {
	const file = vinylFile.readSync(path.join(__dirname, 'fixtures/test.zip'));
	const stream = decompressUnzip();

	file.contents[98] = 0;
	file.extract = true;

	stream.on('error', err => {
		t.ok(err);
		t.is(err.message, 'invalid literal/lengths set');
		t.end();
	});

	stream.end(file);
});
