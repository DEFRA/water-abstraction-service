'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const LicenceAgreementPurposeUse = require('../../../../src/lib/connectors/bookshelf/LicenceAgreementPurposeUse');

experiment('lib/connectors/bookshelf/LicenceAgreementPurposeUse', () => {
  let instance;

  beforeEach(async () => {
    instance = LicenceAgreementPurposeUse.forge();
    sandbox.stub(instance, 'belongsTo');
    sandbox.stub(instance, 'hasOne');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('uses the water.licence_agreement_purpose_uses table', async () => {
    expect(instance.tableName).to.equal('water.licence_agreement_purpose_uses');
  });

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('licence_agreement_purpose_use_id');
  });

  experiment('the .licenceAgreement() relation', () => {
    beforeEach(async () => {
      instance.licenceAgreement();
    });

    test('is a function', async () => {
      expect(instance.licenceAgreement).to.be.a.function();
    });

    test('calls .belongsTo with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.belongsTo.lastCall.args;
      expect(model).to.equal('LicenceAgreement');
      expect(foreignKey).to.equal('licence_agreement_id');
      expect(foreignKeyTarget).to.equal('licence_agreement_id');
    });
  });

  experiment('the .purposeUse() relation', () => {
    beforeEach(async () => {
      instance.purposeUse();
    });

    test('is a function', async () => {
      expect(instance.purposeUse).to.be.a.function();
    });

    test('calls .hasOne with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasOne.lastCall.args;
      expect(model).to.equal('PurposeUse');
      expect(foreignKey).to.equal('purpose_use_id');
      expect(foreignKeyTarget).to.equal('purpose_use_id');
    });
  });
});
