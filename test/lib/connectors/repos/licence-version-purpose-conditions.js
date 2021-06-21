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
const { bookshelf } = require('../../../../src/lib/connectors/bookshelf');
const queries = require('../../../../src/lib/connectors/repos/queries/licence-version-purpose-conditions');

experiment('lib/connectors/repos/licence-version-purpose-conditions', () => {
  let model, stub, result;

  beforeEach(async () => {
    sandbox.stub(helpers, 'findOne').returns();
    sandbox.stub(bookshelf.knex, 'raw').resolves();
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
      test('calls knex.raw with the right query', async () => {
        await testSubject.findManyByLicenceId('licence-id');
        expect(bookshelf.knex.raw.calledWith(queries.findLicenceVersionPurposeConditionsByLicenceId, { licenceId: 'licence-id' })).to.be.true();
      });
    });

    experiment('when a code is supplied', () => {
      test('calls knex.raw with the right query', async () => {
        await testSubject.findManyByLicenceId('licence-id', 'BOP');
        expect(bookshelf.knex.raw.calledWith(queries.findLicenceVersionPurposeConditionsByLicenceIdWithSpecificCode, { licenceId: 'licence-id', code: 'BOP' })).to.be.true();
      });
    });
  });
});
