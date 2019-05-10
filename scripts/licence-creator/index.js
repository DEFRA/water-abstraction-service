'use strict';

const fs = require('fs');
const Promise = require('bluebird');
const csvStringify = require('csv-stringify/lib/sync');
const writeFile = Promise.promisify(fs.writeFile);
const deepMap = require('deep-map');
const { mkdirsSync } = require('mkdir');

// Licence classes
const Licence = require('./licence');
const Version = require('./version');

const Address = require('./address');
const Agreement = require('./agreement');
const Condition = require('./condition');
const ConditionType = require('./condition-type');
const Contact = require('./contact');
const ContactNo = require('./contact-no');
const ContactNoType = require('./contact-no-type');
const MeansOfAbstraction = require('./means-of-abstraction');
const Party = require('./party');
const Point = require('./point');
const Purpose = require('./purpose');
const PurposePrimary = require('./purpose-primary');
const PurposeSecondary = require('./purpose-secondary');
const PurposeTertiary = require('./purpose-tertiary');

const PurposePoint = require('./purpose-point');
const Role = require('./role');
const RoleType = require('./role-type');
const Source = require('./source');
const WALicenceType = require('./wa-licence-type');

const ReturnVersion = require('./return-version');
const ReturnFormat = require('./return-format');
const ReturnFormatPoint = require('./return-format-point');
const ReturnFormatPurpose = require('./return-format-purpose');

// Construct licence
const l = new Licence('12/34/56/78');

const type = new WALicenceType('TEST', 'Test licence type');

const version = new Version();
version.setLicence(this);
version.setWALicenceType(type);
l.addVersion(version);

// Add party to version
const party = new Party();
version.setParty(party);

// Add contact to party
const contact = new Contact();
contact.setParty(party);
party.addContact(contact);

// Add address to contact
const address = new Address();
contact.setAddress(address);
version.setAddress(address);

// Add role
const role = new Role();
const roleType = new RoleType();
role.setRoleType(roleType);

l.addRole(role);

// role.setLicence(this);
role.setParty(party);
role.setAddress(address);

// Add contact no to role
const contactNo = new ContactNo();
const contactNoType = new ContactNoType();
contactNo.setParty(party);
contactNo.setAddress(address);
contactNo.setContactNoType(contactNoType);
role.addContactNo(contactNo);

// Add purpose
const purpose = new Purpose();

const primary = new PurposePrimary();
purpose.setPrimaryPurpose(primary);

const secondary = new PurposeSecondary();
purpose.setSecondaryPurpose(secondary);

const tertiary = new PurposeTertiary();
purpose.setTertiaryPurpose(tertiary);

purpose.setLicence(l);
version.addPurpose(purpose);

// Add condition
const cond1 = new Condition();
const conditionType = new ConditionType();
cond1.setType(conditionType);
purpose.addCondition(cond1);

// Add agreement
const aggreement = new Agreement();
purpose.addAggreement(aggreement);

// Add point
const point = new Point();
const source = new Source();
point.setSource(source);

// Add purpose points
const pp = new PurposePoint();
const means = new MeansOfAbstraction('UNP', 'Unspecified Pump');
pp.setMeansOfAbstraction(means);
pp.setPoint(point);
purpose.addPurposePoint(pp);

// Return version
const rv = new ReturnVersion();
l.addReturnVersion(rv);

// Create format
const format = new ReturnFormat();
format.setLicence(l);
rv.addFormat(format);

const fp = new ReturnFormatPoint();
fp.setPoint(point);
format.addPoint(fp);

const fpu = new ReturnFormatPurpose();
format.addPurpose(fpu);

/**
 * Export data as CSV files
 * @param {String} outputPath - directory to dump CSV files
 * @param {Object} exportData - data to dump to CSV files, keys are table names
 * @return {Promise} resolves when CSV files written
 */
function writeCsv (outputPath, exportData) {
  const keys = Object.keys(exportData);
  return Promise.map(keys, (tableName) => {
    // Convert JS null to 'null' string as in CSV data
    const data = deepMap(exportData[tableName], (value) => {
      return value === null ? 'null' : value;
    });
    console.log(`Exporting ${tableName}`);
    const columns = Object.keys(data[0]);
    const csv = csvStringify(data, { columns, header: true, quoted: false, quotedEmpty: false, quotedString: false });
    return writeFile(`${outputPath}${tableName}.txt`, csv);
  });
}

function dumpCsv () {
  const outputPath = './test/dummy-csv/';
  mkdirsSync(outputPath);
  const data = l.exportAll();
  return writeCsv(outputPath, data);
}

module.exports = dumpCsv;

if (!module.parent) {
  dumpCsv();
}
