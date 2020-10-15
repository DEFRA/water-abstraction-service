'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');

const Licence = require('../../../../src/lib/models/licence');
const ChargeVersion = require('../../../../src/lib/models/charge-version');
const ChargeVersionWorkflow = require('../../../../src/lib/models/charge-version-workflow');
const DateRange = require('../../../../src/lib/models/date-range');
const User = require('../../../../src/lib/models/user');
const Role = require('../../../../src/lib/models/role');
const Company = require('../../../../src/lib/models/company');

const apiMapper = require('../../../../src/modules/charge-versions/mappers/api-mapper');

experiment('modules/charge-versions/mappers/api-mapper', () => {
  experiment('.rowToAPIList', () => {
    let obj, result;

    beforeEach(async () => {
      const chargeVersionWorkflow = new ChargeVersionWorkflow(uuid());
      chargeVersionWorkflow.fromHash({
        createdBy: new User(123, 'mail@example.com'),
        status: 'review',
        approverComments: 'Pat on the back'
      });
      chargeVersionWorkflow.licence = new Licence();
      chargeVersionWorkflow.licence.licenceNumber = '01/123';
      chargeVersionWorkflow.chargeVersion = new ChargeVersion();
      chargeVersionWorkflow.chargeVersion.fromHash({
        dateRange: new DateRange('2019-01-01', null)
      });

      const licenceHolderRole = new Role();
      licenceHolderRole.company = new Company();
      licenceHolderRole.company.name = 'Test company';

      obj = { chargeVersionWorkflow, licenceHolderRole };

      result = apiMapper.rowToAPIList(obj);
    });

    test('maps to a flat object containing only the required properties', async () => {
      expect(result).to.equal({
        id: obj.chargeVersionWorkflow.id,
        licenceNumber: '01/123',
        startDate: '2019-01-01',
        createdBy: obj.chargeVersionWorkflow.createdBy,
        status: 'review',
        approverComments: 'Pat on the back',
        licenceHolder: 'Test company'
      });
    });
  });
});
