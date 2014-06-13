/*global describe, it */
'use strict';

var assert = require('assert');
var Decompress = require('decompress');
var fs = require('fs');
var path = require('path');
var zip = require('../');

describe('zip()', function () {
    it('should decompress a ZIP file', function (cb) {
        var decompress = new Decompress();

        decompress
            .src(path.join(__dirname, 'fixtures/test.zip'))
            .dest(path.join(__dirname, 'tmp'))
            .use(zip())
            .decompress(function (err) {
                assert(!err);
                assert(fs.existsSync(path.join(__dirname, 'tmp/test.jpg')));
                cb();
            });
    });
});
