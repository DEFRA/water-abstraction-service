const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid').v4();

const licenceGaugingStations = require('../../../../src/lib/connectors/repos/licence-gauging-stations');
const { LicenceGaugingStations } = require('../../../../src/lib/connectors/bookshelf');
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers');

experiment('lib/connectors/repos/licence-gauging-stations', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'create').resolves({});
  });

  afterEach(async () => sandbox.restore());

  experiment('.create', () => {
    const data = {
      gaugingStationId: uuid(),
      licenceId: uuid(),
      licenceVersionPurposeConditionId: null,
      thresholdUnit: 'm',
      thresholdValue: 0,
      abstractionPeriod: null,
      restrictionType: 'level',
      alertType: 'reduce',
      source: 'wrls'
    };
    beforeEach(async () => {
      await licenceGaugingStations.create(data);
    });

    test('calls helpers .create() with the correct params', async () => {
      const [bookShelfModel, createdData] = helpers.create.lastCall.args;
      expect(bookShelfModel).to.equal(LicenceGaugingStations);
      expect(createdData).to.equal(data);
    });
  });
});
