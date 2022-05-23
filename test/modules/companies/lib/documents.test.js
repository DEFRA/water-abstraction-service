const Lab = require('@hapi/lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');

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
