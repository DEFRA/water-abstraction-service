const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const eventsService = require('../../../../../src/lib/services/events')
const csvMapper = require('../../../../../src/modules/charge-versions-upload/lib/mapper')
const chargeVersionMapper = require('../../../../../src/modules/charge-versions-upload/lib/mapper/chargeVersionMapper')
const Event = require('../../../../../src/lib/models/event')

experiment('returns CSV to JSON mapper', () => {
  let event
  let user

  beforeEach(() => {
    event = new Event()
    user = {}
    sandbox.stub(chargeVersionMapper, 'mapToChargeVersion')
    sandbox.stub(eventsService, 'update').resolves({})
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('returns CSV to JSON mapper', () => {
    experiment('mapCsv', () => {
      test('maps a CSV with a heading and eight rows to an array of grouped objects based on the licence number and group', async () => {
        // Note that groupings of 'A' are not grouped together

        const csv = `licence_number,charge_reference_details_charge_element_group,test_heading
  LICENCE/1,A,Row 1
  LICENCE/3,A,Row 2
  LICENCE/2,B,Row 3
  LICENCE/3,A,Row 4
  LICENCE/4,B,Row 5
  LICENCE/3,A,Row 6
  LICENCE/2,B,Row 7
  LICENCE/4,B,Row 8
  LICENCE/5,C,Row 9
  LICENCE/5,A,Row 10
  LICENCE/5,D,Row 11
  LICENCE/5,B,Row 12
  LICENCE/5,B,Row 13
  LICENCE/5,C,Row 14
  LICENCE/5,A,Row 15
`

        chargeVersionMapper.mapToChargeVersion = async data => data
        const result = await csvMapper.mapCsv(csv, user, event)
        expect(result).to.equal([
          [ // LICENCE/1
            [ // Group A
              {
                licenceNumber: 'LICENCE/1',
                chargeReferenceDetailsChargeElementGroup: 'A',
                testHeading: 'Row 1'
              }
            ]
          ],
          [ // LICENCE/2
            [ // Group B
              {
                licenceNumber: 'LICENCE/2',
                chargeReferenceDetailsChargeElementGroup: 'B',
                testHeading: 'Row 3'
              },
              {
                licenceNumber: 'LICENCE/2',
                chargeReferenceDetailsChargeElementGroup: 'B',
                testHeading: 'Row 7'
              }
            ]
          ],
          [ // LICENCE/3
            [ // Group A - 1
              {
                licenceNumber: 'LICENCE/3',
                chargeReferenceDetailsChargeElementGroup: 'A',
                testHeading: 'Row 2'
              }
            ],
            [ // Group A - 2
              {
                licenceNumber: 'LICENCE/3',
                chargeReferenceDetailsChargeElementGroup: 'A',
                testHeading: 'Row 4'
              }
            ],
            [ // Group A - 3
              {
                licenceNumber: 'LICENCE/3',
                chargeReferenceDetailsChargeElementGroup: 'A',
                testHeading: 'Row 6'
              }
            ]
          ],
          [ // LICENCE/4
            [ // Group B
              {
                licenceNumber: 'LICENCE/4',
                chargeReferenceDetailsChargeElementGroup: 'B',
                testHeading: 'Row 5'
              },
              {
                licenceNumber: 'LICENCE/4',
                chargeReferenceDetailsChargeElementGroup: 'B',
                testHeading: 'Row 8'
              }
            ]
          ],
          [ // LICENCE/5
            [ // Group A - 1
              {
                licenceNumber: 'LICENCE/5',
                chargeReferenceDetailsChargeElementGroup: 'A',
                testHeading: 'Row 10'
              }
            ],
            [ // Group A - 2
              {
                licenceNumber: 'LICENCE/5',
                chargeReferenceDetailsChargeElementGroup: 'A',
                testHeading: 'Row 15'
              }
            ],
            [ // Group B
              {
                licenceNumber: 'LICENCE/5',
                chargeReferenceDetailsChargeElementGroup: 'B',
                testHeading: 'Row 12'
              },
              {
                licenceNumber: 'LICENCE/5',
                chargeReferenceDetailsChargeElementGroup: 'B',
                testHeading: 'Row 13'
              }
            ],
            [ // Group C
              {
                licenceNumber: 'LICENCE/5',
                chargeReferenceDetailsChargeElementGroup: 'C',
                testHeading: 'Row 9'
              },
              {
                licenceNumber: 'LICENCE/5',
                chargeReferenceDetailsChargeElementGroup: 'C',
                testHeading: 'Row 14'
              }
            ],
            [ // Group D
              {
                licenceNumber: 'LICENCE/5',
                chargeReferenceDetailsChargeElementGroup: 'D',
                testHeading: 'Row 11'
              }
            ]
          ]
        ])
      })
    })
  })
})
