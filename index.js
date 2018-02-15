'use strict';
const FirstChunkStream = require('first-chunk-stream');
const fileType = require('file-type');
const getStream = require('get-stream');
const isStream = require('is-stream');
const pify = require('pify');
const yauzl = require('yauzl');

const getType = (entry, mode) => {
	const IFMT = 61440;
	const IFDIR = 16384;
	const IFLNK = 40960;
	const madeBy = entry.versionMadeBy >> 8;

	if ((mode & IFMT) === IFLNK) {
		return 'symlink';
	}

	if ((mode & IFMT) === IFDIR || (madeBy === 0 && entry.externalFileAttributes === 16)) {
		return 'directory';
	}

	return 'file';
};

const extractEntry = (entry, zip) => {
	const file = {
		mode: (entry.externalFileAttributes >> 16) & 0xFFFF,
		mtime: entry.getLastModDate(),
		path: entry.fileName
	};

	file.type = getType(entry, file.mode);

	if (file.mode === 0 && file.type === 'directory') {
		file.mode = 493;
	}

	if (file.mode === 0) {
		file.mode = 420;
	}

	return pify(zip.openReadStream.bind(zip))(entry)
		.then(getStream.buffer)
		.then(buf => {
			file.data = buf;

			if (file.type === 'symlink') {
				file.linkname = buf.toString();
			}

			return file;
		})
		.catch(err => {
			zip.close();
			throw err;
		});
};

const extractFile = zip => new Promise((resolve, reject) => {
	const files = [];

	zip.readEntry();

	zip.on('entry', entry => {
		extractEntry(entry, zip)
			.catch(reject)
			.then(file => {
				files.push(file);
				zip.readEntry();
			});
	});

	zip.on('error', reject);
	zip.on('end', () => resolve(files));
});

module.exports = () => input => {
	const processZip = buf => pify(yauzl.fromBuffer)(buf, {lazyEntries: true}).then(extractFile);

	if (Buffer.isBuffer(input)) {
		const type = fileType(input);

		return type && type.ext === 'zip' ? processZip(input) : Promise.resolve([]);
	} else if (isStream(input)) {
		const notAZipError = new Error('not-a-zip');
		const firstChunkIsZip = new FirstChunkStream({chunkLength: 4}, (err, chunk, enc, cb) => {
			const type = chunk && fileType(chunk);

			cb(type && type.ext === 'zip' ? err : err || notAZipError, chunk);
		});

		return getStream.buffer(input.pipe(firstChunkIsZip)).then(processZip, error => {
			if (error === notAZipError) {
				return [];
			}

			throw error;
		});
	}

	return Promise.reject(new TypeError(`Expected a Buffer or Stream, got ${typeof input}`));
};
