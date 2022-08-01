'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const addressService = require('../../../src/modules/address-search/services/address-service')
const plugin = require('../../../src/modules/address-search/plugin')

experiment('modules/address-search/plugin.js', () => {
  let server

  beforeEach(async () => {
    server = {
      method: sandbox.stub()
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('defines a plugin name', async () => {
    expect(plugin.name).to.equal('addressSearchPlugin')
  })

  test('defines a register method', async () => {
    expect(plugin.register).to.be.a.function()
  })

  test('when the plugin is registered, a cached server method is added to get addresses', async () => {
    plugin.register(server)
    const [name, func, options] = server.method.lastCall.args

    expect(name).to.equal('getAddressesByPostcode')
    expect(func).to.equal(addressService.getAddressesByPostcode)
    expect(options).to.equal({
      cache: {
        expiresIn: 6 * 60 * 60 * 1000,
        generateTimeout: 2000
      }
    })
  })
})
