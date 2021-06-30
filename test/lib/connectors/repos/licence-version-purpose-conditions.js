'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers');
const testSubject = require('../../../../src/lib/connectors/repos/licence-version-purpose-conditions');
const raw = require('../../../../src/lib/connectors/repos/lib/raw');
const queries = require('../../../../src/lib/connectors/repos/queries/licence-version-purpose-conditions');

experiment('lib/connectors/repos/licence-version-purpose-conditions', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'findOne').returns();
    sandbox.stub(raw, 'multiRow').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  // findOneById
  experiment('.findOneById', () => {
    test('calls the helper method', async () => {
      await testSubject.findOneById('some-id');
      expect(helpers.findOne.called).to.be.true();
    });
  });

  // findManyByLicenceId
  experiment('.findManyByLicenceId', () => {
    experiment('when a code is not supplied', () => {
      test('calls the multiRow helper with the right query', async () => {
        await testSubject.findManyByLicenceId('licence-id');
        expect(raw.multiRow.calledWith(queries.findLicenceVersionPurposeConditionsByLicenceId, { licenceId: 'licence-id' })).to.be.true();
      });
    });

    experiment('when a code is supplied', () => {
      test('calls knex.raw with the right query', async () => {
        await testSubject.findManyByLicenceId('licence-id', 'BOP');
        expect(raw.multiRow.calledWith(queries.findLicenceVersionPurposeConditionsByLicenceIdWithSpecificCode, { licenceId: 'licence-id', code: 'BOP' })).to.be.true();
      });
    });
  });
});
