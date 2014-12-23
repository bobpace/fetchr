/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
/*jshint expr:true*/
/*globals before,describe,it,beforeEach */
"use strict";

var chai = require('chai');
chai.config.includeStack = true;
var expect = chai.expect,
    Fetcher = require('../../../libs/fetcher'),
    fetcher = new Fetcher({
        req: {}
    }),
    mockFetcher = require('../../mock/fakeFetcher'),
    mockErrorFetcher = require('../../mock/fakeErrorFetcher'),
    _ = require('lodash'),
    qs = require('querystring');

describe('Server Fetcher', function () {

    it('should register fetchers', function () {
        var fn = Fetcher.getFetcher.bind(fetcher, mockFetcher.name);
        expect(_.size(Fetcher.fetchers)).to.equal(0);
        expect(fn).to.throw(Error, 'Fetcher could not be found');
        Fetcher.registerFetcher(mockFetcher);
        expect(_.size(Fetcher.fetchers)).to.equal(1);
        expect(fn()).to.deep.equal(mockFetcher);
        Fetcher.registerFetcher(mockErrorFetcher);
        expect(_.size(Fetcher.fetchers)).to.equal(2);
    });

    describe('#middleware', function () {

        describe('#POST', function() {

            it('should 404 to POST request with no req.body.requests object', function (done) {
                var operation = 'create',
                    req = {
                        method: 'POST',
                        path: '/resource/' + mockFetcher.name,
                        body: {
                            requests: {},
                            context: {
                                site: '',
                                device: ''
                            }
                        }
                    },
                    res = {},
                    middleware = Fetcher.middleware();

                middleware(req, res, function() {
                  expect(res.status).to.equal(404);
                  done();
                });
            });

            it('should respond to POST api request', function (done) {
                var operation = 'create',
                    statusCodeSet = false,
                    req = {
                        method: 'POST',
                        path: '/resource/' + mockFetcher.name,
                        body: {
                            requests: {
                                g0: {
                                    resource: mockFetcher.name,
                                    operation: operation,
                                    params: {
                                        uuids: ['cd7240d6-aeed-3fed-b63c-d7e99e21ca17', 'cd7240d6-aeed-3fed-b63c-d7e99e21ca17'],
                                        id: 'asdf'
                                    }
                                }
                            },
                            context: {
                                site: '',
                                device: ''
                            }
                        }
                    },
                    res = {},
                    middleware = Fetcher.middleware();

                middleware(req, res, function() {
                  expect(res.status).to.equal(200);
                  var json = res.body;
                  expect(json).to.exist;
                  expect(json).to.not.be.empty;
                  var data = json.g0.data;
                  expect(data).to.contain.keys('operation', 'args');
                  expect(data.operation.name).to.equal(operation);
                  expect(data.operation.success).to.be.true;
                  expect(data.args).to.contain.keys('params');
                  expect(data.args.params).to.equal(req.body.requests.g0.params);
                  done();
                });
            });

            it('should respond to POST api request with custom status code', function (done) {
                var operation = 'create',
                    statusCode = 201,
                    statusCodeSet = false,
                    req = {
                        method: 'POST',
                        path: '/resource/' + mockFetcher.name,
                        body: {
                            requests: {
                                g0: {
                                    resource: mockFetcher.name,
                                    operation: operation,
                                    params: {
                                        uuids: ['cd7240d6-aeed-3fed-b63c-d7e99e21ca17', 'cd7240d6-aeed-3fed-b63c-d7e99e21ca17'],
                                        id: 'asdf'
                                    }
                                }
                            },
                            context: {
                                site: '',
                                device: ''
                            }
                        }
                    },
                    res = {},
                    middleware = Fetcher.middleware({pathPrefix: '/api'});

                mockFetcher.meta = {
                    statusCode: statusCode
                };

                middleware(req, res, function() {
                  expect(res.status).to.equal(statusCode);
                  expect(res.body).to.exist;
                  expect(res.body).to.not.be.empty;
                  var data = res.body.g0.data;
                  expect(data).to.contain.keys('operation', 'args');
                  expect(data.operation.name).to.equal(operation);
                  expect(data.operation.success).to.be.true;
                  expect(data.args).to.contain.keys('params');
                  expect(data.args.params).to.equal(req.body.requests.g0.params);
                  done();
                });
            });

            var makePostApiErrorTest = function(params, expStatusCode, expMessage) {
                return function(done) {
                    var operation = 'create',
                        statusCodeSet = false,
                        req = {
                            method: 'POST',
                            path: '/resource/' + mockErrorFetcher.name,
                            body: {
                                requests: {
                                    g0: {
                                        resource: mockErrorFetcher.name,
                                        operation: operation,
                                        params: params
                                    }
                                },
                                context: {
                                    site: '',
                                    device: ''
                                }
                            }
                        },
                        res = {},
                        middleware = Fetcher.middleware({pathPrefix: '/api'});

                    middleware(req, res, function(){
                      expect(res.status).to.equal(expStatusCode);
                      expect(res.message).to.equal(expMessage);
                      done();
                    });
                };
            };

            it('should respond to POST api request with default error details',
               makePostApiErrorTest({}, 400, 'request failed'));

            it('should respond to POST api request with custom error status code',
               makePostApiErrorTest({statusCode: 500}, 500, 'request failed'));

            it('should respond to POST api request with custom error message',
               makePostApiErrorTest({message: 'Error message...'}, 400, 'Error message...'));
        });

        describe('#GET', function() {
            it('should respond to GET api request', function (done) {
                var operation = 'read',
                    statusCodeSet = false,
                    params = {
                        uuids: ['cd7240d6-aeed-3fed-b63c-d7e99e21ca17', 'cd7240d6-aeed-3fed-b63c-d7e99e21ca17'],
                        id: 'asdf',
                    },
                    req = {
                        method: 'GET',
                        path: '/resource/' + mockFetcher.name + ';' + qs.stringify(params, ';')
                    },
                    res = {},
                    middleware = Fetcher.middleware({pathPrefix: '/api'});

                middleware(req, res, function() {
                  expect(res.status).to.equal(200);
                  expect(res.body).to.exist;
                  expect(res.body).to.not.be.empty;
                  expect(res.body).to.contain.keys('operation', 'args');
                  expect(res.body.operation.name).to.equal(operation);
                  expect(res.body.operation.success).to.be.true;
                  expect(res.body.args).to.contain.keys('params');
                  expect(res.body.args.params).to.deep.equal(params);
                  done();
                });
            });

            it('should respond to GET api request with custom status code', function (done) {
                var operation = 'read',
                    statusCode = 201,
                    params = {
                        uuids: ['cd7240d6-aeed-3fed-b63c-d7e99e21ca17', 'cd7240d6-aeed-3fed-b63c-d7e99e21ca17'],
                        id: 'asdf',
                    },
                    req = {
                        method: 'GET',
                        path: '/resource/' + mockFetcher.name + ';' + qs.stringify(params, ';')
                    },
                    res = {},
                    middleware = Fetcher.middleware({pathPrefix: '/api'});

                mockFetcher.meta = {
                    statusCode: statusCode
                };

                middleware(req, res, function() {
                  expect(res.status).to.equal(statusCode);
                  expect(res.body).to.exist;
                  expect(res.body).to.not.be.empty;
                  expect(res.body).to.contain.keys('operation', 'args');
                  expect(res.body.operation.name).to.equal(operation);
                  expect(res.body.operation.success).to.be.true;
                  expect(res.body.args).to.contain.keys('params');
                  expect(res.body.args.params).to.deep.equal(params);
                  done();
                });
            });

            var makeGetApiErrorTest = function(params, expStatusCode, expMessage) {
                return function(done) {
                    var operation = 'read',
                        statusCodeSet = false,
                        req = {
                            method: 'GET',
                            path: '/resource/' + mockErrorFetcher.name + ';' + qs.stringify(params, ';')
                        },
                        res = {},
                        middleware = Fetcher.middleware({pathPrefix: '/api'});

                    middleware(req, res, function() {
                      expect(res.status).to.equal(expStatusCode);
                      expect(res.message).to.equal(expMessage);
                      done();
                    });
                };
            };

            it('should respond to GET api request with default error details',
               makeGetApiErrorTest({}, 400, 'request failed'));

            it('should respond to GET api request with custom error status code',
               makeGetApiErrorTest({statusCode: 500}, 500, 'request failed'));

            it('should respond to GET api request with custom error message',
               makeGetApiErrorTest({message: 'Error message...'}, 400, 'Error message...'));
        });
    });

    describe('#CRUD', function () {
        var resource = mockFetcher.name,
            params = {},
            body = {},
            config = {},
            checkData = function(operation) {
              return function(data) {
                expect(data.operation).to.exist;
                expect(data.operation.name).to.equal(operation);
                expect(data.operation.success).to.be.true;
              };
            };

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
            return fetcher[operation](resource, params, config).then(checkData(operation));
        });
        it('should handle READ w/ no config', function () {
            var operation = 'read';
            return fetcher[operation](resource, params).then(checkData(operation));
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
