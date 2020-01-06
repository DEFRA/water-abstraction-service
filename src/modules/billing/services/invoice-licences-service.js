const Licence = require('../../../lib/models/licence');
const InvoiceLicence = require('../../../lib/models/invoice-licence');

const { mapCRMAddressToModel } = require('./address-service');
const { mapCRMCompanyToModel } = require('./companies-service');
const { mapCRMContactToModel } = require('./contacts-service');
const { mapChargeToTransactions } = require('./transactions-service');

/**
 * Maps a charge version from the charge processor to a Licence instance
 * @param {Object} chargeVersion
 * @return {Licence}
 */
const mapLicence = chargeVersion => {
  const licence = new Licence();
  licence.licenceNumber = chargeVersion.licenceRef;
  return licence;
};

/**
 * Maps a row of data from the charge processor to an InvoiceLicence instance
 * @param {Object} data - processed charge version
 * @return {InvoiceLicence}
 */
const mapChargeRowToModel = data => {
  const invoiceLicence = new InvoiceLicence();
  invoiceLicence.licence = mapLicence(data.chargeVersion);
  invoiceLicence.company = mapCRMCompanyToModel(data.licenceHolder.company);
  invoiceLicence.address = mapCRMAddressToModel(data.licenceHolder.address);
  if (data.licenceHolder.contact) {
    invoiceLicence.contact = mapCRMContactToModel(data.licenceHolder.contact);
  }

  // @TODO add relevant flags for compensation, TPT, credit
  invoiceLicence.transactions = mapChargeToTransactions(data);
  return invoiceLicence;
};

exports.mapChargeRowToModel = mapChargeRowToModel;
