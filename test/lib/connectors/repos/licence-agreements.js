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
const uuid = require('uuid');
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers');
const repos = require('../../../../src/lib/connectors/repos');
const { LicenceAgreement } = require('../../../../src/lib/connectors/bookshelf');
const moment = require('moment');

experiment('lib/connectors/repos/licence-agreements', () => {
  let model, stub, result;

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns([{ foo: 'bar' }])
    };
    stub = {
      fetchAll: sandbox.stub().resolves(model),
      fetch: sandbox.stub().resolves(model),
      save: sandbox.stub().resolves(model),
      query: sandbox.stub().returnsThis(),
      orderBy: sandbox.stub().returnsThis()
    };
    sandbox.stub(LicenceAgreement, 'forge').returns(stub);
    sandbox.stub(helpers, 'findOne').returns();
    sandbox.stub(helpers, 'update').returns();
    sandbox.stub(helpers, 'deleteOne').returns();
    sandbox.stub(helpers, 'create');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findByLicenceRef', () => {
    experiment('when searching for all regardless of financial agreement type', () => {
      beforeEach(async () => {
        result = await repos.licenceAgreements.findByLicenceRef('test-licence-number');
      });

      test('calls model.forge', async () => {
        expect(LicenceAgreement.forge.called).to.be.true();
      });

      test('queries by licence reference', async () => {
        expect(stub.query.calledWith(
          'where', 'licence_ref', 'test-licence-number'
        )).to.be.true();
      });

      test('queries by licence agreement', async () => {
        expect(stub.query.calledWith('whereIn')).to.equal(false);
      });

      test('sorts by start date', async () => {
        expect(stub.orderBy.calledWith(
          'start_date', 'asc'
        )).to.be.true();
      });

      test('calls .fetchAll() to retrieve all matching records', async () => {
        expect(stub.fetchAll.calledWith({
          withRelated: [
            'financialAgreementType'
          ]
        })).to.be.true();
      });

      test('calls .toJSON() on the collection', async () => {
        expect(model.toJSON.called).to.be.true();
      });

      test('resolves with an array', async () => {
        expect(result).to.be.an.array();
      });
    });

    experiment('when searching for specific financial agreement types', () => {
      beforeEach(async () => {
        result = await repos.licenceAgreements.findByLicenceRef('test-licence-number', ['test-agreement-a', 'test-agreement-b']);
      });

      test('calls model.forge', async () => {
        expect(LicenceAgreement.forge.called).to.be.true();
      });

      test('queries by licence reference', async () => {
        expect(stub.query.calledWith(
          'where', 'licence_ref', 'test-licence-number'
        )).to.be.true();
      });

      test('queries by licence agreement', async () => {
        expect(stub.query.calledWith(
          'whereIn', 'financial_agreement_type_id', ['test-agreement-a', 'test-agreement-b']
        )).to.be.true();
      });

      test('sorts by start date', async () => {
        expect(stub.orderBy.calledWith(
          'start_date', 'asc'
        )).to.be.true();
      });

      test('calls .fetchAll() to retrieve all matching records', async () => {
        expect(stub.fetchAll.called).to.be.true();
      });

      test('calls .toJSON() on the collection', async () => {
        expect(model.toJSON.called).to.be.true();
      });

      test('resolves with an array', async () => {
        expect(result).to.be.an.array();
      });
    });
  });

  experiment('.findOne', () => {
    beforeEach(async () => {
      result = await repos.licenceAgreements.findOne('test-id');
    });
    test('calls the findOne helper function with expected arguments', () => {
      const [model, key, id] = helpers.findOne.lastCall.args;
      expect(model).to.equal(LicenceAgreement);
      expect(key).to.equal('licenceAgreementId');
      expect(id).to.equal('test-id');
    });
  });

  experiment('.update', () => {
    const tempLicenceAgreementId = uuid();
    const changes = {
      endDate: '2020-01-01'
    };

    beforeEach(async () => {
      await repos.licenceAgreements.update(tempLicenceAgreementId, changes);
    });

    test('calls model.forge with correct data', async () => {
      const [params] = LicenceAgreement.forge.lastCall.args;
      expect(params).to.equal({ licence_agreement_id: tempLicenceAgreementId });
    });

    test('calls .save() on the model', async () => {
      expect(stub.save.calledWith(changes)).to.be.true();
    });
  });

  experiment('.softDeleteOne', () => {
    beforeEach(async () => {
      result = await repos.licenceAgreements.softDeleteOne('test-id');
    });

    test('calls the softDeleteOne function with expected arguments', () => {
      const [model, key, id, changes] = helpers.update.lastCall.args;
      expect(model).to.equal(LicenceAgreement);
      expect(key).to.equal('licenceAgreementId');
      expect(id).to.equal('test-id');
      expect(Object.keys(changes)).to.equal(['dateDeleted']);
      expect(moment(changes.dateDeleted).isValid()).to.be.true()
    });
  });

  experiment('.create', () => {
    test('delegates to the .create() helper function', async () => {
      const data = { startDate: '2020-01-01' };
      await repos.licenceAgreements.create(data);

      expect(helpers.create.calledWith(
        LicenceAgreement, data
      )).to.be.true();
    });
  });
});
