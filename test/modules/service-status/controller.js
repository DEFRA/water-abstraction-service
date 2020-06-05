const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const idmConnector = require('../../../src/lib/connectors/idm');
const crmServiceVersionConnector = require('../../../src/lib/connectors/crm/service-version');
const crmDocumentsConnector = require('../../../src/lib/connectors/crm/documents');
const { kpiClient: crmKpiConnector } = require('../../../src/lib/connectors/crm/kpis');
const { verificationsClient: crmVerificationsConnector } = require('../../../src/lib/connectors/crm/verifications');
const permitConnector = require('../../../src/lib/connectors/permit');
const returnsConnector = require('../../../src/lib/connectors/returns');
const importConnector = require('../../../src/lib/connectors/import');
const importJobsConnector = require('../../../src/lib/connectors/import/jobs');

const controller = require('../../../src/modules/service-status/controller');
const pkg = require('../../../package.json');

experiment('modules/service-status/controller', () => {
  beforeEach(async () => {
    sandbox.stub(idmConnector.usersClient, 'findMany').resolves({
      pagination: {
        totalRows: 1
      }
    });

    sandbox.stub(idmConnector, 'getServiceVersion').resolves('1.1.1');
    sandbox.stub(crmServiceVersionConnector, 'getServiceVersion').resolves('2.2.2');
    sandbox.stub(permitConnector, 'getServiceVersion').resolves('3.3.3');
    sandbox.stub(returnsConnector, 'getServiceVersion').resolves('4.4.4');
    sandbox.stub(importConnector, 'getServiceVersion').resolves('5.5.5');

    sandbox.stub(idmConnector.kpiClient, 'findMany').resolves({
      data: [
        { datapoint: 'registrations_not_completed', dimension: 'external', measure: '51' },
        { datapoint: 'registrations_not_completed', dimension: 'internal', measure: '4' },
        { datapoint: 'registrations_completed', dimension: 'internal', measure: '1' },
        { datapoint: 'registrations_completed', dimension: 'external', measure: '23' }
      ]
    });

    sandbox.stub(crmDocumentsConnector, 'findMany').resolves({
      pagination: {
        totalRows: 2
      }
    });

    sandbox.stub(crmKpiConnector, 'findMany').resolves({
      data: [
        { datapoint: 'renamed_licences', value: '2', description: 'Licences given a custom name (includes Severn Trent)' },
        { datapoint: 'users_with_multiple_verifications', value: '6', description: 'Users who have verified multiple batches of licences' },
        { datapoint: 'verifications_completed_last_month', value: '8', description: 'Verification flows completed last calender month' },
        { datapoint: 'verifications_started_this_month', value: '6', description: 'Verification flows started this calender month' },
        { datapoint: 'verifications_completed_this_month', value: '4', description: 'Verification flows completed this calender month' },
        { datapoint: 'additional_access_grantees', value: '19', description: 'Users granted access by another user' },
        { datapoint: 'verifications_started_last_month', value: '8', description: 'Verification flows started last calender month' }
      ]
    });

    sandbox.stub(crmVerificationsConnector, 'findMany').resolves({
      pagination: {
        totalRows: 3
      }
    });

    sandbox.stub(permitConnector.licences, 'findMany').resolves({
      pagination: {
        totalRows: 4
      }
    });

    sandbox.stub(importJobsConnector, 'getSummary').resolves([
      { name: 'job-name', state: 'completed', count: 10 },
      { name: 'job-name', state: 'active', count: 3 }
    ]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getStatus', () => {
    let data;

    beforeEach(async () => {
      ({ data } = await controller.getStatus());
    });

    test('contains the expected water service version', async () => {
      expect(data.versions.waterService).to.equal(pkg.version);
    });

    test('contains the expected idm version', async () => {
      expect(data.versions.idm).to.equal('1.1.1');
    });

    test('contains the expected crm version', async () => {
      expect(data.versions.crm).to.equal('2.2.2');
    });

    test('contains the expected permit version', async () => {
      expect(data.versions.permit).to.equal('3.3.3');
    });

    test('contains the expected returns version', async () => {
      expect(data.versions.returns).to.equal('4.4.4');
    });

    test('contains the expected import version', async () => {
      expect(data.versions.import).to.equal('5.5.5');
    });

    test('returns the total number of idm users', async () => {
      expect(data.idm.users).to.equal(1);
    });

    test('extracts the expected idm KPI data', async () => {
      expect(data.idm.externalRegistrationsNotCompleted).to.equal('51');
      expect(data.idm.externalRegistrationsCompleted).to.equal('23');
      expect(data.idm.internalRegistrationsNotCompleted).to.equal('4');
      expect(data.idm.internalRegistrationsCompleted).to.equal('1');
    });

    test('returns the total number of crm documents', async () => {
      expect(data.crm.documents).to.equal(2);
    });

    test('returns the total number of crm verifications', async () => {
      expect(data.crm.verifications).to.equal(3);
    });

    test('extracts the expected CRM KPI data', async () => {
      expect(data.crm.renamedLicences).to.equal('2');
      expect(data.crm.usersWithMultipleVerifications).to.equal('6');
      expect(data.crm.verificationsCompletedLastMonth).to.equal('8');
      expect(data.crm.verificationsStartedThisMonth).to.equal('6');
      expect(data.crm.verificationsCompletedThisMonth).to.equal('4');
      expect(data.crm.additionalAccessGrantees).to.equal('19');
      expect(data.crm.verificationsStartedLastMonth).to.equal('8');
    });

    test('returns the total number of permits verifications', async () => {
      expect(data.permitRepo.permits).to.equal(4);
    });

    test('contains a summary of the jobs in the import service', async () => {
      expect(data.import.jobs).to.equal({
        summary: [
          { name: 'job-name', state: 'completed', count: 10 },
          { name: 'job-name', state: 'active', count: 3 }
        ]
      });
    });
  });
});
