const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()
const dateParser = require('../../../../../src/modules/returns/lib/csv-adapter/date-parser')
const moment = require('moment')

const dayDateFormats = [
  '7 Aug 2019',
  '07 Aug 2019',
  '7-Aug-2019',
  '07-Aug-2019',
  '7/Aug/2019',
  '07/Aug/2019',

  '07 Aug 19',
  '07-Aug-19',
  '07/Aug/19',
  '7 Aug 19',
  '7-Aug-19',
  '7/Aug/19',

  '7 August 2019',
  '07 August 2019',
  '7-August-2019',
  '07-August-2019',
  '7/August/2019',
  '07/August/2019',
  '07-08-2019',
  '07/08/2019'
]

const weekDateFormats = [
  '3 Aug 2019',
  '03 Aug 2019',
  '3-Aug-2019',
  '03-Aug-2019',
  '3/Aug/2019',
  '03/Aug/2019',

  '03 Aug 19',
  '03-Aug-19',
  '03/Aug/19',
  '3 Aug 19',
  '3-Aug-19',
  '3/Aug/19',

  '3 August 2019',
  '03 August 2019',
  '3-August-2019',
  '03-August-2019',
  '3/August/2019',
  '03/August/2019',
  '03-08-2019',
  '03/08/2019'
]

const monthDateFormats = [
  'Aug 2019',
  'August 2019',
  'Aug 19',
  'August 19',
  'Aug-2019',
  'August-2019',
  'Aug-19',
  'August-19'
]

experiment('modules/returns/lib/csv-adapter/date-parser', () => {
  experiment('.parse', () => {
    experiment('returns the correct type of return line', () => {
      test('week', () => {
        const returnLine = dateParser.parse('week ending 14 April 2018')
        expect(returnLine).to.equal({
          startDate: '2018-04-08',
          endDate: '2018-04-14',
          timePeriod: 'week'
        })
      })
      test('day', () => {
        const returnLine = dateParser.parse('14 April 2018')
        expect(returnLine).to.equal({
          startDate: '2018-04-14',
          endDate: '2018-04-14',
          timePeriod: 'day'
        })
      })
      test('month', () => {
        const returnLine = dateParser.parse('Apr-18')
        expect(returnLine).to.equal({
          startDate: '2018-04-01',
          endDate: '2018-04-30',
          timePeriod: 'month'
        })
      })
    })
    test('returns null if date is invalid', () => {
      const result = dateParser.parse('1 April 2')
      expect(result).to.be.null()
    })
  })

  experiment('.validate', () => {
    test('returns true the parse method returns a return line', () => {
      const validation = dateParser.validate('Apr-18')
      expect(validation).to.be.true()
    })

    test('returns false the parse method returns null', () => {
      const validation = dateParser.validate('Apr-1')
      expect(validation).to.be.false()
    })
  })

  experiment('.getDateFrequency', () => {
    test('returns "week" if date startsWith "week ending"', () => {
      const { timePeriod, moment: m } = dateParser._getDateFrequency('week ending 14 April 2018')

      expect(timePeriod).to.equal('week')
      expect(m.format('YYYY-MM-DD')).to.equal('2018-04-14')
    })

    dayDateFormats.forEach(date => {
      test(`returns "day" for day format: ${date}`, () => {
        const { timePeriod, moment: m } = dateParser._getDateFrequency(date)
        expect(timePeriod).to.equal('day')
        expect(m.format('YYYY-MM-DD')).to.equal('2019-08-07')
      })
    })

    weekDateFormats.forEach(date => {
      test(`returns "week" for day format: ${date}`, () => {
        const { timePeriod, moment: m } = dateParser._getDateFrequency(`week ending ${date}`)
        expect(timePeriod).to.equal('week')
        expect(m.format('YYYY-MM-DD')).to.equal('2019-08-03')
      })
    })

    monthDateFormats.forEach(date => {
      test(`returns "month" for month format: ${date}`, () => {
        const { timePeriod, moment: m } = dateParser._getDateFrequency(date)
        expect(timePeriod).to.equal('month')
        expect(m.format('YYYY-MM-DD')).to.equal('2019-08-01')
      })
    })

    test('returns undefined if date does not fit any format', () => {
      const frequency = dateParser._getDateFrequency('13 April 2')
      expect(frequency).to.be.undefined()
    })
  })

  experiment('.createDay', () => {
    test('creates a day return line skeleton from a moment', async () => {
      const result = dateParser._createDay(moment('2019-05-07'))
      expect(result).to.equal({
        startDate: '2019-05-07',
        endDate: '2019-05-07',
        timePeriod: 'day'
      })
    })
  })

  experiment('.createWeek', () => {
    test('creates a week return line skeleton from a moment', async () => {
      const result = dateParser._createWeek(moment('2019-05-11'))
      expect(result).to.equal({
        startDate: '2019-05-05',
        endDate: '2019-05-11',
        timePeriod: 'week'
      })
    })
  })

  experiment('.createMonth', () => {
    test('creates a month return line skeleton from a moment', async () => {
      const result = dateParser._createMonth(moment('2019-05-01'))
      expect(result).to.equal({
        startDate: '2019-05-01',
        endDate: '2019-05-31',
        timePeriod: 'month'
      })
    })
  })
})
