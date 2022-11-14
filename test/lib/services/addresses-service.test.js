const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { v4: uuid } = require('uuid')
const addressesService = require('../../../src/lib/services/addresses-service')
const eventsService = require('../../../src/lib/services/events')
const addressesConnector = require('../../../src/lib/connectors/crm-v2/addresses')
const addressMapper = require('../../../src/lib/mappers/address')
const Address = require('../../../src/lib/models/address')
const Event = require('../../../src/lib/models/event')

const { InvalidEntityError } = require('../../../src/lib/errors')

const addressId = uuid()

experiment('modules/billing/services/addresses-service', () => {
  beforeEach(async () => {
    sandbox.stub(addressMapper, 'modelToCrm')
    sandbox.stub(addressMapper, 'crmToModel')
    sandbox.stub(addressMapper, 'uiToModel')

    sandbox.stub(addressesConnector, 'deleteAddress')
    sandbox.stub(addressesConnector, 'createAddress')

    sandbox.stub(eventsService, 'create')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getAddressModel', () => {
    let addressData, addressModel, response

    experiment('when only an address id is provided', () => {
      beforeEach(async () => {
        addressData = {
          addressId
        }
        addressModel = new Address(addressId)
        addressMapper.uiToModel.returns(addressModel)
        response = await addressesService.getAddressModel(addressData)
      })
      test('calls the address mapper to map data from the ui', async () => {
        const [passedData] = addressMapper.uiToModel.lastCall.args
        expect(passedData).to.equal(addressData)
      })

      test('returns the output from the mapper', async () => {
        expect(response).to.equal(addressModel)
      })
    })

    experiment('when new address data is provided', () => {
      beforeEach(async () => {
        addressData = {
          addressLine1: null,
          addressLine2: '742',
          addressLine3: 'Evergreen Terrace',
          addressLine4: null,
          town: 'Springfield',
          county: null,
          postcode: '12345',
          country: 'USA'
        }
        addressModel = new Address()
        addressModel.fromHash(addressData)
        addressMapper.uiToModel.returns(addressModel)

        response = await addressesService.getAddressModel(addressData)
      })
      test('calls the address mapper to map data from the ui', async () => {
        const [passedData] = addressMapper.uiToModel.lastCall.args
        expect(passedData).to.equal(addressData)
      })

      test('returns the output from the mapper', async () => {
        expect(response).to.equal(addressModel)
      })

      test('throws an invalid entity error when the address data is invalid', async () => {
        addressData = {
          addressLine2: '742',
          addressLine3: 'Evergreen Terrace',
          town: 'Springfield'
        }
        addressModel = new Address()
        addressModel.fromHash(addressData)
        addressMapper.uiToModel.returns(addressModel)

        try {
          await addressesService.getAddressModel(addressData)
        } catch (err) {
          expect(err).to.be.instanceOf(InvalidEntityError)
          expect(err.message).to.equal('Invalid address')
        }
      })
    })
  })

  experiment('.createAddress', () => {
    let addressData, mappedData, newAddress, addressModel, response
    beforeEach(async () => {
      addressData = {
        addressLine2: '742',
        addressLine3: 'Evergreen Terrace',
        town: 'Springfield',
        country: 'Simpsons Land'
      }
      mappedData = {
        address2: '742',
        address3: 'Evergreen Terrace',
        town: 'Springfield',
        country: 'Simpsons Land'
      }
      newAddress = {
        addressId,
        address2: '742',
        address3: 'Evergreen Terrace',
        town: 'Springfield',
        country: 'Simpsons Land'
      }
      addressModel = new Address(addressId)

      addressMapper.modelToCrm.returns(mappedData)
      addressMapper.crmToModel.returns(addressModel)
    })

    experiment('when there is no error', () => {
      beforeEach(async () => {
        addressesConnector.createAddress.resolves(newAddress)
        response = await addressesService.createAddress(addressData)
      })

      test('calls the address mapper to map data for the DB call', async () => {
        const [passedData] = addressMapper.modelToCrm.lastCall.args
        expect(passedData).to.equal(addressData)
      })

      test('calls the address connector with the mapped data', async () => {
        const [addressData] = addressesConnector.createAddress.lastCall.args
        expect(addressData).to.equal(mappedData)
      })

      test('calls the crm to model mapper with the output of the crm call', async () => {
        const [addressData] = addressMapper.crmToModel.lastCall.args
        expect(addressData).to.equal(newAddress)
      })

      test('returns the output from the mapper', async () => {
        expect(response).to.equal(addressModel)
      })

      test('does not save an event', async () => {
        expect(eventsService.create.called).to.be.false()
      })
    })

    experiment('when an issuer email address is supplied', () => {
      const EMAIL = 'mail@example.com'

      beforeEach(async () => {
        addressesConnector.createAddress.resolves(newAddress)
        response = await addressesService.createAddress(addressData, EMAIL)
      })

      test('saves an event', async () => {
        const [ev] = eventsService.create.lastCall.args
        expect(ev instanceof Event).to.be.true()
        expect(ev.type).to.equal('address:create')
        expect(ev.issuer).to.equal(EMAIL)
        expect(ev.metadata).to.equal({ address: newAddress })
        expect(ev.status).to.equal('created')
      })
    })

    experiment('when there is a 409 conflict', () => {
      beforeEach(async () => {
        const ERROR = new Error()
        ERROR.statusCode = 409
        ERROR.error = {
          existingEntity: newAddress
        }

        addressesConnector.createAddress.rejects(ERROR)
        response = await addressesService.createAddress(addressData)
      })

      test('calls the address mapper to map data for the DB call', async () => {
        const [passedData] = addressMapper.modelToCrm.lastCall.args
        expect(passedData).to.equal(addressData)
      })

      test('calls the address connector with the mapped data', async () => {
        const [addressData] = addressesConnector.createAddress.lastCall.args
        expect(addressData).to.equal(mappedData)
      })

      test('calls the crm to model mapper with the output of the crm call', async () => {
        const [addressData] = addressMapper.crmToModel.lastCall.args
        expect(addressData).to.equal(newAddress)
      })

      test('returns the output from the mapper', async () => {
        expect(response).to.equal(addressModel)
      })
    })

    experiment('when there is an unexpected error', () => {
      const ERROR = new Error('oops')

      beforeEach(async () => {
        addressesConnector.createAddress.rejects(ERROR)
      })

      test('the error is rethrown', async () => {
        const func = () => addressesService.createAddress(addressData)
        const err = await expect(func()).to.reject()
        expect(err).to.equal(ERROR)
      })
    })
  })

  experiment('.deleteAddress', () => {
    beforeEach(async () => {
      addressesConnector.deleteAddress.resolves()

      await addressesService.deleteAddress({ id: 'test-address-id' })
    })

    test('the id is passed to the connector', () => {
      const [passedId] = addressesConnector.deleteAddress.lastCall.args
      expect(passedId).to.equal('test-address-id')
    })
  })
})
