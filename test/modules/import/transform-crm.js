const { expect } = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { buildCRMPacket } = require('../../../src/modules/import/transform-crm');

lab.experiment('Test CRM packet generation', () => {
  lab.test('Ensure CRM packet is generated when current version is present', async () => {
    const dummyLicence = require('./dummy-licence.json');
    const packet = buildCRMPacket(dummyLicence);

    const metadata = JSON.parse(packet.metadata);

    expect(metadata.IsCurrent).to.equal(true);
    expect(metadata.Expires).to.equal('20200101');
    expect(metadata.Modified).to.equal('20180101');
    expect(metadata.contacts.length).to.equal(2);
    expect(metadata.contacts[0].role).to.equal('Licence holder');
    expect(metadata.contacts[1].role).to.equal('Licence contact');
  });

  lab.test('Ensure CRM packet is generated when current version is not present', async () => {
    const dummyLicence = require('./dummy-licence.json');
    delete dummyLicence.data.current_version;
    const packet = buildCRMPacket(dummyLicence);

    const metadata = JSON.parse(packet.metadata);
    expect(metadata.IsCurrent).to.equal(false);
  });
});
