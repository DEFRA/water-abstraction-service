const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const repository = require('../../../../../src/lib/connectors/repository');
const { processRoles, processCharges } = require('../../../../../src/modules/billing/service/charge-processor/');

const companyA = '76f90254-5916-4b48-92a3-aaaaaaaaaaaa';
const companyB = 'a2fe1f06-3ca4-487f-a79b-bbbbbbbbbbbb';

const invoiceAccountA = 'S11111111A';
const invoiceAccountB = 'S22222222A';

const createBillingRole = (companyId, invoiceAccountNumber, options = {}) => ({
  roleName: 'billing',
  startDate: '1993-02-12',
  endDate: null,
  company: {
    companyId
  },
  invoiceAccount: {
    invoiceAccountId: '0fde26a6-a2b3-46a3-8f99-344f3d74cc7e',
    invoiceAccountNumber
  },
  ...options
});

const createLicenceHolderRole = (companyId, options = {}) => ({
  roleName: 'licenceHolder',
  startDate: '1993-02-12',
  endDate: null,
  company: {
    companyId
  },
  contact: {
    contactId: 'a2fe1f06-3ca4-487f-a79b-5ad80ba4553d'
  },
  ...options
});

const chargeVersionId = 'd2f7fdfd-72f4-4e31-a917-9149175933f7';
const chargeElement1 = '72953425-1111-494a-869f-5b00fb4c0c6a';
const chargeElement2 = '320df419-2222-40a8-8420-b9351f49dead';
const chargeElement3 = '320df419-3333-40a8-8420-b9351f49dead';

const data = {
  chargeVersions: {
    nonExpiring: {
      chargeVersionId,
      startDate: '1993-02-12',
      endDate: null
    },
    expiring: {
      chargeVersionId,
      startDate: '1993-02-12',
      endDate: '2018-12-25'
    }
  },
  chargeElements: [{
    chargeElementId: chargeElement1,
    source: 'supported',
    season: 'summer',
    loss: 'high',
    abstractionPeriodStartDay: 1,
    abstractionPeriodStartMonth: 5,
    abstractionPeriodEndDay: 31,
    abstractionPeriodEndMonth: 1
  }, {
    source: 'supported',
    season: 'winter',
    loss: 'low',
    chargeElementId: chargeElement2,
    abstractionPeriodStartDay: 1,
    abstractionPeriodStartMonth: 1,
    abstractionPeriodEndDay: 31,
    abstractionPeriodEndMonth: 12
  }, {
    source: 'supported',
    season: 'winter',
    loss: 'low',
    chargeElementId: chargeElement3,
    timeLimitedStartDate: '1993-02-12',
    timeLimitedEndDate: '2018-11-20',
    abstractionPeriodStartDay: 1,
    abstractionPeriodStartMonth: 1,
    abstractionPeriodEndDay: 31,
    abstractionPeriodEndMonth: 12
  }],
  licenceAgreements: {
    section127: {
      licence_agreement_id: 'f5d78402-8dc4-490a-8326-b1be90e12729',
      financial_agreement_type_id: 'S127',
      start_date: '2018-08-01',
      end_date: null
    }
  }
};

const getDocsData = (endDate, documentRoles) => {
  return [{
    documentRef: '01/123',
    startDate: '1993-02-12',
    endDate,
    documentRoles
  }];
};

experiment('modules/billing/service/charge-processor/index.js', () => {
  let result;

  beforeEach(async () => {
    sandbox.stub(repository.chargeElements, 'findByChargeVersionId').resolves(data.chargeElements);
    sandbox.stub(repository.licenceAgreements, 'findByLicenceNumber').resolves([]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.processRoles', () => {
    experiment('2x licence holders for same company', () => {
      let result;
      beforeEach(async () => {
        const docsData = getDocsData(null, [
          createLicenceHolderRole(companyA, { startDate: '1993-02-12', endDate: '2016-05-31' }),
          createLicenceHolderRole(companyA, { startDate: '2016-06-01' })
        ]);
        result = await processRoles(2017, docsData);
      });

      test('merges role history for matching licence holders', () => {
        expect(result).to.have.length(1);
      });

      test('constrains dates to financial year', () => {
        const [{ startDate, endDate }] = result;
        expect(startDate).to.equal('2016-04-01');
        expect(endDate).to.equal('2017-03-31');
      });
    });
    experiment('2x licence holders for different companies', () => {
      let result;
      beforeEach(async () => {
        const docsData = getDocsData(null, [
          createLicenceHolderRole(companyA, { startDate: '1993-02-12', endDate: '2016-05-31' }),
          createLicenceHolderRole(companyB, { startDate: '2016-06-01' })
        ]);
        result = await processRoles(2017, docsData);
      });

      test('does not merges role history for non-matching licence holders', () => {
        expect(result).to.have.length(2);
      });

      experiment('first licence holder', () => {
        test('constrains dates to financial year', () => {
          const { startDate, endDate } = result[0];
          expect(startDate).to.equal('2016-04-01');
          expect(endDate).to.equal('2016-05-31');
        });
      });

      experiment('second licence holder', () => {
        test('constrains dates to financial year', () => {
          const { startDate, endDate } = result[1];
          expect(startDate).to.equal('2016-06-01');
          expect(endDate).to.equal('2017-03-31');
        });
      });
    });

    experiment('4x licence holders for 2 different companies', () => {
      let result;
      beforeEach(async () => {
        const docsData = getDocsData(null, [
          createLicenceHolderRole(companyA, { startDate: '1993-02-12', endDate: '2015-05-31' }),
          createLicenceHolderRole(companyA, { startDate: '2015-06-01', endDate: '2016-10-20' }),
          createLicenceHolderRole(companyB, { startDate: '2016-10-21', endDate: '2017-08-31' }),
          createLicenceHolderRole(companyB, {
            startDate: '2017-09-01',
            contact: { contactId: 'a247b588-d0e6-45d8-9d63-47f45cdd9639' }
          })
        ]);

        result = await processRoles(2016, docsData);
      });
      test('filters out licence holders not relevant to financial year', () => {
        expect(result).to.have.length(1);
      });
      test('constrains dates to financial year', () => {
        const [{ startDate, endDate }] = result;
        expect(startDate).to.equal('2015-04-01');
        expect(endDate).to.equal('2016-03-31');
      });
    });
  });

  experiment('.processCharges', () => {
    experiment('when there is 1x document, non-expiring charge version, ', () => {
      experiment('non-expiring licence, 1x licence holder and 1x billing role', () => {
        beforeEach(async () => {
          const docsData = getDocsData(null, [
            createLicenceHolderRole(companyA, { startDate: '1993-02-12', endDate: null }),
            createBillingRole(companyA, invoiceAccountA, { startDate: '1993-02-12', endDate: null })
          ]);

          result = await processCharges(2019, data.chargeVersions.nonExpiring, docsData);
        });

        test('there is no error', async () => {
          expect(result.error).to.equal(null);
        });

        test('there is a single charge date range', async () => {
          expect(result.data).to.have.length(1);
        });

        test('the charge date range covers the financial year ending 2019', async () => {
          expect(result.data[0].startDate).to.equal('2018-04-01');
          expect(result.data[0].endDate).to.equal('2019-03-31');
        });

        test('the first charge element has the correct ID', async () => {
          const { chargeElementId } = result.data[0].chargeElements[0];
          expect(chargeElementId).to.equal(chargeElement1);
        });

        test('the first charge element covers the correct charge period', async () => {
          const { startDate, endDate } = result.data[0].chargeElements[0];
          expect(startDate).to.equal('2018-04-01');
          expect(endDate).to.equal('2019-03-31');
        });

        test('the first charge element has the correct pro-rata billable days', async () => {
          const { totalDays, billableDays } = result.data[0].chargeElements[0];
          expect(totalDays).to.equal(276);
          expect(billableDays).to.equal(276);
        });

        test('the second charge element has the correct ID', async () => {
          const { chargeElementId } = result.data[0].chargeElements[1];
          expect(chargeElementId).to.equal(chargeElement2);
        });

        test('the second charge element covers the correct charge period', async () => {
          const { startDate, endDate } = result.data[0].chargeElements[1];
          expect(startDate).to.equal('2018-04-01');
          expect(endDate).to.equal('2019-03-31');
        });

        test('the second charge element is all year', async () => {
          const { totalDays, billableDays } = result.data[0].chargeElements[1];
          expect(totalDays).to.equal(365);
          expect(billableDays).to.equal(365);
        });

        test('the third charge element has the correct ID', async () => {
          const { chargeElementId } = result.data[0].chargeElements[2];
          expect(chargeElementId).to.equal(chargeElement3);
        });

        test('the third charge element period respects the time-limited end date', async () => {
          const { startDate, endDate } = result.data[0].chargeElements[2];
          expect(startDate).to.equal('2018-04-01');
          expect(endDate).to.equal('2018-11-20');
        });

        test('the third charge element is all year, and respects the time-limited end date 2018-11-20', async () => {
          const { totalDays, billableDays } = result.data[0].chargeElements[2];
          expect(totalDays).to.equal(365);
          expect(billableDays).to.equal(234);
        });
      });

      experiment('expiring licence, 1x licence holder and 1x billing role', () => {
        beforeEach(async () => {
          const docsData = getDocsData('2018-10-31', [
            createLicenceHolderRole(companyA, { startDate: '1993-02-12', endDate: null }),
            createBillingRole(companyA, invoiceAccountA, { startDate: '1993-02-12', endDate: null })
          ]);

          result = await processCharges(2019, data.chargeVersions.nonExpiring, docsData);
        });

        test('there is no error', async () => {
          expect(result.error).to.equal(null);
        });

        test('there is a single charge date range', async () => {
          expect(result.data).to.have.length(1);
        });

        test('the charge date range ends on the licence end date', async () => {
          expect(result.data[0].startDate).to.equal('2018-04-01');
          expect(result.data[0].endDate).to.equal('2018-10-31');
        });

        test('the first charge element has the correct ID', async () => {
          const { chargeElementId } = result.data[0].chargeElements[0];
          expect(chargeElementId).to.equal(chargeElement1);
        });

        test('the first charge element covers the correct charge period', async () => {
          const { startDate, endDate } = result.data[0].chargeElements[0];
          expect(startDate).to.equal('2018-04-01');
          expect(endDate).to.equal('2018-10-31');
        });

        test('the first charge element has the correct pro-rata billable days', async () => {
          const { totalDays, billableDays } = result.data[0].chargeElements[0];
          expect(totalDays).to.equal(276);
          expect(billableDays).to.equal(184);
        });

        test('the second charge element has the correct ID', async () => {
          const { chargeElementId } = result.data[0].chargeElements[1];
          expect(chargeElementId).to.equal(chargeElement2);
        });

        test('the second charge element covers the correct charge period', async () => {
          const { startDate, endDate } = result.data[0].chargeElements[1];
          expect(startDate).to.equal('2018-04-01');
          expect(endDate).to.equal('2018-10-31');
        });

        test('the second charge element is all year', async () => {
          const { totalDays, billableDays } = result.data[0].chargeElements[1];
          expect(totalDays).to.equal(365);
          expect(billableDays).to.equal(214);
        });

        test('the third charge element has the correct ID', async () => {
          const { chargeElementId } = result.data[0].chargeElements[2];
          expect(chargeElementId).to.equal(chargeElement3);
        });

        test('the third charge element period covers the correct charge period', async () => {
          const { startDate, endDate } = result.data[0].chargeElements[2];
          expect(startDate).to.equal('2018-04-01');
          expect(endDate).to.equal('2018-10-31');
        });

        test('the third charge element is all year, and the licence ends before the time-limited end date', async () => {
          const { totalDays, billableDays } = result.data[0].chargeElements[2];
          expect(totalDays).to.equal(365);
          expect(billableDays).to.equal(214);
        });
      });

      experiment('expiring licence, 1x licence holder and 2x billing roles', () => {
        beforeEach(async () => {
          const docsData = getDocsData('2018-10-31', [
            createLicenceHolderRole(companyA, { startDate: '1993-02-12', endDate: null }),
            createBillingRole(companyA, invoiceAccountA, { startDate: '1993-02-12', endDate: '2018-06-01' }),
            createBillingRole(companyB, invoiceAccountB, { startDate: '2018-06-02', endDate: null })
          ]);

          result = await processCharges(2019, data.chargeVersions.nonExpiring, docsData);
        });

        test('there is no error', async () => {
          expect(result.error).to.equal(null);
        });

        test('there is a charge date range for each invoice account', async () => {
          expect(result.data).to.have.length(2);
        });

        experiment('for the first charge date range', () => {
          let range;

          beforeEach(async () => {
            range = result.data[0];
          });

          test('the invoice account relates to the first billing role', async () => {
            expect(range.invoiceAccount.invoiceAccount.invoiceAccountNumber).to.equal(invoiceAccountA);
          });

          test('the charge date range ends on the billing role end date', async () => {
            expect(range.startDate).to.equal('2018-04-01');
            expect(range.endDate).to.equal('2018-06-01');
          });

          test('the first charge element has the correct ID', async () => {
            const { chargeElementId } = range.chargeElements[0];
            expect(chargeElementId).to.equal(chargeElement1);
          });

          test('the first charge element covers the correct charge period', async () => {
            const { startDate, endDate } = range.chargeElements[0];
            expect(startDate).to.equal('2018-04-01');
            expect(endDate).to.equal('2018-06-01');
          });

          test('the first charge element has the correct pro-rata billable days', async () => {
            const { totalDays, billableDays } = range.chargeElements[0];
            expect(totalDays).to.equal(276);
            expect(billableDays).to.equal(32);
          });

          test('the second charge element has the correct ID', async () => {
            const { chargeElementId } = range.chargeElements[1];
            expect(chargeElementId).to.equal(chargeElement2);
          });

          test('the second charge element is all year', async () => {
            const { totalDays, billableDays } = range.chargeElements[1];
            expect(totalDays).to.equal(365);
            expect(billableDays).to.equal(62);
          });

          test('the third charge element has the correct ID', async () => {
            const { chargeElementId } = range.chargeElements[2];
            expect(chargeElementId).to.equal(chargeElement3);
          });

          test('the third charge element period covers the correct charge period', async () => {
            const { startDate, endDate } = range.chargeElements[2];
            expect(startDate).to.equal('2018-04-01');
            expect(endDate).to.equal('2018-06-01');
          });

          test('the third charge element is all year, and the billing role ends before the time-limited end date', async () => {
            const { totalDays, billableDays } = range.chargeElements[2];
            expect(totalDays).to.equal(365);
            expect(billableDays).to.equal(62);
          });
        });

        experiment('for the second charge date range', () => {
          let range;

          beforeEach(async () => {
            range = result.data[1];
          });

          test('the invoice account relates to the second billing role', async () => {
            expect(range.invoiceAccount.invoiceAccount.invoiceAccountNumber).to.equal(invoiceAccountB);
          });

          test('the charge date range starts on the second billing role start date and ends on the licence end date', async () => {
            expect(range.startDate).to.equal('2018-06-02');
            expect(range.endDate).to.equal('2018-10-31');
          });

          test('the first charge element has the correct ID', async () => {
            const { chargeElementId } = range.chargeElements[0];
            expect(chargeElementId).to.equal(chargeElement1);
          });

          test('the first charge element covers the correct charge period', async () => {
            const { startDate, endDate } = range.chargeElements[0];
            expect(startDate).to.equal('2018-06-02');
            expect(endDate).to.equal('2018-10-31');
          });

          test('the first charge element has the correct pro-rata billable days', async () => {
            const { totalDays, billableDays } = range.chargeElements[0];
            expect(totalDays).to.equal(276);
            expect(billableDays).to.equal(152);
          });

          test('the second charge element has the correct ID', async () => {
            const { chargeElementId } = range.chargeElements[1];
            expect(chargeElementId).to.equal(chargeElement2);
          });

          test('the second charge element is all year', async () => {
            const { totalDays, billableDays } = range.chargeElements[1];
            expect(totalDays).to.equal(365);
            expect(billableDays).to.equal(152);
          });

          test('the third charge element has the correct ID', async () => {
            const { chargeElementId } = range.chargeElements[2];
            expect(chargeElementId).to.equal(chargeElement3);
          });

          test('the third charge element period covers the correct charge period', async () => {
            const { startDate, endDate } = range.chargeElements[2];
            expect(startDate).to.equal('2018-06-02');
            expect(endDate).to.equal('2018-10-31');
          });

          test('the third charge element is all year, and the billing role ends before the time-limited end date', async () => {
            const { totalDays, billableDays } = range.chargeElements[2];
            expect(totalDays).to.equal(365);
            expect(billableDays).to.equal(152);
          });
        });
      });

      experiment('expiring licence, 2x licence holder and 1x billing roles', () => {
        beforeEach(async () => {
          const docsData = getDocsData('2018-10-31', [
            createLicenceHolderRole(companyA, { startDate: '1993-02-12', endDate: '2018-06-01' }),
            createLicenceHolderRole(companyB, { startDate: '2018-06-02', endDate: null }),
            createBillingRole(companyA, invoiceAccountA, { startDate: '1993-02-12', endDate: null })
          ]);

          result = await processCharges(2019, data.chargeVersions.nonExpiring, docsData);
        });

        test('there is no error', async () => {
          expect(result.error).to.equal(null);
        });

        test('the charge data is not split on licenceHolder change', async () => {
          expect(result.data).to.have.length(1);
        });

        experiment('for the first charge date range', () => {
          let range;

          beforeEach(async () => {
            range = result.data[0];
          });

          test('the licence holder does not exist in charge data', async () => {
            expect(range.licenceHolder).to.be.undefined();
          });

          test('the charge date range ends on the licence end date', async () => {
            expect(range.startDate).to.equal('2018-04-01');
            expect(range.endDate).to.equal('2018-10-31');
          });

          test('the first charge element has the correct ID', async () => {
            const { chargeElementId } = range.chargeElements[0];
            expect(chargeElementId).to.equal(chargeElement1);
          });

          test('the first charge element covers the correct charge period', async () => {
            const { startDate, endDate } = range.chargeElements[0];
            expect(startDate).to.equal('2018-04-01');
            expect(endDate).to.equal('2018-10-31');
          });

          test('the first charge element has the correct pro-rata billable days', async () => {
            const { totalDays, billableDays } = range.chargeElements[0];
            expect(totalDays).to.equal(276);
            expect(billableDays).to.equal(184);
          });

          test('the second charge element has the correct ID', async () => {
            const { chargeElementId } = range.chargeElements[1];
            expect(chargeElementId).to.equal(chargeElement2);
          });

          test('the second charge element is all year', async () => {
            const { totalDays, billableDays } = range.chargeElements[1];
            expect(totalDays).to.equal(365);
            expect(billableDays).to.equal(214);
          });

          test('the third charge element has the correct ID', async () => {
            const { chargeElementId } = range.chargeElements[2];
            expect(chargeElementId).to.equal(chargeElement3);
          });

          test('the third charge element period covers the correct charge period', async () => {
            const { startDate, endDate } = range.chargeElements[2];
            expect(startDate).to.equal('2018-04-01');
            expect(endDate).to.equal('2018-10-31');
          });

          test('the third charge element is all year, and the billing role ends before the time-limited end date', async () => {
            const { totalDays, billableDays } = range.chargeElements[2];
            expect(totalDays).to.equal(365);
            expect(billableDays).to.equal(214);
          });
        });
      });
    });
  });

  experiment('when there is 1x document, expiring charge version, ', () => {
    experiment('non-expiring licence, 1x licence holder and 1x billing role', () => {
      beforeEach(async () => {
        const docsData = getDocsData(null, [
          createLicenceHolderRole(companyA, { startDate: '1993-02-12', endDate: null }),
          createBillingRole(companyA, invoiceAccountA, { startDate: '1993-02-12', endDate: null })
        ]);

        result = await processCharges(2019, data.chargeVersions.expiring, docsData);
      });

      test('there is no error', async () => {
        expect(result.error).to.equal(null);
      });

      test('there is a single charge date range', async () => {
        expect(result.data).to.have.length(1);
      });

      test('the charge date range covers the financial year ending on charge version end date', async () => {
        expect(result.data[0].startDate).to.equal('2018-04-01');
        expect(result.data[0].endDate).to.equal('2018-12-25');
      });

      test('the first charge element has the correct ID', async () => {
        const { chargeElementId } = result.data[0].chargeElements[0];
        expect(chargeElementId).to.equal(chargeElement1);
      });

      test('the first charge element covers the correct charge period', async () => {
        const { startDate, endDate } = result.data[0].chargeElements[0];
        expect(startDate).to.equal('2018-04-01');
        expect(endDate).to.equal('2018-12-25');
      });

      test('the first charge element has the correct pro-rata billable days', async () => {
        const { totalDays, billableDays } = result.data[0].chargeElements[0];
        expect(totalDays).to.equal(276);
        expect(billableDays).to.equal(239);
      });

      test('the second charge element has the correct ID', async () => {
        const { chargeElementId } = result.data[0].chargeElements[1];
        expect(chargeElementId).to.equal(chargeElement2);
      });

      test('the second charge element covers the correct charge period', async () => {
        const { startDate, endDate } = result.data[0].chargeElements[1];
        expect(startDate).to.equal('2018-04-01');
        expect(endDate).to.equal('2018-12-25');
      });

      test('the second charge element is all year', async () => {
        const { totalDays, billableDays } = result.data[0].chargeElements[1];
        expect(totalDays).to.equal(365);
        expect(billableDays).to.equal(269);
      });

      test('the third charge element has the correct ID', async () => {
        const { chargeElementId } = result.data[0].chargeElements[2];
        expect(chargeElementId).to.equal(chargeElement3);
      });

      test('the third charge element period respects the time-limited end date', async () => {
        const { startDate, endDate } = result.data[0].chargeElements[2];
        expect(startDate).to.equal('2018-04-01');
        expect(endDate).to.equal('2018-11-20');
      });

      test('the third charge element is all year, and respects the time-limited end date 2018-11-20', async () => {
        const { totalDays, billableDays } = result.data[0].chargeElements[2];
        expect(totalDays).to.equal(365);
        expect(billableDays).to.equal(234);
      });
    });

    experiment('when there are 2x documents, non-expiring charge version, ', () => {
      experiment('non-expiring licence, 1x licence holder and 1x billing role', () => {
        beforeEach(async () => {
          const docsData = [
            ...getDocsData('2018-06-01', [
              createLicenceHolderRole(companyA, { startDate: '1993-02-12', endDate: null }),
              createBillingRole(companyA, invoiceAccountA, { startDate: '1993-02-12', endDate: null })
            ]),
            ...getDocsData(null, [
              createLicenceHolderRole(companyA, { startDate: '2018-06-02', endDate: null }),
              createBillingRole(companyA, invoiceAccountA, { startDate: '2018-06-02', endDate: null })
            ])];

          result = await processCharges(2019, data.chargeVersions.nonExpiring, docsData);
        });

        test('there is no error', async () => {
          expect(result.error).to.equal(null);
        });

        test('there is a single charge date range', async () => {
          expect(result.data).to.have.length(1);
        });

        test('the charge date range covers the financial year ending 2019', async () => {
          expect(result.data[0].startDate).to.equal('2018-04-01');
          expect(result.data[0].endDate).to.equal('2019-03-31');
        });

        test('the first charge element has the correct ID', async () => {
          const { chargeElementId } = result.data[0].chargeElements[0];
          expect(chargeElementId).to.equal(chargeElement1);
        });

        test('the first charge element covers the correct charge period', async () => {
          const { startDate, endDate } = result.data[0].chargeElements[0];
          expect(startDate).to.equal('2018-04-01');
          expect(endDate).to.equal('2019-03-31');
        });

        test('the first charge element has the correct pro-rata billable days', async () => {
          const { totalDays, billableDays } = result.data[0].chargeElements[0];
          expect(totalDays).to.equal(276);
          expect(billableDays).to.equal(276);
        });

        test('the second charge element has the correct ID', async () => {
          const { chargeElementId } = result.data[0].chargeElements[1];
          expect(chargeElementId).to.equal(chargeElement2);
        });

        test('the second charge element covers the correct charge period', async () => {
          const { startDate, endDate } = result.data[0].chargeElements[1];
          expect(startDate).to.equal('2018-04-01');
          expect(endDate).to.equal('2019-03-31');
        });

        test('the second charge element is all year', async () => {
          const { totalDays, billableDays } = result.data[0].chargeElements[1];
          expect(totalDays).to.equal(365);
          expect(billableDays).to.equal(365);
        });

        test('the third charge element has the correct ID', async () => {
          const { chargeElementId } = result.data[0].chargeElements[2];
          expect(chargeElementId).to.equal(chargeElement3);
        });

        test('the third charge element period respects the time-limited end date', async () => {
          const { startDate, endDate } = result.data[0].chargeElements[2];
          expect(startDate).to.equal('2018-04-01');
          expect(endDate).to.equal('2018-11-20');
        });

        test('the third charge element is all year, and respects the time-limited end date 2018-11-20', async () => {
          const { totalDays, billableDays } = result.data[0].chargeElements[2];
          expect(totalDays).to.equal(365);
          expect(billableDays).to.equal(234);
        });
      });
    });

    experiment('when there is 1x document, non-expiring charge version, mid-year section 127 agreement', () => {
      beforeEach(async () => {
        repository.licenceAgreements.findByLicenceNumber.resolves([data.licenceAgreements.section127]);
      });

      experiment('non-expiring licence, 1x licence holder and 1x billing role', () => {
        beforeEach(async () => {
          const docsData = getDocsData(null, [
            createLicenceHolderRole(companyA, { startDate: '1993-02-12', endDate: null }),
            createBillingRole(companyA, invoiceAccountA, { startDate: '1993-02-12', endDate: null })
          ]);

          result = await processCharges(2019, data.chargeVersions.nonExpiring, docsData);
        });

        test('there is no error', async () => {
          expect(result.error).to.equal(null);
        });

        test('there is are 2 charge date ranges', async () => {
          expect(result.data).to.have.length(2);
        });

        experiment('the first date range', () => {
          test('covers the period up until the section 127 agreement starts', async () => {
            const { startDate, endDate } = result.data[0].chargeElements[0];
            expect(startDate).to.equal('2018-04-01');
            expect(endDate).to.equal('2018-07-31');
          });

          test('the first charge element has the correct ID', async () => {
            const { chargeElementId } = result.data[0].chargeElements[0];
            expect(chargeElementId).to.equal(chargeElement1);
          });

          test('does not have a section 127 agreement', async () => {
            const { section127Agreement } = result.data[0];
            expect(section127Agreement).to.equal(false);
          });

          test('the first charge element has the correct pro-rata billable days', async () => {
            const { totalDays, billableDays } = result.data[0].chargeElements[0];
            expect(totalDays).to.equal(276);
            expect(billableDays).to.equal(92);
          });
        });

        experiment('the second date range', () => {
          test('covers the period from when the section 127 agreement starts', async () => {
            const { startDate, endDate } = result.data[1].chargeElements[0];
            expect(startDate).to.equal('2018-08-01');
            expect(endDate).to.equal('2019-03-31');
          });

          test('the first charge element has the correct ID', async () => {
            const { chargeElementId } = result.data[1].chargeElements[0];
            expect(chargeElementId).to.equal(chargeElement1);
          });

          test('has a section 127 agreement', async () => {
            const { section127Agreement } = result.data[1];
            expect(section127Agreement).to.equal(true);
          });

          test('the first charge element has the correct pro-rata billable days', async () => {
            const { totalDays, billableDays } = result.data[1].chargeElements[0];
            expect(totalDays).to.equal(276);
            expect(billableDays).to.equal(184);
          });
        });
      });
    });
  });
});
