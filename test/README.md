# Test Framework

Specialized functions are available in `lib/test.js` to make testing  interactions with the Burrow server easier.  The general idea is that the JavaScript library interacting with the Burrow server is very complex so we reduce the complexity by decoupling their interactions with each other.  The decoupling is achieved by replacing either the client or the server (at different times) with a _test vector_ that simulates its behavior.  The test vector is an automatic recording of the conversation between the two.

We replace this:

```
client    <-> server
(complex)     (complex)
```

with this:

```
client    <-> test vector <-> server
(complex)     (simple)        (complex)
```

so that the client can be tested in isolation:

```
client    <-> test vector
(complex)     (simple)
```

and the server can be tested in isolation:

```
test vector <-> server
(simple)        (complex)
```

For more background on this technique see [Integrated Tests Are A Scam](https://vimeo.com/80533536).

## Usage in Tests

A standard [Mocha](https://mochajs.org/) test file structure looks like this:

```JavaScript
'use strict'

const assert = require('assert')

before(function () {
  // Set up artifacts for testing.
})

after(function () {
  // Clean up test artifacts.
})

it(`description of the test`, function () {
  // Compute results.
  assert.equal(results, expectations)
})
```

The `test` library will do all of the heavy lifting of creating a blockchain and making it possible to record and playback the test vector if you structure your code like this:

```JavaScript
'use strict'

const assert = require('assert')
const vector = require('../../lib/test').Vector()

before(vector.before(__dirname, {protocol: 'http:'}))
after(vector.after())

it(`sends ether from one account to another`,
  vector.it(function ({db, validator: {priv_key: [, privateKey]}}) {
    const destination = '0000000000000000000000000000000000000010'
    const amount = 42

    return Promise.fromCallback((callback) =>
      db.txs().sendAndHold(privateKey, destination, amount, null, callback)
    ).then(() => {
      return Promise.fromCallback((callback) =>
        db.accounts().getAccount(destination, callback)
      ).then((response) => {
        assert.equal(response.balance, 42)
      })
    })
  })
)
```

Notice that the callback passed to `vector.it` is called with the `db` object and the contents of `priv_validator.json`.

## Commands

Tests written like this can then be used by the following commands:

To test the library against pre-recorded vectors:

```
npm test
```

To test the library against Burrow while automatically recording vectors:

```
TEST=record npm test
```

To test Burrow against pre-recorded vectors without exercising the client:

```
TEST=server npm test
```
