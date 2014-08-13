/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
/**
 * list of registered fetchers
 */
var OP_READ = 'read',
    OP_CREATE = 'create',
    OP_UPDATE = 'update',
    GET = 'GET',
    qs = require('querystring'),
    DEFAULT_PATH_PREFIX = '/api';

/**
 * @module fetcherController
 * @param {object} options
 * @param {string} [options.pathPrefix="/api"] The path for XHR requests
 */

module.exports = function fetcherController (options) {
    options = options || {};

    var debug = require('debug')('Fetchr:fetchr');

    /**
     * @class Fetcher
     * @param {Object} req The request object.  It can contain per-request data.
     * @constructor
     */
    function Fetcher(req) {
        this.req = req || {};
    }

    Fetcher.pathPrefix = options.pathPrefix || DEFAULT_PATH_PREFIX;
    Fetcher.fetchers = {};

    /**
     * @method addFetcher
     * @param {Function} fetcher
     */
    Fetcher.addFetcher = function (fetcher) {
        var name = fetcher.name || null;
        //Store fetcher by name
        if (!(fetcher && name)) {
            throw new Error('Fetcher is not defined correctly');
        }

        this.fetchers[name] = fetcher;
        return;
    };

    /**
     * @method middleware
     * @returns {Function} middleware
     *     @param {Object} req
     *     @param {Object} res
     *     @param {Object} next
     */
    Fetcher.prototype.middleware = function () {
        var self = this;
        return function (req, res, next) {
            var request;

            if (req.path.indexOf(Fetcher.pathPrefix) !== 0) {
                //Skip non fetchr requests
                next();
                return;
            }

            if (req.method === GET) {
                var defaultPath = Fetcher.pathPrefix + '/resource/',
                    path = req.path.substr(defaultPath.length).split(';');
                request = {
                    resource: path.shift(),
                    operation: OP_READ,
                    params: qs.parse(path.join('&')),
                    context: {},
                    callback: function (err, data) {
                        if (err) {
                            res.send('400', 'request failed');
                        }
                        res.json(data);
                    }
                };
            } else {
                var requests = req.body.requests,
                    context = req.body.context;

                if (!requests || requests.length === 0) {
                    res.send(204);
                }

                var DEFAULT_GUID = 'g0',
                    singleRequest = requests[DEFAULT_GUID];
                request = {
                    resource: singleRequest.resource,
                    operation: singleRequest.operation,
                    params: singleRequest.params,
                    body: singleRequest.body || {},
                    context: context,
                    callback: function(err, data) {
                        if(err) {
                            res.send('400', 'request failed');
                        }
                        var responseObj = {};
                        responseObj[DEFAULT_GUID] = {data: data};
                        res.json(responseObj);
                    }
                };
            }

            self.single(request);
            //TODO: Batching and multi requests
        };
    };

    /**
     * @method getFetcher
     * @param {String} name
     * @returns {Function} fetcher
     */
    Fetcher.prototype.getFetcher = function (name) {
        //Access fetcher by name
        if (!name || !this.fetchers[name]) {
            throw new Error('Fetcher could not be found');
        }
        return this.fetchers[name];
    };

    // ------------------------------------------------------------------
    // Data Access Wrapper Methods
    // ------------------------------------------------------------------

    /**
     * Execute a single request.
     * @method single
     * @param {Object} request
     * @param {String} request.resource  The resource name
     * @param {String} request.operation The CRUD operation name: 'create|read|update|delete'.
     * @param {Object} request.params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} request.body      The JSON object that contains the resource data that is being updated. Not used
     *                           for read and delete operations.
     * @param {Object} request.context The context object.  It can contain "config" for per-request config data.
     * @param {Function} request.callback callback convention is the same as Node.js
     * @protected
     * @static
     */
    Fetcher.prototype.single = function (request) {
        debug(request.resource);
        var store = this.getFetcher(request.resource.split('.')[0]),
            op = request.operation,
            resource = request.resource,
            params = request.params,
            body = request.body,
            context = request.context,
            callback = request.callback,
            args = [resource, params, context, callback];

        if ((op === OP_CREATE) || (op === OP_UPDATE)) {
            args.splice(2, 0, body);
        }

        store[op].apply(store, args);
    };

    // ------------------------------------------------------------------
    // CRUD Methods
    // ------------------------------------------------------------------

    /**
     * read operation (read as in CRUD).
     * @method read
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} [context={}] The context object.  It can contain "config" for per-request config data.
     * @param {Function} callback callback convention is the same as Node.js
     * @static
     */
    Fetcher.prototype.read = function (resource, params, context, callback) {
        var request = {
            resource: resource,
            operation: 'read',
            params: params,
            context: context,
            callback: callback
        };
        this.single(request);
    };
    /**
     * create operation (create as in CRUD).
     * @method create
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} body      The JSON object that contains the resource data that is being created
     * @param {Object} [context={}] The context object.  It can contain "config" for per-request config data.
     * @param {Function} callback callback convention is the same as Node.js
     * @static
     */
    Fetcher.prototype.create = function (resource, params, body, context, callback) {
        var request = {
            resource: resource,
            operation: 'create',
            params: params,
            body: body,
            context: context,
            callback: callback
        };
        this.single(request);
    };
    /**
     * update operation (update as in CRUD).
     * @method update
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} body      The JSON object that contains the resource data that is being updated
     * @param {Object} [context={}] The context object.  It can contain "config" for per-request config data.
     * @param {Function} callback callback convention is the same as Node.js
     * @static
     */
    Fetcher.prototype.update = function (resource, params, body, context, callback) {
        var request = {
            resource: resource,
            operation: 'update',
            params: params,
            body: body,
            context: context,
            callback: callback
        };
        this.single(request);
    };
    /**
     * delete operation (delete as in CRUD).
     * @method del
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} [context={}] The context object.  It can contain "config" for per-request config data.
     * @param {Function} callback callback convention is the same as Node.js
     * @static
     */
    Fetcher.prototype.del = function (resource, params, context, callback) {
        var request = {
            resource: resource,
            operation: 'del',
            params: params,
            context: context,
            callback: callback
        };
        this.single(request);
    };

    return Fetcher;
};
