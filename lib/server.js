'use strict'

const I = require('iteray')
const jsonRpc = require('@nodeguy/json-rpc')
const R = require('ramda')
const stream = require('stream')
const type = require('@nodeguy/type')
const url = require('url')

// Work around Eris DB bug: https://github.com/eris-ltd/eris-db/issues/271
const convertIdToString = (request) =>
  R.assoc('id', String(request.id), request)

const addErisDbNamespace = (request) =>
  R.assoc('method', 'erisdb.' + request.method, request)

// Eris DB wants named parameters, sigh.
const positionToNamedParameters = (request) =>
  R.assoc('params', request.params[0], request)

// Work around Eris DB bug: https://github.com/eris-ltd/eris-db/issues/270
const removeNullError = (response) =>
  response.error === null
    ? R.dissoc('error', response)
    : response

const transportWrapper = (transport) =>
  R.pipe(
    I.map(R.pipe(
      convertIdToString,
      addErisDbNamespace,
      positionToNamedParameters
    )),
    transport,
    I.map(removeNullError)
  )

module.exports = (transport) => {
  const client = jsonRpc.client(transportWrapper(transport))

  // Our API expects callbacks instead of promises so wrap methods.
  return new Proxy(client.methods, {get: (target, name) =>
    function () {
      const callback = (arguments.length > 0) &&
        (type.is(Function, I.get(-1, arguments)))
        ? I.get(-1, arguments)
        : R.identity

      target[name](...I.slice(0, -1, arguments)).then(
        (value) => callback(null, value),
        (reason) => {
          console.error('Eris DB error:  Call of method "' + reason.method +
            '" with parameters ' + JSON.stringify(reason.params[0], null, 2) +
            ' responded with "' + reason.message + '".')

          callback(reason)
        }
      )
    }
  })
}
