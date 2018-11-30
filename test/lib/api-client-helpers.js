const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');
const sinon = require('sinon');

const { returns } = require('../../src/lib/connectors/returns');
const { findAllPages, throwIfError } = require('../../src/lib/api-client-helpers');

lab.experiment('Test findAllPages', () => {
  lab.before(async () => {
    sinon.stub(returns, 'findMany').resolves({
      error: null,
      pagination: {
        page: 1,
        perPage: 3,
        pageCount: 3,
        totalRows: 9
      },
      data: [
        {
          id: 'a'
        },
        {
          id: 'b'
        },
        {
          id: 'c'
        }
      ]
    });
  });

  lab.after(async () => {
    returns.findMany.restore();
  });

  lab.test('It should load all pages of a result set', async () => {
    const data = await findAllPages(returns, {});
    expect(data.length).to.equal(9);
    const ids = data.map(row => row.id);
    expect(ids).to.equal(['a', 'b', 'c', 'a', 'b', 'c', 'a', 'b', 'c']);
  });

  lab.test('It should throw an error if API call returns error', async () => {
    returns.findMany.resolves({
      error: 'Some DB Error',
      data: null
    });

    expect(findAllPages(returns, {})).to.reject();
  });
});

lab.experiment('Test throwIfError', () => {
  lab.test('It should return if error is null', async () => {
    expect(throwIfError(null)).to.equal(undefined);
  });

  lab.test('It should throw error if error is object', async () => {
    const error = {
      'name': 'ValidationError',
      'message': 'ValidationError: Some message'
    };
    const func = () => {
      throwIfError(error);
    };
    expect(func).to.throw('API error: {"name":"ValidationError","message":"ValidationError: Some message"}');
  });
});

exports.lab = lab;
