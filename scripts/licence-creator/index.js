const fs = require('fs');
const moment = require('moment');
const Promise = require('bluebird');
const csvStringify = require('csv-stringify/lib/sync');
const getNextId = require('./next-id');
const writeFile = Promise.promisify(fs.writeFile);

// Licence classes
const Licence = require('./licence');
const Version = require('./version');

const Address = require('./address');
const Agreement = require('./agreement');
const Condition = require('./condition');
const Contact = require('./contact');
const ContactNo = require('./contact-no');
const MeansOfAbstraction = require('./means-of-abstraction');
const Party = require('./party');
const Point = require('./point');
const Purpose = require('./purpose');
const PurposePoint = require('./purpose-point');
const Role = require('./role');
const WALicenceType = require('./wa-licence-type');

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

// Add role
const role = new Role();
l.addRole(role);
// role.setLicence(this);
role.setParty(party);
role.setAddress(address);

// Add contact no to role
const contactNo = new ContactNo();
contactNo.setParty(party);
contactNo.setAddress(address);
role.addContactNo(contactNo);

// Add purpose
const purpose = new Purpose();
version.addPurpose(purpose);

// Add condition
const cond1 = new Condition();
purpose.addCondition(cond1);

// Add agreement
const aggreement = new Agreement();
purpose.addAggreement(aggreement);

// Add point
const point = new Point();

// Add purpose points
const pp = new PurposePoint();
const means = new MeansOfAbstraction('UNP', 'Unspecified Pump');
pp.setMeansOfAbstraction(means);
pp.setPoint(point);
purpose.addPurposePoint(pp);


// Export CSV
const data = l.exportAll();


function writeCsv(outputPath, exportData) {
  const keys = Object.keys(exportData);
  return Promise.map(keys, (tableName) => {
    const data = exportData[tableName];
    console.log(`Exporting ${tableName}`);
    const columns = Object.keys(data[0]).map(s => s.replace(/[^A-Z_0-9]/ig, ''));
    const csv = csvStringify(data, {columns, header : true, quoted : false, quotedEmpty : false, quotedString : false});
    return writeFile(`${ outputPath }${ tableName }.txt`, csv);
  });
}
const outputPath = './test/dummy-csv/';
writeCsv(outputPath, data);
