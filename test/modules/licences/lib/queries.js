const sinon = require('sinon');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const uuid = require('uuid/v4');

const { getNotificationsForLicence, getInvoicesForLicence } = require('../../../../src/modules/licences/lib/queries');
const { pool } = require('../../../../src/lib/connectors/db');

experiment('getNotificationsForLicence', () => {
  beforeEach(async () => {
    sinon.stub(pool, 'query').resolves({ rows: [] });
  });

  afterEach(async () => {
    pool.query.restore();
  });

  test('It should create a DB query with correct arguments', async () => {
    const licenceRef = '01/234';

    await getNotificationsForLicence(licenceRef);

    const [query, params] = pool.query.firstCall.args;

    expect(query).to.be.a.string();
    expect(params).to.equal(['"' + licenceRef + '"']);
  });
});

experiment('getInvoicesForLicence', () => {
  beforeEach(async () => {
    sinon.stub(pool, 'query').resolves({ rows: [] });
  });

  afterEach(async () => {
    pool.query.restore();
  });

  test('It should create a DB query with correct arguments', async () => {
    const licenceId = uuid();

    await getInvoicesForLicence(licenceId);

    const [query, params] = pool.query.firstCall.args;

    expect(query).to.be.a.string();
    expect(params).to.equal([licenceId]);
  });
});
