/**
 * @file index.js
 * @fileOverview Index file for the eris-db javascript API. This file contains a factory method
 * for creating a new <tt>ErisDB</tt> instance.
 * @author Andreas Olofsson (andreas@erisindustries.com)
 * @module index
 */
'use strict';

var erisdb = require('./lib/erisdb');
const server = require('./lib/server')
const transports = require('./lib/transports')
var validation = require('./lib/validation');
var url = require('url');


/**
 * ErisDB allows you to do remote calls to a running erisdb-tendermint client.
 *
 * @param {string} URL The RPC endpoint URL.
 * @returns {module:erisdb-ErisDB}
 */
exports.createInstance = function(urlString, options){
  const parsed = url.parse(urlString)

  if (parsed.protocol === 'ws:') {
    throw new Error('WebSocket is disabled until Eris DB complies with ' +
      'JSON-RPC.  See: https://github.com/eris-ltd/eris-db/issues/355')
  } else {
    var validator = new validation.SinglePolicyValidator(true);
    const transport = transports(parsed)
    return erisdb.createInstance(server(transport, options), validator);
  }
};
