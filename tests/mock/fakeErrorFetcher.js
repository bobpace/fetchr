/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var Fetcher = {
    name: 'fake_error_fetcher',

    // ------------------------------------------------------------------
    // CRUD Methods
    // ------------------------------------------------------------------

    /**
     * read operation (read as in CRUD).
     * @method read
     * @param {Object} req  The request object from connect/express
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} [context={}] The context object.  It can contain "config" for per-request config data.
     * @param {Fetcher~fetcherCallback} callback callback invoked when fetcher is complete.
     * @static
     */
    read: function (req, resource, params, context) {
      return new Promise(function(resolve, reject) {
        reject({
          statusCode: parseInt(params.statusCode),
          message: params.message,
          read: 'error'
        });
      });
    },
    /**
     * create operation (create as in CRUD).
     * @method create
     * @param {Object} req  The request object from connect/express
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} body      The JSON object that contains the resource data that is being created
     * @param {Object} [context={}] The context object.  It can contain "config" for per-request config data.
     * @param {Fetcher~fetcherCallback} callback callback invoked when fetcher is complete.
     * @static
     */
    create: function (req, resource, params, body, context) {
      return new Promise(function(resolve, reject) {
        reject({
          statusCode: parseInt(params.statusCode),
          message: params.message,
          create: 'error'
        });
      });
    },
    /**
     * update operation (update as in CRUD).
     * @method update
     * @param {Object} req  The request object from connect/express
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} body      The JSON object that contains the resource data that is being updated
     * @param {Object} [context={}] The context object.  It can contain "config" for per-request config data.
     * @param {Fetcher~fetcherCallback} callback callback invoked when fetcher is complete.
     * @static
     */
    update: function (req, resource, params, body, context) {
      return new Promise(function(resolve, reject) {
        reject({
          statusCode: parseInt(params.statusCode),
          message: params.message,
          update: 'error'
        });
      });
    },
    /**
     * delete operation (delete as in CRUD).
     * @method delete
     * @param {Object} req  The request object from connect/express
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} [context={}] The context object.  It can contain "config" for per-request config data.
     * @param {Fetcher~fetcherCallback} callback callback invoked when fetcher is complete.
     * @static
     */
    delete: function (req, resource, params, context) {
      return new Promise(function(resolve, reject) {
        reject({
          statusCode: parseInt(params.statusCode),
          message: params.message,
          delete: 'error'
        });
      });
    }

};

module.exports = Fetcher;
