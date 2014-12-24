/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
/*jshint expr:true*/
/*globals before,after,describe,it */
"use strict";

var libUrl = require('url');
var expect = require('chai').expect,
    mockery = require('mockery'),
    Fetcher,
    fetcher;

describe('Client Fetcher', function () {

    describe('#CRUD', function () {
        var resource = 'mock_fetcher',
            params = {
                uuids: [1,2,3,4,5],
                category: '',
                selected_filter: 'YPROP:TOPSTORIES'
            },
            body = { stuff: 'is'},
            context = {
                _csrf: 'stuff'
            },
            config = {},
            checkData = function(operation) {
              return function(data) {
                expect(data.operation).to.equal(operation);
              };
            };

        before(function(){
            mockery.registerMock('./util/http.client', {
                get: function (url, headers, config, done) {
                    var urlObj = libUrl.parse(url);
                    var pathname = urlObj.pathname;
                    pathname = decodeURIComponent(pathname);
                    pathname = pathname.split(';');
                    expect(pathname.shift()).to.equal('/api/resource/' + resource);
                    while(!!(pair = pathname.shift())) {
                        var pair = pair.split('=');

                        var k = pair[0],
                            v = pair[1];

                        //hacky because of array in querystring, but its fine
                        if(k === 'uuids'){
                            expect(params[k].toString()).to.equal(v.substr(1,v.length-2));
                        } else {
                            expect(params[k]).to.equal(v);
                        }
                    }
                    done();
                },
                post : function (url, headers, body, config, callback) {
                    expect(url).to.not.be.empty;
                    expect(callback).to.exist;
                    expect(body).to.exist;
                    expect(url).to.equal('/api?_csrf='+context._csrf);

                    var req = body.requests.g0,
                        res = {
                            g0: {
                                data: req
                            }
                        };

                    callback(null, {
                        responseText: JSON.stringify(res)
                    });
                }
            });
            mockery.enable({
                useCleanCache: true,
                warnOnUnregistered: false
            });
            Fetcher = require('../../../libs/fetcher.client');
            fetcher = new Fetcher({
                context: context
            });
        });

        after(function(){
            mockery.disable();
            mockery.deregisterAll();
        });

        it('should handle CREATE', function () {
            var operation = 'create';
            return fetcher[operation](resource, params, body, config).then(checkData(operation));
        });
        it('should handle CREATE w/ no config', function () {
            var operation = 'create';
            return fetcher[operation](resource, params, body).then(checkData(operation));
        });
        it('should handle READ', function () {
            var operation = 'read';
            return fetcher[operation](resource, params, config);
        });
        it('should handle READ w/ no config', function () {
            var operation = 'read';
            return fetcher[operation](resource, params);
        });
        it('should handle UPDATE', function () {
            var operation = 'update';
            return fetcher[operation](resource, params, body, config).then(checkData(operation));
        });
        it('should handle UPDATE w/ no config', function () {
            var operation = 'update';
            return fetcher[operation](resource, params, body).then(checkData(operation));
        });
        it('should handle DELETE', function () {
            var operation = 'delete';
            return fetcher[operation](resource, params, config).then(checkData(operation));
        });
        it('should handle DELETE w/ no config', function () {
            var operation = 'delete';
            return fetcher[operation](resource, params).then(checkData(operation));
        });
    });

});
