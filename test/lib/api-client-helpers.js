const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');
const sinon = require('sinon');

const { returns } = require('../../src/lib/connectors/returns');
const { findAllPages } = require('../../src/lib/api-client-helpers');

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

exports.lab = lab;
