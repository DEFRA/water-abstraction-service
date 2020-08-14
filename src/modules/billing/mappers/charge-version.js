const ChargeVersion = require('../../../lib/models/charge-version');
const Company = require('../../../lib/models/company');
const DateRange = require('../../../lib/models/date-range');
const InvoiceAccount = require('../../../lib/models/invoice-account');
const Region = require('../../../lib/models/region');

const chargeElementMapper = require('./charge-element');
const mappers = require('../../../lib/mappers');

const createRegion = regionCode => {
  const region = new Region();
  return region.fromHash({
    numericCode: regionCode,
    type: Region.types.region
  });
};

const dbToModel = row => {
  const chargeVersion = new ChargeVersion();
  return chargeVersion.fromHash({
    id: row.chargeVersionId,
    licence: mappers.licence.dbToModel(row.licence),
    scheme: row.scheme,
    versionNumber: row.versionNumber,
    dateRange: new DateRange(row.startDate, row.endDate),
    status: row.status,
    region: createRegion(row.regionCode),
    source: row.source,
    company: new Company(row.companyId),
    invoiceAccount: new InvoiceAccount(row.invoiceAccountId),
    chargeElements: row.chargeElements.map(chargeElementMapper.dbToModel),
    changeReason: mappers.changeReason.dbToModel(row.changeReason)
  });
};

exports.dbToModel = dbToModel;
