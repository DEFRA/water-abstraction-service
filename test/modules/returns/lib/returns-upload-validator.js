const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('code');
const { cloneDeep } = require('lodash');
const { experiment, test, afterEach, beforeEach } = exports.lab = require('lab').script();
const returnsUploadValidator = require('../../../../src/modules/returns/lib/returns-upload-validator');

const permit = require('../../../../src/lib/connectors/permit');
const returns = require('../../../../src/lib/connectors/returns');
const documents = require('../../../../src/lib/connectors/crm/documents');

const data = require('./data/returns-upload-validator.json');

experiment('batchProcess', () => {
  const data = [0, 1, 2, 3];

  test('It should process an array of data in batches', async () => {
    const iteratee = sinon.spy();

    await returnsUploadValidator.batchProcess(data, 2, iteratee, 'a', 'b');

    expect(iteratee.callCount).to.equal(2);
    expect(iteratee.firstCall.args).to.equal([ [ 0, 1 ], 'a', 'b' ]);
    expect(iteratee.secondCall.args).to.equal([[2, 3], 'a', 'b']);
  });

  test('It should combine batches of results to a single array', async () => {
    const iteratee = async (arr) => arr.map(value => value + 1);
    const result = await returnsUploadValidator.batchProcess(data, 2, iteratee);
    expect(result).to.equal([1, 2, 3, 4]);
  });
});

experiment('getDocumentsForCompany', () => {
  beforeEach(async () => {
    sandbox.stub(documents, 'findAll').resolves(data.documents);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('it should call the CRM API with correct arguments', async () => {
    await returnsUploadValidator.getDocumentsForCompany(data.companyId);
    const [filter, sort, columns] = documents.findAll.firstCall.args;
    expect(filter).to.equal({
      company_entity_id: data.companyId,
      'metadata->>IsCurrent': { $ne: 'false' }
    });
    expect(sort).to.equal(null);
    expect(columns).to.equal(['system_external_id']);
  });

  test('it should map CRM response to an array of licence numbers', async () => {
    const result = await returnsUploadValidator.getDocumentsForCompany(data.companyId);
    expect(result).to.equal([ '05/678', '06/890' ]);
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

  test('it should validate an array of uploaded returns correctly', async () => {
    const {
      ERR_PERMISSION,
      ERR_NOT_DUE,
      ERR_NOT_FOUND,
      ERR_LINES
    } = returnsUploadValidator.uploadErrors;

    const result = await returnsUploadValidator.validate(data.upload, data.companyId);
    expect(result[0].errors).to.equal([ERR_PERMISSION]);
    expect(result[1].errors).to.equal([ERR_NOT_FOUND]);
    expect(result[2].errors).to.equal([ERR_NOT_DUE]);
    expect(result[3].errors).to.equal([]);
    expect(result[4].errors).to.equal([ERR_LINES]);
  });

  test('it should fail validation if it doesnt match the Joi schema', async () => {
    const upload = cloneDeep(data.upload);
    delete upload[3].isNil;
    const result = await returnsUploadValidator.validate(upload, data.companyId);
    expect(result[3].errors).to.equal(['"isNil" is required']);
  });
});

experiment('hasExpectedReturnLines', () => {
  test('it should return true for a nil return', async () => {
    const result = returnsUploadValidator.hasExpectedReturnLines(data.upload[0]);
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
    const result = returnsUploadValidator.hasExpectedReturnLines(ret);
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
    const result = returnsUploadValidator.hasExpectedReturnLines(ret);
    expect(result).to.equal(false);
  });
});
