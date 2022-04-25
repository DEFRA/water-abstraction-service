const { assertDate } = require('../../../lib/models/validators');
const licencesService = require('../../../lib/services/licences');
const licencesVersionRepo = require('../../../lib/connectors/repos/licence-versions');
const { get } = require('lodash');
const documentsService = require('../../../lib/services/documents-service');
const { billing } = require('../../../../config');
const companiesService = require('../../../lib/services/companies-service');
const chargeVersionsService = require('../../../lib/services/charge-versions');
const repos = require('../../../lib/connectors/repos');

const IMPORTED_REASON = 'Strategic review of charges (SRoC)';

let cache = {};

const parseFactor = factor => {
  switch (factor) {
    case '1':
    case '' : return null;
    default: return factor;
  }
};

const parseBool = bool => {
  switch (bool) {
    case 'Y': return true;
    case 'N': return false;
    default: return null;
  }
};

const formatDate = date => {
  try {
    const [day, month, year] = date.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    assertDate(formattedDate);
    return new Date(formattedDate);
  } catch (_e) {
    return null;
  }
};

const getLicenceVersionPurposes = async licenceId => {
  try {
    const licenceVersions = await licencesService.getLicenceVersions(licenceId);
    const { id } = licenceVersions.find(licenceVersion => licenceVersion.status === 'current') || {};
    const licencesVersion = await licencesVersionRepo.findOne(id);
    return get(licencesVersion, 'licenceVersionPurposes') || [];
  } catch (_e) {
    return null;
  }
};

const getInvoiceAccount = async (licence, invoiceAccountNumber) => {
  try {
    if (!cache.invoiceAccounts) {
      cache.invoiceAccounts = [];
    }
    const { licenceNumber } = licence;
    if (!cache.invoiceAccounts[licenceNumber]) {
      if (invoiceAccountNumber) {
        const document = await documentsService.getValidDocumentOnDate(licenceNumber, billing.srocStartDate);
        const licenceHolder = document.roles.find(role => role.roleName === 'licenceHolder');
        const invoiceAccounts = await companiesService.getCompanyInvoiceAccounts(licenceHolder.company.id);
        cache.invoiceAccounts[licenceNumber] = invoiceAccounts.find(account => account.accountNumber === invoiceAccountNumber);
      } else {
        const chargeVersions = await chargeVersionsService.getByLicenceRef(licenceNumber);
        const chargeVersion = chargeVersions.find(version => !get(version, 'dateRange.endDate') && version.status === 'current');
        if (chargeVersion) {
          const { invoiceAccount } = await chargeVersionsService.getByIdWithInvoiceAccount(chargeVersion.id);
          cache.invoiceAccounts[licenceNumber] = invoiceAccount;
        }
      }
    }
    return cache.invoiceAccounts[licenceNumber];
  } catch (_e) {
    return null;
  }
};

const getPurposeUses = async () => {
  try {
    if (!cache.purposeUses) {
      cache.purposeUses = await repos.purposeUses.findAll();
    }
    return cache.purposeUses;
  } catch (_e) {
    return null;
  }
};

const getSupportedSources = async () => {
  try {
    if (!cache.supportedSources) {
      cache.supportedSources = await repos.supportedSources.findAll();
    }
    return cache.supportedSources;
  } catch (_e) {
    return null;
  }
};

const getChangeReason = async () => {
  try {
    if (!cache.changeReason) {
      cache.changeReason = await repos.changeReasons.findOneByDescription(IMPORTED_REASON);
    }
    return cache.changeReason;
  } catch (_e) {
    return null;
  }
};

const clearCache = () => {
  cache = {};
};

exports.parseFactor = parseFactor;
exports.parseBool = parseBool;
exports.formatDate = formatDate;
exports.getLicenceVersionPurposes = getLicenceVersionPurposes;
exports.getInvoiceAccount = getInvoiceAccount;
exports.getPurposeUses = getPurposeUses;
exports.getSupportedSources = getSupportedSources;
exports.getChangeReason = getChangeReason;
exports.clearCache = clearCache;
