const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()

const extractPoints = require('../../../../src/modules/licences/lib/extractPoints')

experiment('extractPoints', () => {
  test('returns an empty array for a licence with no current version', async () => {
    const licence = {}
    const points = extractPoints(licence)
    expect(points).to.equal([])
  })

  test('returns the points when a licence has a single purpose', async () => {
    const licence = {
      purposes: [{
        purposePoints: [
          { point_detail: { ID: 1, LOCAL_NAME: 'one', FGAC_REGION_CODE: 2 } },
          { point_detail: { ID: 2, LOCAL_NAME: 'two', FGAC_REGION_CODE: 2 } }
        ]
      }]
    }

    const points = extractPoints(licence)
    expect(points).to.equal([
      { id: 'nald://points/2/1', name: 'one' },
      { id: 'nald://points/2/2', name: 'two' }
    ])
  })

  test('returns the points for multiple purposes', async () => {
    const licence = {
      purposes: [
        {
          purposePoints: [
            { point_detail: { ID: 1, LOCAL_NAME: 'one', FGAC_REGION_CODE: 3 } },
            { point_detail: { ID: 2, LOCAL_NAME: 'two', FGAC_REGION_CODE: 3 } }
          ]
        },
        {
          purposePoints: [
            { point_detail: { ID: 3, LOCAL_NAME: 'three', FGAC_REGION_CODE: 3 } }
          ]
        }
      ]
    }

    const points = extractPoints(licence)
    expect(points).to.equal([
      { id: 'nald://points/3/1', name: 'one' },
      { id: 'nald://points/3/2', name: 'two' },
      { id: 'nald://points/3/3', name: 'three' }
    ])
  })

  test('returns unique points for multiple purposes', async () => {
    const licence = {
      purposes: [
        {
          purposePoints: [
            { point_detail: { ID: 1, LOCAL_NAME: 'one', FGAC_REGION_CODE: 4 } },
            { point_detail: { ID: 2, LOCAL_NAME: 'two', FGAC_REGION_CODE: 4 } }
          ]
        },
        {
          purposePoints: [
            { point_detail: { ID: 3, LOCAL_NAME: 'three', FGAC_REGION_CODE: 4 } }
          ]
        },
        {
          purposePoints: [
            { point_detail: { ID: 3, LOCAL_NAME: 'three', FGAC_REGION_CODE: 4 } }
          ]
        }
      ]
    }

    const points = extractPoints(licence)
    expect(points).to.equal([
      { id: 'nald://points/4/1', name: 'one' },
      { id: 'nald://points/4/2', name: 'two' },
      { id: 'nald://points/4/3', name: 'three' }
    ])
  })
})
