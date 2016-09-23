'use strict'

const assert = require('assert')
const ErisDb = require('../..')
const Promise = require('bluebird')
const test = require('../../lib/test')

it('sends ether from one account to another', function () {
  this.timeout(60 * 1000)

  return Promise.all([
    test.newBlockchain('blockchain'),
    test.privateValidator()
  ]).spread((url, validator) => {
    const erisDb = ErisDb.createInstance(url)
    const privateKey = validator.priv_key[1]
    const destination = '0000000000000000000000000000000000000010'
    const amount = 42

    return Promise.fromCallback((callback) =>
      erisDb.txs().send(privateKey, destination, amount, null, callback)
    ).then(() => {
      return Promise.fromCallback((callback) =>
        erisDb.accounts().getAccount(destination, callback)
      ).then((response) => {
        assert.equal(response.balance, 42)
      })
    })
  })
})
