const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { createReturn, createPurposeData } = require('./test-return-data');
const { getChargeElement } = require('./test-charge-data');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);

const {
  ERROR_UNDER_QUERY,
  ERROR_NO_RETURNS_SUBMITTED,
  dateFormat,
  returnsError,
  getAbsPeriod,
  returnPurposeMatchesElementPurpose
} = require('../../../../src/modules/charging/lib/two-part-tariff-helpers');

experiment('modules/charging/lib/two-part-tariff-helpers', async () => {
  experiment('.returnsError', async () => {
    test('returns the error if it does not require a null return', async () => {
      const { error, data } = returnsError(ERROR_UNDER_QUERY);

      expect(error).to.equal(ERROR_UNDER_QUERY);
      expect(data).to.be.null();
    });

    test('returns the error and a null return if one is required', async () => {
      const chargeElement1 = getChargeElement({ chargeElementId: 'charge-element-1' });
      const chargeElement2 = getChargeElement({ chargeElementId: 'charge-element-2' });
      const { error, data } = returnsError(ERROR_NO_RETURNS_SUBMITTED,
        [chargeElement1, chargeElement2]);

      expect(error).to.equal(ERROR_NO_RETURNS_SUBMITTED);
      expect(data).to.be.an.array().and.to.have.length(2);
      expect(data[0].chargeElementId).to.equal(chargeElement1.chargeElementId);
      expect(data[0].actualReturnQuantity).to.be.null();
      expect(data[1].chargeElementId).to.equal(chargeElement2.chargeElementId);
      expect(data[1].actualReturnQuantity).to.be.null();
    });
  });

  experiment('.getAbsPeriod', async () => {
    experiment('when abs dates cover the full financial year', async () => {
      const absDates = {
        periodStartDay: 1,
        periodStartMonth: 4,
        periodEndDay: 31,
        periodEndMonth: 3
      };
      // Apr           Abs Period            Mar
      //  |-----------------------------------|
      //      |--------------------------|
      //    May-18                     Feb-19
      test('abs start is the same year as start date when start & end dates are within the abs period', async () => {
        const startDate = moment('2018-05-01');
        const endDate = moment('2019-02-28');
        const absPeriod = getAbsPeriod(startDate, endDate, absDates);
        expect(absPeriod.start.format(dateFormat)).to.equal('2018-04-01');
        expect(absPeriod.end.format(dateFormat)).to.equal('2019-03-31');
      });
      //        Apr           Abs Period            Mar
      //         |-----------------------------------|
      //     |------------------------|
      //   Mar-19                  Sep-19
      test('abs start is the same year as start date when start date is at the end of abs period', async () => {
        const startDate = moment('2019-03-01');
        const endDate = moment('2019-09-30');
        const absPeriod = getAbsPeriod(startDate, endDate, absDates);
        expect(absPeriod.start.format(dateFormat)).to.equal('2019-04-01');
        expect(absPeriod.end.format(dateFormat)).to.equal('2020-03-31');
      });
      // Apr           Abs Period            Mar
      //  |-----------------------------------|
      //                            |---------|
      //                         Jan-19     Mar-19
      test('abs start is year before start date when start & end dates are within last quarter of financial year', async () => {
        const startDate = moment('2019-01-01');
        const endDate = moment('2019-03-31');
        const absPeriod = getAbsPeriod(startDate, endDate, absDates);
        expect(absPeriod.start.format(dateFormat)).to.equal('2018-04-01');
        expect(absPeriod.end.format(dateFormat)).to.equal('2019-03-31');
      });
    });
    experiment('when abs dates are within the same calendar year', async () => {
      const absDates = {
        periodStartDay: 1,
        periodStartMonth: 4,
        periodEndDay: 31,
        periodEndMonth: 10
      };
      // Apr      Abs Period     Oct
      //  |-----------------------|
      //  |-----------------------|
      // Apr-18                 Oct-18
      test('abs start is the same year as start date when start & end dates are within the abs period', async () => {
        const startDate = moment('2018-04-01');
        const endDate = moment('2018-10-31');
        const absPeriod = getAbsPeriod(startDate, endDate, absDates);
        expect(absPeriod.start.format(dateFormat)).to.equal('2018-04-01');
        expect(absPeriod.end.format(dateFormat)).to.equal('2018-10-31');
      });
      // Apr      Abs Period     Oct
      //  |-----------------------|
      //                     |-----------------------|
      //                  Oct-18                   Mar-19
      test('abs start is the same year as start date when start date is at the end of abs period', async () => {
        const startDate = moment('2018-10-01');
        const endDate = moment('2019-03-31');
        const absPeriod = getAbsPeriod(startDate, endDate, absDates);
        expect(absPeriod.start.format(dateFormat)).to.equal('2018-04-01');
        expect(absPeriod.end.format(dateFormat)).to.equal('2018-10-31');
      });
      //          Apr      Abs Period     Oct
      //           |-----------------------|
      //  |-----------------------|
      // Feb-18                  Aug-18
      test('abs start is the same year as start date when start date is before the abs period', async () => {
        const startDate = moment('2018-02-01');
        const endDate = moment('2019-08-31');
        const absPeriod = getAbsPeriod(startDate, endDate, absDates);
        expect(absPeriod.start.format(dateFormat)).to.equal('2018-04-01');
        expect(absPeriod.end.format(dateFormat)).to.equal('2018-10-31');
      });
      // Apr      Abs Period     Oct
      //  |-----------------------|
      //                           |-----------------------|
      //                         Nov-18                   Jul-19
      test('abs start is the same year as end date when start date is after the end of abs period', async () => {
        const startDate = moment('2018-11-01');
        const endDate = moment('2019-07-31');
        const absPeriod = getAbsPeriod(startDate, endDate, absDates);
        expect(absPeriod.start.format(dateFormat)).to.equal('2019-04-01');
        expect(absPeriod.end.format(dateFormat)).to.equal('2019-10-31');
      });
    });
    experiment('when abs dates straddle the calendar year', async () => {
      const absDates = {
        periodStartDay: 1,
        periodStartMonth: 11,
        periodEndDay: 31,
        periodEndMonth: 3
      };
      // Nov      Abs Period     Mar
      //  |-----------------------|
      //    |---------------------|
      //  Dec-18                 Mar-19
      test('abs start is the same year as start date when start & end dates are within the abs period', async () => {
        const startDate = moment('2018-12-01');
        const endDate = moment('2019-03-31');
        const absPeriod = getAbsPeriod(startDate, endDate, absDates);
        expect(absPeriod.start.format(dateFormat)).to.equal('2018-11-01');
        expect(absPeriod.end.format(dateFormat)).to.equal('2019-03-31');
      });
      // Nov      Abs Period     Mar
      //  |-----------------------|
      //                |---------|
      //              Jan-19    Mar-19
      test('abs start is the same year as end date when start/end dates are within the following calendar year & withing the abs period', async () => {
        const startDate = moment('2019-01-01');
        const endDate = moment('2019-03-31');
        const absPeriod = getAbsPeriod(startDate, endDate, absDates);
        expect(absPeriod.start.format(dateFormat)).to.equal('2018-11-01');
        expect(absPeriod.end.format(dateFormat)).to.equal('2019-03-31');
      });
      // Nov      Abs Period     Mar
      //  |-----------------------|
      //                |-----------------|
      //              Jan-19            May-19
      test('abs start is the year before start date when start date is at the end of the abs period', async () => {
        const startDate = moment('2019-01-01');
        const endDate = moment('2019-05-31');
        const absPeriod = getAbsPeriod(startDate, endDate, absDates);
        expect(absPeriod.start.format(dateFormat)).to.equal('2018-11-01');
        expect(absPeriod.end.format(dateFormat)).to.equal('2019-03-31');
      });
      //      Nov      Abs Period     Mar
      //       |-----------------------|
      //   |-----------------|
      // Oct-18            Jan-19
      test('abs start is the same year as start date when start date is before the abs period', async () => {
        const startDate = moment('2018-10-01');
        const endDate = moment('2019-01-31');
        const absPeriod = getAbsPeriod(startDate, endDate, absDates);
        expect(absPeriod.start.format(dateFormat)).to.equal('2018-11-01');
        expect(absPeriod.end.format(dateFormat)).to.equal('2019-03-31');
      });
    });
  });
  experiment('.returnPurposeMatchesElementPurpose', async () => {
    const chargeElement = getChargeElement({
      purposeTertiary: 400
    });
    const purpose120 = createPurposeData('120');
    test('return true if at least one of the return purposes is a TPT', async () => {
      const purpose400 = createPurposeData('400');
      const ret = createReturn({ purposes: purpose400.concat(purpose120) });
      expect(returnPurposeMatchesElementPurpose(ret, chargeElement)).to.be.true();
    });
    test('return false if none of the purposes are TPT', async () => {
      const purpose600 = createPurposeData('600');
      const ret = createReturn({ purposes: purpose600.concat(purpose120) });
      expect(returnPurposeMatchesElementPurpose(ret, chargeElement)).to.be.false();
    });
  });
});
