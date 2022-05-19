const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()

const extractConditions = require('../../../../src/modules/licences/lib/extractConditions')

experiment('extractConditions', () => {
  test('returns an empty array for a licence with no current version', async () => {
    const licence = {}
    const conditions = extractConditions(licence)
    expect(conditions).to.equal([])
  })

  test('returns the conditions when a licence has a single purpose', async () => {
    const licence = {
      purposes: [{
        purpose: [{ purpose_tertiary: { DESCR: 'purpose text' } }],
        licenceConditions: [
          {
            ID: 1,
            PARAM1: '1 limited',
            PARAM2: '1,000 m3 per day',
            TEXT: 'Some condition text',
            condition_type: { CODE: 'AA', SUBCODE: 'BB' },
            FGAC_REGION_CODE: 2
          },
          {
            ID: 2,
            PARAM1: '2 limited',
            PARAM2: '2,000 m3 per day',
            TEXT: 'Some condition text',
            condition_type: { CODE: 'CC', SUBCODE: 'DD' },
            FGAC_REGION_CODE: 2
          }
        ]
      }]
    }

    const conditions = extractConditions(licence)

    expect(conditions.length).to.equal(2)
  })

  test('returns the conditions for multiple purposes', async () => {
    const licence = {
      purposes: [
        {
          purpose: [{ purpose_tertiary: { DESCR: 'purpose one' } }],
          licenceConditions: [
            {
              ID: 1,
              PARAM1: 'one/1 - p1',
              PARAM2: 'one/1 - p2',
              TEXT: 'one',
              condition_type: { CODE: 'AA', SUBCODE: 'BB' },
              FGAC_REGION_CODE: 3
            },
            {
              ID: 2,
              PARAM1: 'one/2 - p1',
              PARAM2: 'one/2 - p2',
              TEXT: 'two',
              condition_type: { CODE: 'CC', SUBCODE: 'DD' },
              FGAC_REGION_CODE: 3
            }
          ]
        },
        {
          purpose: [{ purpose_tertiary: { DESCR: 'purpose two' } }],
          licenceConditions: [
            {
              ID: 3,
              PARAM1: 'two/3 - p1',
              PARAM2: 'two/3 - p2',
              TEXT: 'three',
              condition_type: { CODE: 'EE', SUBCODE: 'FF' },
              FGAC_REGION_CODE: 3
            }
          ]
        }
      ]
    }

    const conditions = extractConditions(licence)
    expect(conditions).to.equal([
      {
        id: 'nald://conditions/3/1',
        regionCode: 3,
        code: 'AA',
        subCode: 'BB',
        text: 'one',
        parameter1: 'one/1 - p1',
        parameter2: 'one/1 - p2',
        purposeText: 'purpose one'
      },
      {
        id: 'nald://conditions/3/2',
        regionCode: 3,
        code: 'CC',
        subCode: 'DD',
        text: 'two',
        parameter1: 'one/2 - p1',
        parameter2: 'one/2 - p2',
        purposeText: 'purpose one'
      },
      {
        id: 'nald://conditions/3/3',
        regionCode: 3,
        code: 'EE',
        subCode: 'FF',
        text: 'three',
        parameter1: 'two/3 - p1',
        parameter2: 'two/3 - p2',
        purposeText: 'purpose two'
      }
    ])
  })
})
