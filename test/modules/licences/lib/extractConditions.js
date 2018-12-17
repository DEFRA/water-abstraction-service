const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const extractConditions = require('../../../../src/modules/licences/lib/extractConditions');

experiment('extractConditions', () => {
  test('returns an empty array for a licence with no current version', async () => {
    const licence = {};
    const conditions = extractConditions(licence);
    expect(conditions).to.equal([]);
  });

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
            condition_type: { CODE: 'AA', SUBCODE: 'BB' }
          },
          {
            ID: 2,
            PARAM1: '2 limited',
            PARAM2: '2,000 m3 per day',
            TEXT: 'Some condition text',
            condition_type: { CODE: 'CC', SUBCODE: 'DD' }
          }
        ]
      }]
    };

    const conditions = extractConditions(licence);

    expect(conditions.length).to.equal(2);
  });

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
              condition_type: { CODE: 'AA', SUBCODE: 'BB' }
            },
            {
              ID: 2,
              PARAM1: 'one/2 - p1',
              PARAM2: 'one/2 - p2',
              TEXT: 'two',
              condition_type: { CODE: 'CC', SUBCODE: 'DD' }
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
              condition_type: { CODE: 'EE', SUBCODE: 'FF' }
            }
          ]
        }
      ]
    };

    const conditions = extractConditions(licence);
    expect(conditions).to.equal([
      {
        id: 1,
        code: 'AA',
        subCode: 'BB',
        text: 'one',
        parameter1: 'one/1 - p1',
        parameter2: 'one/1 - p2',
        purposeText: 'purpose one'
      },
      {
        id: 2,
        code: 'CC',
        subCode: 'DD',
        text: 'two',
        parameter1: 'one/2 - p1',
        parameter2: 'one/2 - p2',
        purposeText: 'purpose one'
      },
      {
        id: 3,
        code: 'EE',
        subCode: 'FF',
        text: 'three',
        parameter1: 'two/3 - p1',
        parameter2: 'two/3 - p2',
        purposeText: 'purpose two'
      }
    ]);
  });
});
