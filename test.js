import fs from 'fs';
import path from 'path';
import isJpg from 'is-jpg';
import pify from 'pify';
import test from 'ava';
import m from './';

const fsP = pify(fs);

test('extract file', async t => {
	const buf = await fsP.readFile(path.join(__dirname, 'fixtures', 'file.zip'));
	const files = await m()(buf);

	t.is(files[0].path, 'test.jpg');
	t.true(isJpg(files[0].data));
});

test('extract multiple files', async t => {
	const buf = await fsP.readFile(path.join(__dirname, 'fixtures', 'multiple.zip'));
	const files = await m()(buf);

	t.is(files.length, 4);
	t.is(files[0].path, '0.txt');
	t.is(files[0].type, 'file');
	t.is(files[0].data.toString(), '1');
	t.is(files[3].path, '3/4/');
	t.is(files[3].type, 'directory');
});

test('extract symlinks', async t => {
	const buf = await fsP.readFile(path.join(__dirname, 'fixtures', 'symlink.zip'));
	const files = await m()(buf);

	t.is(files[0].path, 'ReactiveCocoa');
	t.is(files[0].type, 'symlink');
	t.is(files[0].linkname, 'Versions/Current/ReactiveCocoa');
});

test('ignore non-valid files', async t => {
	const buf = await fsP.readFile(__filename);
	const data = await m()(buf);

	t.deepEqual(buf, data);
});

test('throw on wrong input', async t => {
	t.throws(m()('foo'), /Expected a buffer/);
});
