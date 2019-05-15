const { before, experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');
const server = require('../../index.js');
const licenceCreator = require('../../scripts/licence-creator/index.js');
const { copyTestFiles } = require('../../src/modules/import/extract.js');

let licenceData;

experiment('Test NALD import', () => {
  before(async () => {
    // Generate dummy NALD data
    await licenceCreator();
    await copyTestFiles();

    // Load dummy licence JSON
    const request2 = {
      method: 'GET',
      url: '/water/1.0/nald/licence?filter=' + JSON.stringify({ licenceNumber: '12/34/56/78' }),
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };
    const res = await server.inject(request2);
    licenceData = JSON.parse(res.payload);
  });

  test('Test licence number', async () => {
    expect(licenceData.LIC_NO).to.equal('12/34/56/78');
  });

  test('Test start date', async () => {
    expect(licenceData.ORIG_EFF_DATE).to.equal('01/01/2018');
  });

  test('Test start date', async () => {
    expect(licenceData.ORIG_EFF_DATE).to.equal('01/01/2018');
  });

  test('Test expiry date', async () => {
    expect(licenceData.EXPIRY_DATE).to.equal('01/01/2020');
  });

  test('Test current vertsion', async () => {
    expect(licenceData.data.current_version.licence.STATUS).to.equal('CURR');
  });

  test('Test party count', async () => {
    expect(licenceData.data.current_version.licence.party.length).to.equal(1);
  });

  test('Test party details', async () => {
    const [party] = licenceData.data.current_version.licence.party;
    expect(party.APAR_TYPE).to.equal('PER');
    expect(party.FORENAME).to.equal('John');
    expect(party.NAME).to.equal('Doe');
  });

  test('Test address', async () => {
    const { address } = licenceData.data.current_version;
    expect(address.ADDR_LINE_1).to.equal('Daisy cow farm');
  });

  test('Test purpose count', async () => {
    const { purposes } = licenceData.data.current_version;
    expect(purposes.length).to.equal(1);
  });

  test('Test purpose', async () => {
    const purpose = licenceData.data.current_version.purposes[0].purpose[0];
    expect(purpose.purpose_primary.CODE).to.equal('A');
    expect(purpose.purpose_secondary.CODE).to.equal('AGR');
    expect(purpose.purpose_tertiary.CODE).to.equal('140');
  });

  test('Test point count', async () => {
    const { purposePoints } = licenceData.data.current_version.purposes[0];
    expect(purposePoints.length).to.equal(1);
  });

  test('Test point', async () => {
    const [point] = licenceData.data.current_version.purposes[0].purposePoints;
    expect(point.means_of_abstraction.CODE).to.equal('UNP');
    expect(point.point_detail.NGR1_SHEET).to.equal('SP');
    expect(point.point_detail.NGR1_EAST).to.equal('123');
    expect(point.point_detail.NGR1_NORTH).to.equal('456');
    expect(point.point_detail.LOCAL_NAME).to.equal('TEST BOREHOLE');
    expect(point.point_source.CODE).to.equal('GWSOS');
  });

  test('Test agreement', async () => {
    const [agreement] = licenceData.data.current_version.purposes[0].licenceAgreements;
    expect(agreement.EFF_ST_DATE).to.equal('01/01/2018');
  });

  test('Test condition count', async () => {
    const conditions = licenceData.data.current_version.purposes[0].licenceConditions;
    expect(conditions.length).to.equal(1);
  });

  test('Test condition', async () => {
    const [condition] = licenceData.data.current_version.purposes[0].licenceConditions;
    expect(condition.ACIN_CODE).to.equal('CES');
    expect(condition.ACIN_SUBCODE).to.equal('FLOW');
    expect(condition.PARAM1).to.equal('AUTHOR');
    expect(condition.PARAM2).to.equal('17.5');
  });

  test('Test role count', async () => {
    const { roles } = licenceData.data;
    expect(roles.length).to.equal(1);
  });

  test('Test role detail', async () => {
    const [role] = licenceData.data.roles;
    const { role_detail: roleDetail, role_type: roleType, role_party: roleParty } = role;
    expect(roleDetail.ALRT_CODE).to.equal('LC');
    expect(roleType.CODE).to.equal('LC');
    expect(roleType.DESCR).to.equal('Licence contact');
    expect(roleParty.APAR_TYPE).to.equal('PER');
    expect(roleParty.NAME).to.equal('Doe');
    expect(roleParty.FORENAME).to.equal('John');
  });

  test('Test role address', async () => {
    const [role] = licenceData.data.roles;
    const { role_address: roleAddress } = role;
    expect(roleAddress.ADDR_LINE_1).to.equal('Daisy cow farm');
    expect(roleAddress.ADDR_LINE_2).to.equal('Long road');
    expect(roleAddress.TOWN).to.equal('Daisybury');
    expect(roleAddress.COUNTY).to.equal('Testingshire');
    expect(roleAddress.POSTCODE).to.equal('TT1 1TT');
  });
});
