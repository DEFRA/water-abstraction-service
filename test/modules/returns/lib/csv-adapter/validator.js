const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const csvSchemaValidation = require('../../../../../src/modules/returns/lib/csv-adapter/validator');
const csvStringify = require('csv-stringify/lib/sync');

const validLicenceNumberRecord = ['Licence number', '123', '123abc'];
const validReturnReferenceRecord = ['Return reference', '1234', '4321'];
const validNilReturnRecord = ['Nil return Y/N', 'Y', 'N'];
const validUseAMeterRecord = ['Did you use a meter Y/N', 'Y', 'N'];
const validMeterMakeRecord = ['Meter make', 'Make 1', ''];
const validMeterSerialNumberRecord = ['Meter serial number', '123-123', ''];
const validUniqueReturnReferenceRecord = ['Unique return reference', 'v1:1:123:1234:2018-01-01:2019-01-01', 'v1:1:123abc:4321:2018-01-01:2019-01-01'];
const validDailyRecords = [
  ['9 April 2018', '10', 'Do not edit'],
  ['10 April 2018', '20', 'Do not edit'],
  ['11 April 2018', '30', 'Do not edit']
];
const validWeeklyRecords = [
  ['Week ending 9 April 2018', '10', 'Do not edit'],
  ['Week ending 10 April 2018', '20', 'Do not edit'],
  ['Week ending 11 April 2018', '30', 'Do not edit']
];
const validMonthlyRecords = [
  ['April 2018', '10', 'Do not edit'],
  ['April 2018', '20', 'Do not edit'],
  ['April 2018', '30', 'Do not edit']
];

const getValidSingleLicenceReturn = () => ([
  ['Licence number', '123'],
  ['Return reference', '123456'],
  ['Nil return Y/N', 'N'],
  ['Did you use a meter Y/N', 'Y'],
  ['Meter make', 'Make 1'],
  ['Meter serial number', '123-123'],
  ['9 April 2018', '10'],
  ['10 April 2018', '20'],
  ['11 April 2018', '30'],
  ['Unique return reference', 'v1:1:123:123456:2018-04-01:2019-03-31']
]);

experiment('csv-schema-validation', () => {
  test('handles inconsistent record lengths', async () => {
    const records = [
      ['Licence number', '123', '123abc', '123/abc'],
      ['Return reference', '123', '1234']
    ];

    const csv = csvStringify(records);
    const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

    expect(isValid).to.be.false();

    const errorMessage = 'Number of columns is inconsistent on line 2';
    const error = validationErrors.find(err => err.message === errorMessage);
    expect(error).to.equal({
      message: errorMessage,
      line: 2
    });
  });

  experiment('header validation', () => {
    test('returns error if Licence number field is incorrect', async () => {
      const records = [
        ['Not the licence number', '123', '123/abc']
      ];
      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Licence number field not in expected position';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 1
      });
    });

    test('returns error if Return reference field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        ['Not the return reference', '123', '456']
      ];
      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Return reference field not in expected position';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 2
      });
    });

    test('returns error if Nil return field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        ['Not the nil return field', 'Y', 'N']
      ];
      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Nil return Y/N field not in expected position';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 3
      });
    });

    test('returns error if Did you use a meter field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        validNilReturnRecord,
        ['Not the Did you use a meter field', 'Y', 'N']
      ];
      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Did you use a meter Y/N field not in expected position';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 4
      });
    });

    test('returns error if Meter make field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        validNilReturnRecord,
        validUseAMeterRecord,
        ['Not the Meter make record', 'Make 1', '']
      ];
      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Meter make field not in expected position';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 5
      });
    });

    test('returns error if Meter serial number field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        validNilReturnRecord,
        validUseAMeterRecord,
        validMeterMakeRecord,
        ['Not the Meter serial number record', 'Ser 1', '']
      ];
      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Meter serial number field not in expected position';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 6
      });
    });

    test('returns error if unexpected date field', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        validNilReturnRecord,
        validUseAMeterRecord,
        validMeterMakeRecord,
        validMeterSerialNumberRecord,
        ...validDailyRecords,
        ...validWeeklyRecords,
        ...validMonthlyRecords,
        ['not a date', '111', 'Do not edit'],
        validUniqueReturnReferenceRecord
      ];
      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Unexpected date format for return line';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 16
      });
    });

    experiment('will allow the date field to be in the format:', () => {
      const dates = [
        { format: 'D MMM YYYY', value: '8 Apr 2019' },
        { format: 'DD MMM YYYY', value: '08 Apr 2019' },
        { format: 'D-MMM-YYYY', value: '8-Apr-2019' },
        { format: 'DD-MMM-YYYY', value: '08-Apr-2019' },
        { format: 'D/MMM/YYYY', value: '8/Apr/2019' },
        { format: 'DD/MMM/YYYY', value: '08/Apr/2019' },
        { format: 'DD MMM YY', value: '08 Apr 19' },
        { format: 'DD-MMM-YY', value: '08-Apr-19' },
        { format: 'DD/MMM/YY', value: '08/Apr/19' },
        { format: 'D MMM YY', value: '8 Apr 19' },
        { format: 'D-MMM-YY', value: '8-Apr-19' },
        { format: 'D/MMM/YY', value: '8/Apr/19' },
        { format: 'D MMMM YYYY', value: '8 April 2019' },
        { format: 'D-MMMM-YYYY', value: '8-April-2019' },
        { format: 'D/MMMM/YYYY', value: '8/April/2019' },
        { format: 'DD MMMM YYYY', value: '08 April 2019' },
        { format: 'DD-MMMM-YYYY', value: '08-April-2019' },
        { format: 'DD/MMMM/YYYY', value: '08/April/2019' },
        { format: 'DD-MM-YYYY', value: '08-04-2019' },
        { format: 'DD/MM/YYYY', value: '08/04/2019' }
      ];

      dates.forEach(date => {
        test(date.format, async () => {
          const records = getValidSingleLicenceReturn();
          records.splice(6, 0, [date.value, '5']);

          const csv = csvStringify(records);
          const { isValid } = await csvSchemaValidation.validate(csv);

          expect(isValid).to.be.true();
        });
      });
    });

    test('returns error if Unique return reference field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        validNilReturnRecord,
        validUseAMeterRecord,
        validMeterMakeRecord,
        validMeterSerialNumberRecord,
        ...validDailyRecords,
        ...validWeeklyRecords,
        ...validMonthlyRecords,
        ['Not the Unique return reference record', '123', '123']
      ];
      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Unique return reference field not in expected position';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 16
      });
    });
  });

  experiment('licence return values', () => {
    test('the licence number must be present', async () => {
      const records = getValidSingleLicenceReturn();

      // update the licence number to empty
      records[0][1] = '';

      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Licence number is missing';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 1
      });
    });
  });

  experiment('return reference values', () => {
    test('must be present', async () => {
      const records = getValidSingleLicenceReturn();

      // update the return reference to empty
      records[1][1] = '';

      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'All return references should be integers';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 2
      });
    });

    test('must be integers', async () => {
      const records = getValidSingleLicenceReturn();

      // update the return reference to a non integer valie
      records[1][1] = 'not a number';

      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'All return references should be integers';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 2
      });
    });
  });

  experiment('Nil return', () => {
    test('can be Y', async () => {
      const records = getValidSingleLicenceReturn();
      records[2][1] = 'Y';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('can be y', async () => {
      const records = getValidSingleLicenceReturn();
      records[2][1] = 'y';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('can be N', async () => {
      const records = getValidSingleLicenceReturn();
      records[2][1] = 'N';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('can be n', async () => {
      const records = getValidSingleLicenceReturn();
      records[2][1] = 'n';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('can be empty', async () => {
      const records = getValidSingleLicenceReturn();
      records[2][1] = '';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('cannot be anything else', async () => {
      const records = getValidSingleLicenceReturn();
      records[2][1] = 'Not valid';

      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Nil return should be Y, N or empty';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 3
      });
    });
  });

  experiment('Meter used', () => {
    test('can be Y', async () => {
      const records = getValidSingleLicenceReturn();
      records[3][1] = 'Y';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('can be y', async () => {
      const records = getValidSingleLicenceReturn();
      records[3][1] = 'y';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('can be N', async () => {
      const records = getValidSingleLicenceReturn();
      records[3][1] = 'N';
      records[4][1] = '';
      records[5][1] = '';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('can be n', async () => {
      const records = getValidSingleLicenceReturn();
      records[3][1] = 'n';
      records[4][1] = '';
      records[5][1] = '';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('can be empty', async () => {
      const records = getValidSingleLicenceReturn();

      records[3][1] = '';
      records[4][1] = '';
      records[5][1] = '';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('cannot be anything else', async () => {
      const records = getValidSingleLicenceReturn();
      records[3][1] = 'Not valid';

      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Did you use a meter should be Y, N or empty';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 4
      });
    });
  });

  experiment('abstraction volumes', () => {
    test('can be empty', async () => {
      const records = getValidSingleLicenceReturn();
      records[6][1] = '';
      records[7][1] = '';
      records[8][1] = '';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('can be "Do not edit"', async () => {
      const records = getValidSingleLicenceReturn();
      records[6][1] = 'Do not edit';
      records[7][1] = 'Do not edit';
      records[8][1] = 'Do not edit';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('can be numbers including commas', async () => {
      const records = getValidSingleLicenceReturn();
      records[6][1] = '1';
      records[7][1] = '1.0';
      records[8][1] = '1,234,567.89';

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('cannot be other values', async () => {
      const records = getValidSingleLicenceReturn();
      records[6][1] = 'not valid';
      records[7][1] = '';
      records[8][1] = '';

      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Abstraction volumes must be numbers';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 7
      });
    });
  });

  experiment('return id', () => {
    test('must contain the licence number', async () => {
      const records = getValidSingleLicenceReturn();
      // update the return id on the last row to not include
      // the licence number that is included in the first line.
      records[9][1] = 'v1:1:--INVALID--:123456:2018-04-01:2019-03-31';

      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Return id in unexpected format';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 10
      });
    });

    test('must contain the return reference', async () => {
      const records = getValidSingleLicenceReturn();
      // update the return id on the last row to not include
      // the return reference that is included in the second line.
      records[9][1] = 'v1:1:123:--INVALID--:2018-04-01:2019-03-31';

      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Return id in unexpected format';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 10
      });
    });

    test('must match the return id pattern', async () => {
      const records = getValidSingleLicenceReturn();
      // update the return id on the last row to not include
      // unexpected date formats
      records[9][1] = 'v1:1:123:123456:not-a-date:2019-03-31';

      const csv = csvStringify(records);
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.false();

      const errorMessage = 'Return id in unexpected format';
      const error = validationErrors.find(err => err.message === errorMessage);
      expect(error).to.equal({
        message: errorMessage,
        line: 10
      });
    });
  });

  experiment('handles empty data', () => {
    test('empty lines are ignored', async () => {
      const records = getValidSingleLicenceReturn();
      records.splice(1, 0, ['', '']);
      records.splice(5, 0, ['', '']);
      records.splice(5, 0, ['', '']);

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });

    test('data is trimmed for inspection', async () => {
      const records = getValidSingleLicenceReturn();
      records[0] = ['  Licence number', '123   '];
      records[6] = ['9 April 2018', '   10     '];

      const csv = csvStringify(records);
      const { isValid } = await csvSchemaValidation.validate(csv);

      expect(isValid).to.be.true();
    });
  });
});
