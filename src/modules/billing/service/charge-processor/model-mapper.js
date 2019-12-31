/**
 * This maps the data output from the charge processor
 * to service models
 */
const { Address, Batch, Company, Invoice, InvoiceAccount, InvoiceLicence, Licence, Role } = require('../../../../lib/models');
const Contact = require('../../../../lib/models/contact-v2');
const { uniqBy, last } = require('lodash');

/**
 * Maps address data from CRM to water service Address model
 * @param {Object} data - address data from CRM
 * @return {Address}
 */
const mapAddress = data => {
  const address = new Address();
  address.id = data.addressId;
  address.addressLine1 = data.address1;
  address.addressLine2 = data.address2;
  address.addressLine3 = data.address3;
  address.addressLine4 = data.address4;
  address.town = data.town;
  address.county = data.county;
  address.postcode = data.postcode;
  address.country = data.country;
  return address;
};

const mapInvoiceAccount = data => {
  const invoiceAccount = new InvoiceAccount();
  invoiceAccount.id = data.invoiceAccountId;
  invoiceAccount.accountNumber = data.invoiceAccountNumber;
  return invoiceAccount;
};

const mapRoles = roles => roles.map(row => {
  const role = new Role();
  role.startDate = row.startDate;
  role.endDate = row.endDate;
  role.roleName = row.roleName;
  role.company = mapCompany(row.company);
  if (row.contact) role.contact = mapContact(row.contact);
  role.address = mapAddress(row.address);
  return role;
});

/**
 * Maps a row of CRM v2 contact data to a Company instance
 * @param {Object} companyData
 * @return {Company}
 */
const mapCompany = companyData => {
  const company = new Company();
  company.id = companyData.companyId;
  company.name = companyData.name;
  return company;
};

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
 * Maps a row of CRM v2 contact data to a Contact instance
 * @param {Object} contactData
 * @return {Contact}
 */
const mapContact = contactData => {
  const contact = new Contact();
  contact.id = contactData.contactId;
  contact.salutation = contactData.salutation;
  contact.firstName = contactData.firstName;
  contact.lastName = contactData.lastName;
  contact.initials = contactData.initials;
  return contact;
};

/**
 * Maps a row of data from the charge processor to an InvoiceLicence instance
 * @param {Object} data - processed charge version
 * @param {Array} roles - processed roles objects
 * @return {InvoiceLicence}
 */
const mapInvoiceLicence = (data, roles) => {
  const invoiceLicence = new InvoiceLicence();
  invoiceLicence.licence = mapLicence(data.chargeVersion);
  invoiceLicence.roles = mapRoles(roles);

  const lastLicenceHolder = last(roles.filter(role => role.roleName === role.ROLE_LICENCE_HOLDER));
  invoiceLicence.company = mapCompany(lastLicenceHolder.company);
  invoiceLicence.address = mapAddress(lastLicenceHolder.address);
  if (lastLicenceHolder.contact) invoiceLicence.contact = mapContact(lastLicenceHolder.contact);

  return invoiceLicence;
};

const getInvoiceAccountNumber = row => row.invoiceAccount.invoiceAccount.invoiceAccountNumber;

/**
 * Maps output data from charge processor into an array of unique invoice licences
 * matching the invoice account number of the supplied Invoice instance
 * @param {Invoice} invoice - invoice instance
 * @param {Array} data - processed charge versions
 * @return {Array<InvoiceLicence>}
 */
const mapInvoiceLicences = (invoice, data, roles) => {
  // Find rows with invoice account number that match the supplied invoice
  const { accountNumber } = invoice.invoiceAccount;
  const filtered = data.filter(row => getInvoiceAccountNumber(row) === accountNumber);

  // Create array of InvoiceLicences
  const invoiceLicences = filtered.map(row => mapInvoiceLicence(row, roles));
  // @todo attach transactions to InvoiceLicences
  // Return a unique list
  return uniqBy(invoiceLicences, invoiceLicence => invoiceLicence.uniqueId);
};

const mapInvoices = (data, roles) => {
  // Create unique list of invoice accounts within data
  const rows = uniqBy(
    data.map(row => row.invoiceAccount),
    row => row.invoiceAccount.invoiceAccountId
  );

  // Map to invoice models
  return rows.map(row => {
    const invoice = new Invoice();

    // Create invoice account model
    invoice.invoiceAccount = mapInvoiceAccount(row.invoiceAccount);

    // Create invoice address model
    invoice.address = mapAddress(row.address);

    // Create invoiceLicences array
    invoice.invoiceLicences = mapInvoiceLicences(invoice, data, roles);

    return invoice;
  });
};

/**
 * Maps the charge data to water service models ready for use
 * within this service
 * @param {String} batchId - the guid batch ID in water.billing_batches
 * @param {Array} data - array of data from charge processor
 * @return {Batch} water Batch instance
 */
const modelMapper = (batchId, data, roles) => {
  // Create batch
  const batch = new Batch();
  batch.id = batchId;

  // Add invoices to batch
  batch.addInvoices(mapInvoices(data, roles));

  return batch;
};

exports.modelMapper = modelMapper;
