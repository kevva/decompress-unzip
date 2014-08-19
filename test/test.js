/*global afterEach, describe, it */
'use strict';

var assert = require('assert');
var Decompress = require('decompress');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var zip = require('../');

describe('zip()', function () {
    afterEach(function (cb) {
        rimraf(path.join(__dirname, 'tmp'), cb);
    });

    it('should decompress a ZIP file', function (cb) {
        var decompress = new Decompress()
            .src(path.join(__dirname, 'fixtures/test.zip'))
            .dest(path.join(__dirname, 'tmp'))
            .use(zip());

        decompress.decompress(function (err) {
            assert(!err);
            assert(fs.existsSync(path.join(__dirname, 'tmp/test.jpg')));
            cb();
        });
    });

    it('should strip path level using the `strip` option', function (cb) {
        var decompress = new Decompress()
            .src(path.join(__dirname, 'fixtures/test-nested.zip'))
            .dest(path.join(__dirname, 'tmp'))
            .use(zip({ strip: 1 }));

        decompress.decompress(function (err) {
            assert(!err);
            assert(fs.existsSync(path.join(__dirname, 'tmp/test/test.jpg')));
            cb();
        });
    });
});
