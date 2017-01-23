'use strict'

const httpClient = require('request-promise')
const I = require('iteray')
const R = require('ramda')
const url = require('url')
const WebSocket = require('ws')

const webSocketPipe = (socket) =>
  (asyncIterable) => {
    const input = I.to('Iterator', asyncIterable)
    const output = I.AsyncQueue()

    const pull = () => {
      if (socket.readyState === socket.OPEN) {
        input.next().then((result) => {
          if (result.done) {
            socket.close()
          } else {
            socket.send(result.value)
          }

          setImmediate(pull)
        })
      }
    }

    socket.onclose = () => {
      output.push(Promise.resolve({done: true}))
    }

    socket.onerror = (error) => {
      output.push(Promise.reject(error))
    }

    socket.onmessage = (event) => {
      output.push(Promise.resolve({done: false, value: event.data}))
    }

    socket.onopen = pull

    pull()
    return output
  }

const webSocketTransport = (url) =>
  R.pipe(
    I.map(JSON.stringify),
    webSocketPipe(new WebSocket(url)),
    I.map(JSON.parse)
  )

const jsonRpcToHttpRequest = (url) =>
  (request) => ({
    url,
    method: 'POST',
    json: true,
    body: request
  })

const httpToJsonRpcError = (promise) =>
  promise.catch((reason) => ({
    jsonrpc: '2.0',
    error: reason.error,
    id: reason.options.body.id
  }))

const httpTransport = (url) => R.pipe(
  I.map(R.pipe(
    jsonRpcToHttpRequest(url),
    httpClient,
    httpToJsonRpcError
  )),
  I.pull
)

const transportMap = {
  'http:': httpTransport,
  'ws:': webSocketTransport
}

module.exports = (url) =>
  transportMap[url.protocol](url)
