const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const extractPoints = require('../../../../src/modules/licences/lib/extractPoints');

experiment('extractPoints', () => {
  test('returns an empty array for a licence with no current version', async () => {
    const licence = {};
    const points = extractPoints(licence);
    expect(points).to.equal([]);
  });

  test('returns the points when a licence has a single purpose', async () => {
    const licence = {
      purposes: [{
        purposePoints: [
          { point_detail: { ID: 1, LOCAL_NAME: 'one' } },
          { point_detail: { ID: 2, LOCAL_NAME: 'two' } }
        ]
      }]
    };

    const points = extractPoints(licence);
    expect(points).to.equal([
      { id: 1, name: 'one' },
      { id: 2, name: 'two' }
    ]);
  });

  test('returns the points for multiple purposes', async () => {
    const licence = {
      purposes: [
        {
          purposePoints: [
            { point_detail: { ID: 1, LOCAL_NAME: 'one' } },
            { point_detail: { ID: 2, LOCAL_NAME: 'two' } }
          ]
        },
        {
          purposePoints: [
            { point_detail: { ID: 3, LOCAL_NAME: 'three' } }
          ]
        }
      ]
    };

    const points = extractPoints(licence);
    expect(points).to.equal([
      { id: 1, name: 'one' },
      { id: 2, name: 'two' },
      { id: 3, name: 'three' }
    ]);
  });

  test('returns unique points for multiple purposes', async () => {
    const licence = {
      purposes: [
        {
          purposePoints: [
            { point_detail: { ID: 1, LOCAL_NAME: 'one' } },
            { point_detail: { ID: 2, LOCAL_NAME: 'two' } }
          ]
        },
        {
          purposePoints: [
            { point_detail: { ID: 3, LOCAL_NAME: 'three' } }
          ]
        },
        {
          purposePoints: [
            { point_detail: { ID: 3, LOCAL_NAME: 'three' } }
          ]
        }
      ]
    };

    const points = extractPoints(licence);
    expect(points).to.equal([
      { id: 1, name: 'one' },
      { id: 2, name: 'two' },
      { id: 3, name: 'three' }
    ]);
  });
});
