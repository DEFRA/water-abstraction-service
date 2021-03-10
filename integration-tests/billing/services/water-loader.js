'use strict';

const FixtureLoader = require('./fixture-loader/FixtureLoader');
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter');
const { createScheduledNotification } = require('../../../src/lib/services/scheduled-notifications');
const ScheduledNotification = require('../../../src/lib/models/scheduled-notification');
const chargeVersionWorkflowsConnector = require('../../../src/lib/connectors/repos/charge-version-workflows');
const licencesConnector = require('../../../src/lib/connectors/repos/licences');
const licenceVersionsConnector = require('../../../src/lib/connectors/repos/licence-versions');
const returnVersionsConnector = require('../../../src/lib/connectors/repos/return-versions');
const returnRequirementsConnector = require('../../../src/lib/connectors/repos/return-requirements');
const returnRequirementPurposesConnector = require('../../../src/lib/connectors/repos/return-requirement-purposes');
const regionsConnector = require('../../../src/lib/connectors/repos/regions');
const purposeUses = require('../../../src/lib/connectors/repos/purpose-uses');
const primaryPurposes = require('../../../src/lib/connectors/repos/purpose-primary');
const secondaryPurposes = require('../../../src/lib/connectors/repos/purpose-secondary');

// Resolve path to fixtures directory
const path = require('path');
const dir = path.resolve(__dirname, '../fixtures');

const create = (sharedData) => {
  // Create Returns service fixture loader
  const asyncAdapter = new AsyncAdapter();

  asyncAdapter
    .add('ScheduledNotification', async (body) => {
      const notification = new ScheduledNotification();
      Object.keys(body).map(key => {
        notification[key] = body[key];
      });

      return createScheduledNotification(notification);
    })
    .add('Licence', async (body) => {
      const regions = await regionsConnector.find();
      return licencesConnector.create(
        body.licenceRef,
        regions.find(x => x.naldRegionId === 6).regionId,
        body.startDate,
        null, {
          historicalAreaCode: 'SAAR',
          regionalChargeArea: 'Southern'
        },
        true,
        true);
    })
    .add('LicenceVersion', body => licenceVersionsConnector.create(body))
    .add('ChargeVersionWorkflow', body => chargeVersionWorkflowsConnector.create(body))
    .add('PrimaryPurpose', async body => {
      const exists = await primaryPurposes.findOneByLegacyId(body.legacy_id);
      if (exists) {
        return exists;
      } else {
        return primaryPurposes.create(body);
      }
    })
    .add('SecondaryPurpose', async body => {
      const exists = await secondaryPurposes.findOneByLegacyId(body.legacy_id);
      if (exists) {
        return exists;
      } else {
        return secondaryPurposes.create(body);
      }
    })
    .add('PurposeUse', async body => {
      const exists = await purposeUses.findOneByLegacyId(body.legacy_id);
      if (exists) {
        return exists;
      } else {
        return primaryPurposes.create(body);
      }
    })
    .add('ReturnVersion', body => returnVersionsConnector.create(body))
    .add('ReturnRequirement', body => returnRequirementsConnector.create(body))
    .add('ReturnRequirementPurpose', body => returnRequirementPurposesConnector.create(body));

  return new FixtureLoader(asyncAdapter, dir);
};

module.exports = create;
