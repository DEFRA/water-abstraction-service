const { expect } = require('@hapi/code')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()

const agreements = require('../../../../../../src/modules/billing/services/charge-processor-service/lib/agreements')

const Agreement = require('../../../../../../src/lib/models/agreement')
const DateRange = require('../../../../../../src/lib/models/date-range')
const LicenceAgreement = require('../../../../../../src/lib/models/licence-agreement')

experiment('modules/billing/services/charge-processor-service/lib/agreements', () => {
  const chargePeriod = new DateRange('2020-04-01', '2021-03-31')

  experiment('.getAgreementsHistory', () => {
    const twoPartTariffAgreement = new Agreement().fromHash({
      code: 'S127'
    })
    const canalAndRiversTrustAgreement = new Agreement().fromHash({
      code: 'S130T'
    })

    experiment('when the agreement is in place for the full financial year', () => {
      const licenceAgreements = [
        new LicenceAgreement().fromHash({
          dateRange: new DateRange('1996-10-30', '2005-09-15'),
          agreement: twoPartTariffAgreement,
          dateDeleted: null
        }),
        new LicenceAgreement().fromHash({
          dateRange: new DateRange('2004-10-01', null),
          agreement: twoPartTariffAgreement,
          dateDeleted: null
        })
      ]

      test('creates a single history item', async () => {
        const history = agreements.getAgreementsHistory(chargePeriod, licenceAgreements)

        expect(history).to.be.an.array().length(1)
        expect(history[0].dateRange.startDate).to.equal(chargePeriod.startDate)
        expect(history[0].dateRange.endDate).to.equal(chargePeriod.endDate)

        // Check agreements
        expect(history[0].agreements).to.be.an.array().length(1)
        expect(history[0].agreements[0].code).to.equal('S127')
      })
    })

    experiment('when the agreement is in place for the full financial year and the agreements are not in chronological order', () => {
      const licenceAgreements = [
        new LicenceAgreement().fromHash({
          dateRange: new DateRange('2004-10-01', null),
          agreement: twoPartTariffAgreement,
          dateDeleted: null
        }),
        new LicenceAgreement().fromHash({
          dateRange: new DateRange('1996-10-30', '2005-09-15'),
          agreement: twoPartTariffAgreement,
          dateDeleted: null
        })
      ]

      test('creates a single history item', async () => {
        const history = agreements.getAgreementsHistory(chargePeriod, licenceAgreements)

        expect(history).to.be.an.array().length(1)
        expect(history[0].dateRange.startDate).to.equal(chargePeriod.startDate)
        expect(history[0].dateRange.endDate).to.equal(chargePeriod.endDate)

        // Check agreements
        expect(history[0].agreements).to.be.an.array().length(1)
        expect(history[0].agreements[0].code).to.equal('S127')
      })
    })

    experiment('when the agreement ends part-way through the full financial year', () => {
      let history

      const licenceAgreements = [
        new LicenceAgreement().fromHash({
          dateRange: new DateRange('1996-10-30', '2005-09-15'),
          agreement: twoPartTariffAgreement,
          dateDeleted: null
        }),
        new LicenceAgreement().fromHash({
          dateRange: new DateRange('2004-10-01', '2021-01-01'),
          agreement: twoPartTariffAgreement,
          dateDeleted: null
        })
      ]

      beforeEach(async () => {
        history = agreements.getAgreementsHistory(chargePeriod, licenceAgreements)
      })

      test('creates 2 history items', async () => {
        expect(history).to.be.an.array().length(2)
      })

      test('creates a first history item with TPT agreement', async () => {
        // Period
        expect(history[0].dateRange.startDate).to.equal(chargePeriod.startDate)
        expect(history[0].dateRange.endDate).to.equal('2021-01-01')

        // Check agreements
        expect(history[0].agreements).to.be.an.array().length(1)
        expect(history[0].agreements[0].code).to.equal('S127')
      })

      test('creates a second history item without TPT agreement', async () => {
        // Period
        expect(history[1].dateRange.startDate).to.equal('2021-01-02')
        expect(history[1].dateRange.endDate).to.equal(chargePeriod.endDate)

        // Check agreements
        expect(history[1].agreements).to.be.an.array().length(0)
      })
    })

    experiment('when the agreement starts and ends part-way through the full financial year', () => {
      let history

      const licenceAgreements = [

        new LicenceAgreement().fromHash({
          dateRange: new DateRange('2020-12-01', '2021-01-01'),
          agreement: twoPartTariffAgreement,
          dateDeleted: null
        })
      ]

      beforeEach(async () => {
        history = agreements.getAgreementsHistory(chargePeriod, licenceAgreements)
      })

      test('creates 3 history items', async () => {
        expect(history).to.be.an.array().length(3)
      })

      test('creates a first history item without TPT agreement', async () => {
        // Period
        expect(history[0].dateRange.startDate).to.equal(chargePeriod.startDate)
        expect(history[0].dateRange.endDate).to.equal('2020-11-30')

        // Check agreements
        expect(history[0].agreements).to.be.an.array().length(0)
      })

      test('creates a second history item with TPT agreement', async () => {
        // Period
        expect(history[1].dateRange.startDate).to.equal('2020-12-01')
        expect(history[1].dateRange.endDate).to.equal('2021-01-01')

        // Check agreements
        expect(history[1].agreements).to.be.an.array().length(1)
        expect(history[1].agreements[0].code).to.equal('S127')
      })

      test('creates a third history item without TPT agreement', async () => {
        // Period
        expect(history[2].dateRange.startDate).to.equal('2021-01-02')
        expect(history[2].dateRange.endDate).to.equal(chargePeriod.endDate)

        // Check agreements
        expect(history[2].agreements).to.be.an.array().length(0)
      })
    })

    experiment('when multiple agreements end part-way through the full financial year', () => {
      let history

      const licenceAgreements = [
        new LicenceAgreement().fromHash({
          dateRange: new DateRange('1996-10-30', '2005-09-15'),
          agreement: twoPartTariffAgreement
        }),
        new LicenceAgreement().fromHash({
          dateRange: new DateRange('2004-10-01', '2021-01-01'),
          agreement: twoPartTariffAgreement,
          dateDeleted: null
        }),
        new LicenceAgreement().fromHash({
          dateRange: new DateRange('2004-10-01', '2021-01-01'),
          agreement: canalAndRiversTrustAgreement,
          dateDeleted: null
        })
      ]

      beforeEach(async () => {
        history = agreements.getAgreementsHistory(chargePeriod, licenceAgreements)
      })

      test('creates 2 history items', async () => {
        expect(history).to.be.an.array().length(2)
      })

      test('creates a first history item with TPT and CRT agreement', async () => {
        // Period
        expect(history[0].dateRange.startDate).to.equal(chargePeriod.startDate)
        expect(history[0].dateRange.endDate).to.equal('2021-01-01')

        // Check agreements
        expect(history[0].agreements).to.be.an.array().length(2)
        expect(history[0].agreements[0].code).to.equal('S127')
        expect(history[0].agreements[1].code).to.equal('S130T')
      })

      test('creates a second history item without TPT agreement', async () => {
        // Period
        expect(history[1].dateRange.startDate).to.equal('2021-01-02')
        expect(history[1].dateRange.endDate).to.equal(chargePeriod.endDate)

        // Check agreements
        expect(history[1].agreements).to.be.an.array().length(0)
      })
    })
  })
})
