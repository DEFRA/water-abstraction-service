'use strict'

const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()
const viewHelpers = require('../../../../src/lib/services/pdf-generation/view-helpers')

experiment('paginateReturnLines (weekly)', () => {
  test('the first week uses the week ending date (saturday)', async () => {
    const personalisation = {
      start_date: '2018-01-03',
      end_date: '2018-02-18',
      returns_frequency: 'week'
    }
    const pages = viewHelpers.paginateReturnLines(personalisation)
    expect(pages[0].columns[0].items[0].label).to.equal('6 January 2018')
  })

  test('the last week uses the week ending date (saturday)', async () => {
    const personalisation = {
      start_date: '2018-01-03',
      end_date: '2018-02-18',
      returns_frequency: 'week'
    }
    const pages = viewHelpers.paginateReturnLines(personalisation)
    expect(pages[0].columns[0].items[6].label).to.equal('17 February 2018')
  })

  // 14 rows per column
  test('when 15 weeks, the 15th week is in the right column', async () => {
    const personalisation = {
      start_date: '2018-01-03',
      end_date: '2018-04-11',
      returns_frequency: 'week'
    }
    const pages = viewHelpers.paginateReturnLines(personalisation)
    expect(pages[0].columns[1].items[0].label).to.equal('14 April 2018')
  })

  test('when more than two columns, there are two pages', async () => {
    const personalisation = {
      start_date: '2018-01-03',
      end_date: '2018-07-21',
      returns_frequency: 'week'
    }
    const pages = viewHelpers.paginateReturnLines(personalisation)
    expect(pages[1].columns[0].items[0].label).to.equal('21 July 2018')
  })
})

experiment('paginateReturnLines (daily)', () => {
  test('the start date is the first column', async () => {
    const personalisation = {
      start_date: '2018-01-03',
      end_date: '2018-06-18',
      returns_frequency: 'day'
    }
    const pages = viewHelpers.paginateReturnLines(personalisation)
    expect(pages[0].columns[0].items[0].label).to.equal('January 2018')
  })

  test('the start date has a days property', async () => {
    const personalisation = {
      start_date: '2018-01-03',
      end_date: '2018-06-18',
      returns_frequency: 'day'
    }
    const pages = viewHelpers.paginateReturnLines(personalisation)
    expect(pages[0].columns[0].items[0].days).to.equal(31)
  })

  // 3 months per page. Six months in this example range
  test('the end date is in the last column on the second page', async () => {
    const personalisation = {
      start_date: '2018-01-03',
      end_date: '2018-06-18',
      returns_frequency: 'day'
    }
    const pages = viewHelpers.paginateReturnLines(personalisation)
    expect(pages[1].columns[2].items[0].label).to.equal('June 2018')
  })
})

experiment('paginateReturnLines (monthly)', () => {
  test('the first date uses the full month as the label', async () => {
    const personalisation = {
      start_date: '2018-01-03',
      end_date: '2018-12-18',
      returns_frequency: 'month'
    }
    const pages = viewHelpers.paginateReturnLines(personalisation)
    expect(pages[0].columns[0].items[0].label).to.equal('31 January 2018')
  })

  test('the last date uses the full month as the label', async () => {
    const personalisation = {
      start_date: '2018-01-03',
      end_date: '2018-12-18',
      returns_frequency: 'month'
    }
    const pages = viewHelpers.paginateReturnLines(personalisation)
    expect(pages[0].columns[0].items[11].label).to.equal('31 December 2018')
  })

  test('if more than 12 months, a new column is started', async () => {
    const personalisation = {
      start_date: '2018-01-03',
      end_date: '2019-01-18',
      returns_frequency: 'month'
    }
    const pages = viewHelpers.paginateReturnLines(personalisation)
    expect(pages[0].columns[1].items[0].label).to.equal('31 January 2019')
  })

  test('if more than 24 months, a new page is started', async () => {
    const personalisation = {
      start_date: '2018-01-03',
      end_date: '2020-01-18',
      returns_frequency: 'month'
    }
    const pages = viewHelpers.paginateReturnLines(personalisation)
    expect(pages[1].columns[0].items[0].label).to.equal('31 January 2020')
  })
})

experiment('naldArea', () => {
  const tests = [
    { input: 'ARCA', expectation: 'Central' },
    { input: 'AREA', expectation: 'Eastern' },
    { input: 'ARNA', expectation: 'Northern' },
    { input: 'DALES', expectation: 'Dales' },
    { input: 'NAREA', expectation: 'Northumbria' },
    { input: 'RIDIN', expectation: 'Ridings' },
    { input: 'NWCEN', expectation: 'Central' },
    { input: 'NWNTH', expectation: 'North' },
    { input: 'NWSTH', expectation: 'South' },
    { input: 'AGY2N', expectation: 'West' },
    { input: 'AGY2S', expectation: 'West' },
    { input: 'AGY3N', expectation: 'North East' },
    { input: 'AGY3S', expectation: 'North East' },
    { input: 'AGY4N', expectation: 'South East' },
    { input: 'AGY4S', expectation: 'South East' },
    { input: 'MIDLS', expectation: 'Lower Severn' },
    { input: 'MIDLT', expectation: 'Lower Trent' },
    { input: 'MIDUS', expectation: 'Upper Severn' },
    { input: 'MIDUT', expectation: 'Upper Trent' },
    { input: 'HAAR', expectation: 'Hampshire & Isle of Wight' },
    { input: 'KAEA', expectation: 'Kent' },
    { input: 'SAAR', expectation: 'Sussex' },
    { input: 'AACOR', expectation: 'Cornwall' },
    { input: 'AADEV', expectation: 'Devon' },
    { input: 'AANWX', expectation: 'North Wessex' },
    { input: 'AASWX', expectation: 'South Wessex' },
    { input: 'N', expectation: 'Northern' },
    { input: 'SE', expectation: 'South East' }
  ]

  for (const t of tests) {
    test(`returns ${t.expectation} for ${t.input}`, async () => {
      expect(viewHelpers.naldArea(t.input)).to.equal(t.expectation)
    })
  }
})

experiment('naldRegion', () => {
  const tests = [
    { input: 1, expectation: 'Anglian' },
    { input: 2, expectation: 'Midlands' },
    { input: 3, expectation: 'North east' },
    { input: 4, expectation: 'North west' },
    { input: 5, expectation: 'South west' },
    { input: 6, expectation: 'Southern' },
    { input: 7, expectation: 'Thames' }
  ]

  for (const t of tests) {
    test(`returns ${t.expectation} for ${t.input}`, async () => {
      expect(viewHelpers.naldRegion(t.input)).to.equal(t.expectation)
    })
  }
})
