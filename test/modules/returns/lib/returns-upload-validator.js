const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');
const { omit } = require('lodash');
const { experiment, test, afterEach, beforeEach } = exports.lab = require('@hapi/lab').script();
const returnsUploadValidator = require('../../../../src/modules/returns/lib/returns-upload-validator');

const permit = require('../../../../src/lib/connectors/permit');
const returns = require('../../../../src/lib/connectors/returns');
const documents = require('../../../../src/lib/connectors/crm/documents');

const data = require('./data/returns-upload-validator.js');

experiment('batchProcess', () => {
  const data = [0, 1, 2, 3];

  test('It should process an array of data in batches', async () => {
    const iteratee = sinon.spy();

    await returnsUploadValidator.batchProcess(data, 2, iteratee, 'a', 'b');

    expect(iteratee.callCount).to.equal(2);
    expect(iteratee.firstCall.args).to.equal([[0, 1], 'a', 'b']);
    expect(iteratee.secondCall.args).to.equal([[2, 3], 'a', 'b']);
  });

  test('It should combine batches of results to a single array', async () => {
    const iteratee = async (arr) => arr.map(value => value + 1);
    const result = await returnsUploadValidator.batchProcess(data, 2, iteratee);
    expect(result).to.equal([1, 2, 3, 4]);
  });
});

experiment('getDocuments', () => {
  beforeEach(async () => {
    sandbox.stub(documents, 'findAll').resolves(data.documents);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('it should call the CRM API with correct arguments', async () => {
    await returnsUploadValidator.getDocuments(data.upload);
    const [filter, sort, columns] = documents.findAll.firstCall.args;
    expect(filter).to.equal({
      system_external_id: {
        $in: ['01/234', '01/ABC', '05/678', '06/890']
      },
      'metadata->>IsCurrent': { $ne: 'false' }
    });
    expect(sort).to.equal(null);
    expect(columns).to.equal(['system_external_id', 'company_entity_id']);
  });

  test('it should return data from CRM documents call', async () => {
    const result = await returnsUploadValidator.getDocuments(data.upload);
    expect(result).to.equal(data.documents);
  });
});

experiment('validate', () => {
  beforeEach(async () => {
    sandbox.stub(documents, 'findAll').resolves(data.documents);
    sandbox.stub(permit.licences, 'findAll').resolves(data.licences);
    sandbox.stub(returns.returns, 'findAll').resolves(data.returns);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('fails validation if a current CRM document cannot be found', async () => {
    const { ERR_LICENCE_NOT_FOUND } = returnsUploadValidator.uploadErrors;
    const [{ errors }] = await returnsUploadValidator.validate([data.upload[0]], data.companyId);
    expect(errors).to.equal([ERR_LICENCE_NOT_FOUND]);
  });

  test('fails validation if CRM document company does not match user company', async () => {
    const { ERR_PERMISSION } = returnsUploadValidator.uploadErrors;
    const [{ errors }] = await returnsUploadValidator.validate([data.upload[1]], data.companyId);
    expect(errors).to.equal([ERR_PERMISSION]);
  });

  test('fails validation if the submitted return ID is not found', async () => {
    const { ERR_NOT_FOUND } = returnsUploadValidator.uploadErrors;
    const [{ errors }] = await returnsUploadValidator.validate([data.upload[2]], data.companyId);
    expect(errors).to.equal([ERR_NOT_FOUND]);
  });

  test('fails validation if the submitted return does not have due status', async () => {
    const { ERR_NOT_DUE } = returnsUploadValidator.uploadErrors;
    const [{ errors }] = await returnsUploadValidator.validate([data.upload[3]], data.companyId);
    expect(errors).to.equal([ERR_NOT_DUE]);
  });

  test('passes validation if data is OK', async () => {
    const [{ errors }] = await returnsUploadValidator.validate([data.upload[4]], data.companyId);
    expect(errors).to.equal([]);
  });

  test('fails validation if return lines do not match those expected', async () => {
    const { ERR_LINES } = returnsUploadValidator.uploadErrors;
    const [{ errors }] = await returnsUploadValidator.validate([data.upload[5]], data.companyId);
    expect(errors).to.equal([ERR_LINES]);
  });

  test('it should fail validation if it doesnt match the Joi schema', async () => {
    const { ERR_SCHEMA } = returnsUploadValidator.uploadErrors;
    const upload = [omit(data.upload[4], 'isNil')];
    const [{ errors }] = await returnsUploadValidator.validate(upload, data.companyId);
    expect(errors).to.equal([ERR_SCHEMA]);
  });
});

experiment('validateReturnlines', () => {
  test('it should return true for a nil return', async () => {
    const result = returnsUploadValidator.validateReturnlines(data.upload[0]);
    expect(result).to.equal(true);
  });

  test('it should return true if the expected lines are present', async () => {
    const ret = {
      startDate: '2018-12-01',
      endDate: '2019-01-31',
      frequency: 'month',
      lines: [{
        startDate: '2019-01-01',
        endDate: '2019-01-31'
      }, {
        startDate: '2018-12-01',
        endDate: '2018-12-31'
      }]
    };
    const result = returnsUploadValidator.validateReturnlines(ret);
    expect(result).to.equal(true);
  });

  test('it should return false if the expected lines are not present', async () => {
    const ret = {
      startDate: '2018-12-01',
      endDate: '2019-01-31',
      frequency: 'month',
      lines: [{
        startDate: '2019-01-01',
        endDate: '2019-01-31'
      }]
    };
    const result = returnsUploadValidator.validateReturnlines(ret);
    expect(result).to.equal(false);
  });
});
