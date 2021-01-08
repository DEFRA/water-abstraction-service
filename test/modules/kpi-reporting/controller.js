'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();
const controller = require('../../../src/modules/kpi-reporting/controller');
const dataService = require('../../../src/modules/kpi-reporting/services/data-service');
const { expect } = require('@hapi/code');
const helpers = require('@envage/water-abstraction-helpers');

experiment('./modules/kpi-reporting/controller', () => {
  const crmData = {
    totals: { allTime: 17, ytd: 14 },
    monthly: [{ month: 'June', year: 2020, total: 10, change: 100 }]
  };
  const idmData = {
    totals: { allTime: 20, ytd: 18 },
    monthly: [{ month: 'June', internal: 2, external: 1, year: 2020 }]
  };
  const returnsDataCycle = { due: 1551, internalOnTime: 1, internalLate: 1, externalOnTime: 1, externalLate: 1 };
  const returnsDataMonthly = [{ currentYear: true, month: 1, request: 0, return: 1 }];
  const licenceNamesData = [
    { currentYear: true, month: 1, named: 220, renamed: 110, year: 2020 },
    { currentYear: false, month: 12, named: 200, renamed: 100, year: 2019 }
  ];

  const returnCycles = [
    { startDate: '2017-11-01', endDate: '2018-10-31', isSummer: true },
    { startDate: '2018-04-01', endDate: '2019-03-31', isSummer: false }
  ];

  beforeEach(async => {
    sandbox.stub(dataService, 'getLicenceNamesData');
    sandbox.stub(dataService, 'getReturnsDataByMonth');
    sandbox.stub(dataService, 'getIDMRegistrationsData');
    sandbox.stub(dataService, 'getCRMDelegatedAccessData');
    sandbox.stub(dataService, 'getReturnsDataByCycle');
    sandbox.stub(helpers.returns.date, 'createReturnCycles').returns(returnCycles);
  });

  afterEach(async => {
    sandbox.restore();
  });

  experiment('when data from services are missing', () => {
    beforeEach(async => {
      dataService.getLicenceNamesData.resolves(null);
      dataService.getReturnsDataByMonth.resolves(null);
      dataService.getIDMRegistrationsData.resolves(null);
      dataService.getCRMDelegatedAccessData.resolves(null);
      dataService.getReturnsDataByCycle.resolves(null);
    });
    test('Boom not found error is returned', async () => {
      const emptyResponse = { totals: { allTime: 0, ytd: 0 }, monthly: [] };
      const emptyDataResponse = {
        data: {
          registrations: emptyResponse,
          delegatedAccess: emptyResponse,
          returnsMonthly: emptyResponse,
          returnsCycle1: {},
          returnsCycle2: {},
          licenceNames: emptyResponse
        }
      };
      const response = await controller.getKpiData({});
      expect(response).to.be.equal(emptyDataResponse);
    });
  });

  experiment('when data from services are returned', () => {
    beforeEach(async => {
      dataService.getLicenceNamesData.returns(licenceNamesData);
      dataService.getReturnsDataByMonth.returns(returnsDataMonthly);
      dataService.getIDMRegistrationsData.returns(idmData);
      dataService.getCRMDelegatedAccessData.returns(crmData);
      dataService.getReturnsDataByCycle.returns(returnsDataCycle);
    });

    test('Licence Named data from events is returned in the right shape', async () => {
      const { data: { licenceNames } } = await controller.getKpiData();
      expect(licenceNames.totals).to.be.equal({ allTime: 630, ytd: 330 });
      expect(licenceNames.monthly[0].currentYear).to.be.true();
      expect(licenceNames.monthly[0].named).to.equal(220);
      expect(licenceNames.monthly[0].renamed).to.equal(110);
      expect(licenceNames.monthly[0].year).to.equal(2021);
      expect(licenceNames.monthly[0].namedChange).to.equal(10);
      expect(licenceNames.monthly[0].renamedChange).to.equal(10);
    });

    test('registrations data from events is returned in the right shape', async () => {
      const { data: { registrations } } = await controller.getKpiData();
      expect(registrations.totals).to.be.equal({ allTime: 20, ytd: 18 });
      expect(registrations.monthly[0].month).to.equal('June');
      expect(registrations.monthly[0].internal).to.equal(2);
      expect(registrations.monthly[0].external).to.equal(1);
      expect(registrations.monthly[0].year).to.equal(2020);
    });

    test('Returns monthly data from events is returned in the right shape', async () => {
      const { data: { returnsMonthly } } = await controller.getKpiData();
      expect(returnsMonthly.totals).to.be.equal({ allTime: 1, ytd: 1 });
      expect(returnsMonthly.monthly[0].month).to.equal('January');
      expect(returnsMonthly.monthly[0].request).to.equal(0);
      expect(returnsMonthly.monthly[0].return).to.equal(1);
      expect(returnsMonthly.monthly[0].currentYear).to.equal(2021);
    });
    test('Delegated access data from CRM is returned in the right shape', async () => {
      const { data: { delegatedAccess } } = await controller.getKpiData();
      expect(delegatedAccess.totals).to.be.equal({ allTime: 17, ytd: 14 });
      expect(delegatedAccess.monthly[0].month).to.equal('June');
      expect(delegatedAccess.monthly[0].total).to.equal(10);
      expect(delegatedAccess.monthly[0].change).to.equal(100);
      expect(delegatedAccess.monthly[0].year).to.equal(2020);
    });
    test('Returns cycle 1 data from returns is returned in the right shape', async () => {
      const { data: { returnsCycle1 } } = await controller.getKpiData();
      expect(returnsCycle1.startDate).to.be.equal('2018-04-01');
      expect(returnsCycle1.endDate).to.equal('2019-03-31');
      expect(returnsCycle1.isSummer).to.be.false();
      expect(returnsCycle1.due).to.equal(1551);
      expect(returnsCycle1.internalOnTime).to.equal(1);
      expect(returnsCycle1.internalLate).to.equal(1);
      expect(returnsCycle1.externalOnTime).to.equal(1);
      expect(returnsCycle1.externalLate).to.equal(1);
      expect(returnsCycle1.total).to.equal(4);
    });
    test('Returns cycle 2 data from returns is returned in the right shape', async () => {
      const { data: { returnsCycle2 } } = await controller.getKpiData();
      expect(returnsCycle2.startDate).to.be.equal('2017-11-01');
      expect(returnsCycle2.endDate).to.equal('2018-10-31');
      expect(returnsCycle2.isSummer).to.be.true();
      expect(returnsCycle2.due).to.equal(1551);
      expect(returnsCycle2.internalOnTime).to.equal(1);
      expect(returnsCycle2.internalLate).to.equal(1);
      expect(returnsCycle2.externalOnTime).to.equal(1);
      expect(returnsCycle2.externalLate).to.equal(1);
      expect(returnsCycle2.total).to.equal(4);
    });
  });
});
