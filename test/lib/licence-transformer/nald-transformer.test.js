'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')

const NaldTransformer = require('../../../src/lib/licence-transformer/nald-transformer')

experiment('lib/licence-transformer/nald-transformer', () => {
  experiment('export', () => {
    let data
    let exported

    beforeEach(async () => {
      data = {
        LIC_NO: '123',
        FGAC_REGION_CODE: 1,
        data: {
          roles: [],
          current_version: {
            purposes: []
          },
          purposes: [],
          versions: [
            {
              STATUS: 'CURR',
              ACON_APAR_ID: 1,
              ACON_AADD_ID: 2,
              parties: [
                {
                  ID: 1,
                  contacts: [{
                    AADD_ID: 2,
                    party_address: {}
                  }]
                }
              ]
            }
          ]
        }
      }

      const transformer = new NaldTransformer()
      await transformer.load(data)
      exported = transformer.export()
    })

    test('sets the regionCode', async () => {
      expect(exported.regionCode).to.equal(1)
    })

    test('sets the licenceNumber', async () => {
      expect(exported.licenceNumber).to.equal('123')
    })
  })
})
