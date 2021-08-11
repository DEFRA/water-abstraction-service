const acceptanceTestsConnector = require('../../../src/lib/connectors/idm/acceptance-tests');

exports.delete = () => acceptanceTestsConnector.deleteAcceptanceTestData();
