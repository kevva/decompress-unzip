# decompress-unzip [![Build Status](http://img.shields.io/travis/kevva/decompress-unzip.svg?style=flat)](https://travis-ci.org/kevva/decompress-unzip)

> zip decompress plugin


## Install

```
$ npm install --save decompress-unzip
```


## Usage

```js
var fs = require('fs');
var decompressUnzip = require('decompress-unzip');
var extract = decompressUnzip();

extract.on('entry', function (header, stream, cb) {
	stream.on('end', cb);
	stream.resume();
});

fs.createReadStream('unicorn.zip').pipe(extract);
```


## API

### decompressUnzip(options)

#### options.strip

Type: `number`  
Default: `0`

Remove leading directory components from extracted files.


## License

MIT © [Kevin Mårtensson](https://github.com/kevva)
