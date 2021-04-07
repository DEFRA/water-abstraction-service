const ACCEPTANCE_TEST_SOURCE = 'acceptance-test-setup';
const { bookshelf } = require('../../../lib/connectors/bookshelf');

const licencesConnector = require('../../../lib/connectors/repos/licences');
const regionsConnector = require('../../../lib/connectors/repos/regions');

const deleteLicencesQuery = `
    delete from
    water.licences
    where licence_ref IN (SELECT system_external_id FROM crm.document_header
    where metadata->>'dataType' = '${ACCEPTANCE_TEST_SOURCE}')
    OR is_test = true;
    `;

const deleteLicences = async () => bookshelf.knex.raw(deleteLicencesQuery);

const createLicence = async (companyId, licenceId, licenceRef) => {
  const regions = await regionsConnector.find();
  return licencesConnector.create(
    licenceRef,
    regions.find(x => x.naldRegionId === 6).regionId,
    new Date().toJSON().slice(0, 10),
    null, {
      historicalAreaCode: 'SAAR',
      regionalChargeArea: 'Southern'
    },
    true,
    true);
};

exports.create = createLicence;
exports.delete = deleteLicences;
