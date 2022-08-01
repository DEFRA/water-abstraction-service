'use strict'

const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { partial } = require('lodash')
const csvSchemaValidation = require('../../../../../src/modules/returns/lib/csv-adapter/validator')
const csvStringify = require('csv-stringify/lib/sync')

const validLicenceNumberRecord = ['Licence number', '123', '123abc']
const validReturnReferenceRecord = ['Return reference', '1234', '4321']
const validSiteDescriptionRecord = ['Site description', '', 'Main site']
const validPurposeRecord = ['Purpose', 'Irrigation', 'Spray']
const validNilReturnRecord = ['Nil return Y/N', 'Y', 'N']
const validUseAMeterRecord = ['Did you use a meter Y/N', 'Y', 'N']
const validMeterMakeRecord = ['Meter make', 'Make 1', '']
const validMeterSerialNumberRecord = ['Meter serial number', '123-123', '']
const validUniqueReturnReferenceRecord = ['Unique return reference', 'v1:1:123:1234:2018-01-01:2019-01-01', 'v1:1:123abc:4321:2018-01-01:2019-01-01']
const validDailyRecords = [
  ['9 April 2018', '10', 'Do not edit'],
  ['10 April 2018', '20', 'Do not edit'],
  ['11 April 2018', '30', 'Do not edit']
]
const validWeeklyRecords = [
  ['Week ending 9 April 2018', '10', 'Do not edit'],
  ['Week ending 10 April 2018', '20', 'Do not edit'],
  ['Week ending 11 April 2018', '30', 'Do not edit']
]
const validMonthlyRecords = [
  ['April 2018', '10', 'Do not edit'],
  ['April 2018', '20', 'Do not edit'],
  ['April 2018', '30', 'Do not edit']
]

const getValidSingleLicenceReturn = () => ([
  ['Licence number', '123'],
  ['Return reference', '123456'],
  ['Site description', 'Test site'],
  ['Purpose', 'Test purpose'],
  ['Nil return Y/N', 'N'],
  ['Did you use a meter Y/N', 'Y'],
  ['Meter make', 'Make 1'],
  ['Meter serial number', '123-123'],
  ['9 April 2018', '10'],
  ['10 April 2018', '20'],
  ['11 April 2018', '30'],
  ['Unique return reference', 'v1:1:123:123456:2018-04-01:2019-03-31']
])

const setRecords = (rowIndex, records, value) => (records[rowIndex][1] = value)

const setLicenceNumber = partial(setRecords, 0)
const setReturnReference = partial(setRecords, 1)
const setNilReturn = partial(setRecords, 4)
const setMeterUsed = partial(setRecords, 5)
const setMeterMake = partial(setRecords, 6)
const setMeterSerialNumber = partial(setRecords, 7)
const setFirstVolume = partial(setRecords, 8)
const setSecondVolume = partial(setRecords, 9)
const setThirdVolume = partial(setRecords, 10)
const setReturnId = partial(setRecords, 11)

experiment('csv-schema-validation', () => {
  test('handles inconsistent record lengths', async () => {
    const records = [
      ['Licence number', '123', '123abc', '123/abc'],
      ['Return reference', '123', '1234']
    ]

    const csv = csvStringify(records)
    const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

    expect(isValid).to.be.false()

    const errorMessage = 'Number of columns is inconsistent on line 2'
    const error = validationErrors.find(err => err.message === errorMessage)
    expect(error).to.equal({
      message: errorMessage,
      line: 2
    })
  })

  experiment('header validation', () => {
    test('returns error if Licence number field is incorrect', async () => {
      const records = [
        ['Not the licence number', '123', '123/abc']
      ]
      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Licence number field not in expected position'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 1
      })
    })

    test('returns error if Return reference field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        ['Not the return reference', '123', '456']
      ]
      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Return reference field not in expected position'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 2
      })
    })

    test('returns error if Site description field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        ['Not the site description', 'One', 'Two']
      ]
      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Site description field not in expected position'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 3
      })
    })

    test('returns error if Purpose field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        validSiteDescriptionRecord,
        ['Not the purpose field', 'One', 'Two']
      ]
      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Purpose field not in expected position'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 4
      })
    })

    test('returns error if Nil return field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        validSiteDescriptionRecord,
        validPurposeRecord,
        ['Not the nil return field', 'Y', 'N']
      ]
      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Nil return Y/N field not in expected position'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 5
      })
    })

    test('returns error if Did you use a meter field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        validSiteDescriptionRecord,
        validPurposeRecord,
        validNilReturnRecord,
        ['Not the Did you use a meter field', 'Y', 'N']
      ]
      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Did you use a meter Y/N field not in expected position'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 6
      })
    })

    test('returns error if Meter make field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        validSiteDescriptionRecord,
        validPurposeRecord,
        validNilReturnRecord,
        validUseAMeterRecord,
        ['Not the Meter make record', 'Make 1', '']
      ]
      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Meter make field not in expected position'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 7
      })
    })

    test('returns error if Meter serial number field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        validSiteDescriptionRecord,
        validPurposeRecord,
        validNilReturnRecord,
        validUseAMeterRecord,
        validMeterMakeRecord,
        ['Not the Meter serial number record', 'Ser 1', '']
      ]
      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Meter serial number field not in expected position'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 8
      })
    })

    test('returns error if unexpected date field', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        validSiteDescriptionRecord,
        validPurposeRecord,
        validNilReturnRecord,
        validUseAMeterRecord,
        validMeterMakeRecord,
        validMeterSerialNumberRecord,
        ...validDailyRecords,
        ...validWeeklyRecords,
        ...validMonthlyRecords,
        ['not a date', '111', 'Do not edit'],
        validUniqueReturnReferenceRecord
      ]
      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Unexpected date format for return line'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 18
      })
    })

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
      ]

      dates.forEach(date => {
        test(date.format, async () => {
          const records = getValidSingleLicenceReturn()
          records.splice(8, 0, [date.value, '5'])

          const csv = csvStringify(records)
          const { isValid } = await csvSchemaValidation.validate(csv)

          expect(isValid).to.be.true()
        })
      })
    })

    test('returns error if Unique return reference field is incorrect', async () => {
      const records = [
        validLicenceNumberRecord,
        validReturnReferenceRecord,
        validSiteDescriptionRecord,
        validPurposeRecord,
        validNilReturnRecord,
        validUseAMeterRecord,
        validMeterMakeRecord,
        validMeterSerialNumberRecord,
        ...validDailyRecords,
        ...validWeeklyRecords,
        ...validMonthlyRecords,
        ['Not the Unique return reference record', '123', '123']
      ]
      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Unique return reference field not in expected position'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 18
      })
    })
  })

  experiment('licence return values', () => {
    test('the licence number must be present', async () => {
      const records = getValidSingleLicenceReturn()

      // update the licence number to empty
      setLicenceNumber(records, '')

      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Licence number is missing'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 1
      })
    })
  })

  experiment('return reference values', () => {
    test('must be present', async () => {
      const records = getValidSingleLicenceReturn()

      // update the return reference to empty
      setReturnReference(records, '')

      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'All return references should be integers'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 2
      })
    })

    test('must be integers', async () => {
      const records = getValidSingleLicenceReturn()

      // update the return reference to a non integer value
      setReturnReference(records, 'not a number')

      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'All return references should be integers'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 2
      })
    })
  })

  experiment('Nil return', () => {
    test('can be Y', async () => {
      const records = getValidSingleLicenceReturn()
      setNilReturn(records, 'Y')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be y', async () => {
      const records = getValidSingleLicenceReturn()
      setNilReturn(records, 'y')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be yes', async () => {
      const records = getValidSingleLicenceReturn()
      setNilReturn(records, 'yes')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be YES', async () => {
      const records = getValidSingleLicenceReturn()
      setNilReturn(records, 'YES')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be N', async () => {
      const records = getValidSingleLicenceReturn()
      setNilReturn(records, 'N')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be n', async () => {
      const records = getValidSingleLicenceReturn()
      setNilReturn(records, 'n')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be no', async () => {
      const records = getValidSingleLicenceReturn()
      setNilReturn(records, 'no')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be NO', async () => {
      const records = getValidSingleLicenceReturn()
      setNilReturn(records, 'NO')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be empty', async () => {
      const records = getValidSingleLicenceReturn()
      setNilReturn(records, '')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('cannot be anything else', async () => {
      const records = getValidSingleLicenceReturn()
      setNilReturn(records, 'Not valid')

      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Nil return should be Y, N or empty'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 5
      })
    })
  })

  experiment('Meter used', () => {
    test('can be Y', async () => {
      const records = getValidSingleLicenceReturn()
      setMeterUsed(records, 'Y')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be y', async () => {
      const records = getValidSingleLicenceReturn()
      setMeterUsed(records, 'y')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be N', async () => {
      const records = getValidSingleLicenceReturn()
      setMeterUsed(records, 'N')
      setMeterMake(records, '')
      setMeterSerialNumber(records, '')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be n', async () => {
      const records = getValidSingleLicenceReturn()
      setMeterUsed(records, 'n')
      setMeterMake(records, '')
      setMeterSerialNumber(records, '')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be empty', async () => {
      const records = getValidSingleLicenceReturn()

      setMeterUsed(records, '')
      setMeterMake(records, '')
      setMeterSerialNumber(records, '')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('cannot be anything else', async () => {
      const records = getValidSingleLicenceReturn()
      setMeterUsed(records, 'Not valid')

      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Did you use a meter should be Y, N or empty'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 6
      })
    })
  })

  experiment('abstraction volumes', () => {
    test('can be empty', async () => {
      const records = getValidSingleLicenceReturn()
      setFirstVolume(records, '')
      setSecondVolume(records, '')
      setThirdVolume(records, '')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be "Do not edit"', async () => {
      const records = getValidSingleLicenceReturn()
      setFirstVolume(records, 'Do not edit')
      setSecondVolume(records, 'Do not edit')
      setThirdVolume(records, 'Do not edit')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('can be numbers including commas', async () => {
      const records = getValidSingleLicenceReturn()
      setFirstVolume(records, '1')
      setSecondVolume(records, '1.0')
      setThirdVolume(records, '1,234,567.89')

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('cannot be other values', async () => {
      const records = getValidSingleLicenceReturn()
      setFirstVolume(records, 'not valid')
      setSecondVolume(records, '')
      setThirdVolume(records, '')

      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Abstraction volumes must be numbers'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 9
      })
    })
  })

  experiment('return id', () => {
    test('must contain the licence number', async () => {
      const records = getValidSingleLicenceReturn()
      // update the return id on the last row to not include
      // the licence number that is included in the first line.
      setReturnId(records, 'v1:1:--INVALID--:123456:2018-04-01:2019-03-31')

      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Return id in unexpected format'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 12
      })
    })

    test('must contain the return reference', async () => {
      const records = getValidSingleLicenceReturn()
      // update the return id on the last row to not include
      // the return reference that is included in the second line.
      setReturnId(records, 'v1:1:123:--INVALID--:2018-04-01:2019-03-31')

      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Return id in unexpected format'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 12
      })
    })

    test('must match the return id pattern', async () => {
      const records = getValidSingleLicenceReturn()
      // update the return id on the last row to not include
      // unexpected date formats
      setReturnId(records, 'v1:1:123:123456:not-a-date:2019-03-31')

      const csv = csvStringify(records)
      const { isValid, validationErrors } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.false()

      const errorMessage = 'Return id in unexpected format'
      const error = validationErrors.find(err => err.message === errorMessage)
      expect(error).to.equal({
        message: errorMessage,
        line: 12
      })
    })
  })

  experiment('handles empty data', () => {
    test('empty lines are ignored', async () => {
      const records = getValidSingleLicenceReturn()
      records.splice(1, 0, ['', ''])
      records.splice(5, 0, ['', ''])
      records.splice(5, 0, ['', ''])

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })

    test('data is trimmed for inspection', async () => {
      const records = getValidSingleLicenceReturn()
      records[0] = ['  Licence number', '123   ']
      records[8] = ['9 April 2018', '   10     ']

      const csv = csvStringify(records)
      const { isValid } = await csvSchemaValidation.validate(csv)

      expect(isValid).to.be.true()
    })
  })
})
