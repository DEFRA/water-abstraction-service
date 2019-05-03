const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');

const { createDocumentsFilter } = require('../../../../src/modules/companies/lib/documents');

experiment('createDocumentsFilter', () => {
  const companyId = 'company_1';

  test('returns a filter object with the specified company entity ID', async () => {
    const result = createDocumentsFilter(companyId);
    expect(result).to.equal({
      company_entity_id: companyId
    });
  });
});
