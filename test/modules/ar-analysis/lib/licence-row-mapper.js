const Lab = require('@hapi/lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const moment = require('moment');

const {
  mapLicenceToTableRow
} = require('../../../../src/modules/ar-analysis/lib/licence-row-mapper');

const arLicence = require('./ar-licence.json');

const notReviewedFilter = action => action.payload.status !== 'In review';
const notApprovedFilter = action => action.payload.status !== 'Approved';
const noContactEditsFilter = action => !['edit.party', 'edit.address'].includes(action.type);

experiment('mapLicenceToTableRow', () => {
  const licenceRef = '01/123/456';
  const regionCode = 8;
  const row = mapLicenceToTableRow(regionCode, licenceRef, arLicence);

  test('It should contain the correct keys', async () => {
    const keys = Object.keys(row);
    expect(keys).to.equal([
      'licence_ref', 'status', 'region_code', 'start_date', 'review_date',
      'approved_date', 'contact_correct'
    ]);
  });

  test('The current status should match the AR licence', async () => {
    expect(row.status).to.equal(arLicence.status);
  });

  test('If the status is null, the licence is marked as In progress', async () => {
    const licence = {
      ...arLicence,
      status: null
    };
    const mapped = mapLicenceToTableRow(regionCode, licenceRef, licence);
    expect(mapped.status).to.equal('In progress');
  });

  test('The region code should match the function argument', async () => {
    expect(row.region_code).to.equal(regionCode);
  });

  test('The licence number should match the function argument', async () => {
    expect(row.licence_ref).to.equal(licenceRef);
  });

  test('The start date should be the first time the AR licence was edited', async () => {
    const ts = moment(1543486627483).format();
    expect(row.start_date).to.equal(ts);
  });

  test('The in review date should be the first time the AR licence was set to in review status', async () => {
    const ts = moment(1543486694660).format();
    expect(row.review_date).to.equal(ts);
  });

  test('The in review date should be null if AR licence has never been in review', async () => {
    const updated = {
      ...arLicence,
      actions: arLicence.actions.filter(notReviewedFilter)
    };
    const row = mapLicenceToTableRow(regionCode, licenceRef, updated);
    expect(row.review_date).to.equal(null);
  });

  test('The approved date should be the first time the AR licence was set to approved status', async () => {
    const ts = moment(1543486909677).format();
    expect(row.approved_date).to.equal(ts);
  });

  test('The approved date should be null if AR licence has never been in review', async () => {
    const updated = {
      ...arLicence,
      actions: arLicence.actions.filter(notApprovedFilter)
    };
    const row = mapLicenceToTableRow(regionCode, licenceRef, updated);
    expect(row.approved_date).to.equal(null);
  });

  test('The contact data is not correct if the party or address data has been edited', async () => {
    expect(row.contact_correct).to.equal(false);
  });

  test('The contact data is correct if no edits to party or address data', async () => {
    const updated = {
      ...arLicence,
      actions: arLicence.actions.filter(noContactEditsFilter)
    };
    const row = mapLicenceToTableRow(regionCode, licenceRef, updated);
    expect(row.contact_correct).to.equal(true);
  });
});
