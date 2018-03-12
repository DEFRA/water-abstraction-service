const Lab = require('lab');

const lab = Lab.script();
const Code = require('code');
const server = require('../../index.js');
const licenceCreator = require('../../scripts/licence-creator/index.js');

let licenceData;

lab.experiment('Test NALD import', () => {
  lab.before(async () => {
    // Generate dummy NALD data
    await licenceCreator();

    // Import dummy data into import DB
    const request = {
      method: 'GET',
      url: '/water/1.0/nald/import/test',
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };
    await server.inject(request);

    // Load dummy licence JSON
    const request2 = {
      method: 'POST',
      url: '/water/1.0/nald/licence',
      payload: {
        licence_number: '12/34/56/78'
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };
    const res = await server.inject(request2);
    licenceData = JSON.parse(res.payload);
  });

  lab.test('Test licence number', async () => {
    Code.expect(licenceData.LIC_NO).to.equal('12/34/56/78');
  });

  lab.test('Test start date', async () => {
    Code.expect(licenceData.ORIG_EFF_DATE).to.equal('01/01/2018');
  });

  lab.test('Test start date', async () => {
    Code.expect(licenceData.ORIG_EFF_DATE).to.equal('01/01/2018');
  });

  lab.test('Test expiry date', async () => {
    Code.expect(licenceData.EXPIRY_DATE).to.equal('01/01/2020');
  });

  lab.test('Test current vertsion', async () => {
    Code.expect(licenceData.data.current_version.licence.STATUS).to.equal('CURR');
  });

  lab.test('Test party count', async () => {
    Code.expect(licenceData.data.current_version.licence.party.length).to.equal(1);
  });

  lab.test('Test party details', async () => {
    const [party] = licenceData.data.current_version.licence.party;
    Code.expect(party.APAR_TYPE).to.equal('PER');
    Code.expect(party.FORENAME).to.equal('John');
    Code.expect(party.NAME).to.equal('Doe');
  });

  lab.test('Test address', async () => {
    const {address} = licenceData.data.current_version;
    Code.expect(address.ADDR_LINE_1).to.equal('Daisy cow farm');
  });

  lab.test('Test purpose count', async () => {
    const {purposes} = licenceData.data.current_version;
    Code.expect(purposes.length).to.equal(1);
  });

  lab.test('Test purpose', async () => {
    const {purpose_primary, purpose_secondary, purpose_tertiary} = licenceData.data.current_version.purposes[0].purpose[0];
    Code.expect(purpose_primary.CODE).to.equal('A');
    Code.expect(purpose_secondary.CODE).to.equal('AGR');
    Code.expect(purpose_tertiary.CODE).to.equal('140');
  });

  lab.test('Test point count', async () => {
    const {purposePoints} = licenceData.data.current_version.purposes[0];
    Code.expect(purposePoints.length).to.equal(1);
  });

  lab.test('Test point', async () => {
    const [point] = licenceData.data.current_version.purposes[0].purposePoints;
    Code.expect(point.means_of_abstraction.CODE).to.equal('UNP');
    Code.expect(point.point_detail.NGR1_SHEET).to.equal('SP');
    Code.expect(point.point_detail.NGR1_EAST).to.equal('123');
    Code.expect(point.point_detail.NGR1_NORTH).to.equal('456');
    Code.expect(point.point_detail.LOCAL_NAME).to.equal('TEST BOREHOLE');
    Code.expect(point.point_source.CODE).to.equal('GWSOS');
  });

  lab.test('Test agreement', async () => {
    const [agreement] = licenceData.data.current_version.purposes[0].licenceAgreements;
    Code.expect(agreement.EFF_ST_DATE).to.equal('01/01/2018');
  });

  lab.test('Test condition count', async () => {
    const conditions = licenceData.data.current_version.purposes[0].licenceConditions;
    Code.expect(conditions.length).to.equal(1);
  });

  lab.test('Test condition', async () => {
    const [condition] = licenceData.data.current_version.purposes[0].licenceConditions;
    Code.expect(condition.ACIN_CODE).to.equal('CES');
    Code.expect(condition.ACIN_SUBCODE).to.equal('FLOW');
    Code.expect(condition.PARAM1).to.equal('AUTHOR');
    Code.expect(condition.PARAM2).to.equal('17.5');
  });

  lab.test('Test role count', async () => {
    const { roles } = licenceData.data;
    Code.expect(roles.length).to.equal(1);
  });

  lab.test('Test role detail', async () => {
    const [role] = licenceData.data.roles;
    const {role_detail, role_type, role_party} = role;
    Code.expect(role_detail.ALRT_CODE).to.equal('LC');
    Code.expect(role_type.CODE).to.equal('LC');
    Code.expect(role_type.DESCR).to.equal('Licence contact');
    Code.expect(role_party.APAR_TYPE).to.equal('PER');
    Code.expect(role_party.NAME).to.equal('Doe');
    Code.expect(role_party.FORENAME).to.equal('John');
  });

  lab.test('Test role address', async () => {
    const [role] = licenceData.data.roles;
    const { role_address} = role;
    Code.expect(role_address.ADDR_LINE_1).to.equal('Daisy cow farm');
    Code.expect(role_address.ADDR_LINE_2).to.equal('Long road');
    Code.expect(role_address.TOWN).to.equal('Daisybury');
    Code.expect(role_address.COUNTY).to.equal('Testingshire');
    Code.expect(role_address.POSTCODE).to.equal('TT1 1TT');
  });
});
exports.lab = lab;
