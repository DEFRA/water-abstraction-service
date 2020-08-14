'use strict';

const uuid = require('uuid/v4');

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargeVersion = require('../../../../src/lib/models/charge-version');
const DateRange = require('../../../../src/lib/models/date-range');
const Licence = require('../../../../src/lib/models/licence');
const Region = require('../../../../src/lib/models/region');
const Company = require('../../../../src/lib/models/company');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const ChargeElement = require('../../../../src/lib/models/charge-element');
const ChangeReason = require('../../../../src/lib/models/change-reason');

const chargeVersionsMapper = require('../../../../src/modules/billing/mappers/charge-version');

const dbRow = {
  chargeVersionId: '90d4af8a-1717-452c-84bd-467a7d55ade4',
  licence: {
    licenceId: '1060daa7-f363-48bb-a3a7-45733df07781',
    licenceRef: '123/45/67',
    isWaterUndertaker: false,
    startDate: '2006-04-01',
    expiredDate: null,
    lapsedDate: null,
    revokedDate: null,
    regionCode: 'Y',
    region: {
      regionId: '322db52e-5859-4dc6-be03-304996b55f3d',
      name: 'North East',
      chargeRegionId: 'Y',
      naldRegionId: 2,
      displayName: 'North East'
    },
    regions: {
      historicalAreaCode: 'EAAR',
      regionalChargeArea: 'regionalChargeArea'
    }
  },
  scheme: 'alcs',
  versionNumber: 2,
  startDate: '2006-04-01',
  endDate: null,
  status: 'current',
  source: 'nald',
  companyId: '50581206-69f9-471e-9fb2-55e9169273f6',
  invoiceAccountId: '04b85d1d-535c-4439-8247-fc06acbf5b34',
  chargeElements: [{
    chargeElementId: 'aad085bf-8cff-4b5e-88fd-27a7874833d0',
    source: 'unsupported',
    season: 'summer',
    loss: 'low',
    abstractionPeriodStartDay: 1,
    abstractionPeriodStartMonth: 4,
    abstractionPeriodEndDay: 31,
    abstractionPeriodEndMonth: 3,
    authorisedAnnualQuantity: 50,
    billableAnnualQuantity: null
  }],
  changeReason: {
    changeReasonId: '35c32746-fc18-43ac-8509-42e2788cf22d',
    description: 'change reason'
  }
};

experiment('modules/billing/mappers/charge-version', () => {
  let result;

  experiment('.dbToModel', () => {
    beforeEach(async () => {
      result = chargeVersionsMapper.dbToModel(dbRow);
    });

    test('returns an instance of ChargeVersion', async () => {
      expect(result instanceof ChargeVersion).to.be.true();
    });

    test('sets the .id property', async () => {
      expect(result.id).to.equal(dbRow.chargeVersionId);
    });

    test('sets the .licence property to an instance of Licence', async () => {
      expect(result.licence instanceof Licence).to.be.true();
    });

    test('sets the .licence property correctly', async () => {
      expect(result.licence.id).to.equal(dbRow.licence.licenceId);
      expect(result.licence.licenceNumber).to.equal(dbRow.licence.licenceRef);
      expect(result.licence.isWaterUndertaker).to.equal(dbRow.licence.isWaterUndertaker);
      expect(result.licence.startDate).to.equal(dbRow.licence.startDate);
    });

    test('sets the .scheme property', async () => {
      expect(result.scheme).to.equal(dbRow.scheme);
    });

    test('sets the .versionNumber property', async () => {
      expect(result.versionNumber).to.equal(dbRow.versionNumber);
    });

    test('sets the .dateRange property to an instance of DateRange', async () => {
      expect(result.dateRange instanceof DateRange).to.be.true();
    });

    test('sets the .dateRange property correctly', async () => {
      expect(result.dateRange.startDate).to.equal(dbRow.startDate);
      expect(result.dateRange.endDate).to.equal(dbRow.endDate);
    });

    test('sets the .status property', async () => {
      expect(result.status).to.equal(dbRow.status);
    });

    test('sets the .region property to an instance of Region', async () => {
      expect(result.region instanceof Region).to.be.true();
    });

    test('sets the .region property correctly', async () => {
      expect(result.region.numericCode).to.equal(dbRow.regionCode);
      expect(result.region.type).to.equal(Region.types.region);
    });

    test('sets the .source property', async () => {
      expect(result.source).to.equal(dbRow.source);
    });

    test('sets the .company property to an instance of Company', async () => {
      expect(result.company instanceof Company).to.be.true();
    });

    test('sets the .company property correctly', async () => {
      expect(result.company.id).to.equal(dbRow.companyId);
    });

    test('sets the .invoiceAccount property to an instance of InvoiceAccount', async () => {
      expect(result.invoiceAccount instanceof InvoiceAccount).to.be.true();
    });

    test('sets the .invoiceAccount property correctly', async () => {
      expect(result.invoiceAccount.id).to.equal(dbRow.invoiceAccountId);
    });

    test('sets the .chargeElements property to an array of ChargeElement instances', async () => {
      expect(result.chargeElements[0] instanceof ChargeElement).to.be.true();
    });

    test('sets the .chargeElements property correctly', async () => {
      expect(result.chargeElements[0].id).to.equal(dbRow.chargeElements[0].chargeElementId);
      expect(result.chargeElements[0].source).to.equal(dbRow.chargeElements[0].source);
      expect(result.chargeElements[0].season).to.equal(dbRow.chargeElements[0].season);
      expect(result.chargeElements[0].loss).to.equal(dbRow.chargeElements[0].loss);
      expect(result.chargeElements[0].authorisedAnnualQuantity).to.equal(dbRow.chargeElements[0].authorisedAnnualQuantity);
      expect(result.chargeElements[0].billableAnnualQuantity).to.equal(dbRow.chargeElements[0].billableAnnualQuantity);
    });

    test('sets the .changeReason property to an instance of ChangeReason', async () => {
      expect(result.changeReason instanceof ChangeReason).to.be.true();
    });

    test('sets the .changeReason property correctly', async () => {
      expect(result.changeReason.id).to.equal(dbRow.changeReason.changeReasonId);
      expect(result.changeReason.reason).to.equal(dbRow.changeReason.description);
    });
  });
});
