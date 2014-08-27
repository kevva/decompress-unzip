'use strict';

var Decompress = require('decompress');
var exists = require('fs').exists;
var path = require('path');
var rm = require('rimraf');
var test = require('ava');
var zip = require('../');

test('decompress a ZIP file', function (t) {
    t.plan(3);

    var decompress = new Decompress()
        .src(path.join(__dirname, 'fixtures/test.zip'))
        .dest(path.join(__dirname, 'tmp'))
        .use(zip());

    decompress.decompress(function (err) {
        t.assert(!err);

        exists(path.join(decompress.dest(), 'test.jpg'), function (exist) {
            t.assert(exist);

            rm(decompress.dest(), function (err) {
                t.assert(!err);
            });
        });
    });
});

test('strip path level using the `strip` option', function (t) {
    t.plan(3);

    var decompress = new Decompress()
        .src(path.join(__dirname, 'fixtures/test-nested.zip'))
        .dest(path.join(__dirname, 'tmp'))
        .use(zip({ strip: 1 }));

    decompress.decompress(function (err) {
        t.assert(!err);

        exists(path.join(decompress.dest(), 'test.jpg'), function (exist) {
            t.assert(exist);

            rm(decompress.dest(), function (err) {
                t.assert(!err);
            });
        });
    });
});
