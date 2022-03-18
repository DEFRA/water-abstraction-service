const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const csvMapper = require('../../../../../src/modules/charge-versions/lib/csv-adapter/mapper');

const csv = `firstname,lastname,age
Fred,Bassett,35
Jim,Beam,24
`;

const expectedResult = [
  { firstname: 'Fred', lastname: 'Bassett', age: '35' },
  { firstname: 'Jim', lastname: 'Beam', age: '24' }
];

experiment('returns CSV to JSON mapper', () => {
  experiment('mapCsv', () => {
    test('maps a CSV string to an array of charge version objects', async () => {
      const result = await csvMapper.mapCsv(csv);
      expect(result).to.equal(expectedResult);
    });
  });
});
