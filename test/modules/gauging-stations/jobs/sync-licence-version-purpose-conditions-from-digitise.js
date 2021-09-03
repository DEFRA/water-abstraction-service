const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const config = require('../../../../config');
const sinon = require('sinon');
const moment = require('moment');
const sandbox = sinon.createSandbox();

const permitsConnector = require('../../../../src/lib/connectors/permit');

const syncLVPCFromDigitseJob = require('../../../../src/modules/gauging-stations/jobs/sync-licence-version-purpose-conditions-from-digitise');
const LVPCService = require('../../../../src/lib/services/licence-version-purpose-conditions');
experiment('.createMessage', () => {
  let message;

  beforeEach(async () => {
    message = syncLVPCFromDigitseJob.createMessage();
  });

  test('creates a message with the expected name', async () => {
    expect(message[0]).to.equal('gauging-stations.copy-lvpc-from-digitise');
  });

  test('the message has no associated job data', async () => {
    expect(message[1]).to.equal({});
  });

  test('the message has a config object calling for repeats', async () => {
    expect(message[2]).to.equal({
      jobId: `gauging-stations.copy-lvpc-from-digitise.${moment().format('YYYYMMDD')}`,
      repeat: {
        every: config.import.digitiseToLVPCSyncFrequencyInMS
      }
    });
  });
});

experiment('.handler', () => {
  const email = 'test@email.com';
  const licences = [
    {
      licence_id: '123456',
      licence_ref: 'test/ref/01',
      licence_data_value: {
        status: 'Approved',
        actions: [
          {
            type: 'add.data',
            payload: {
              id: '6e44d0a2-b13c-48cd-a728-6e039111459f',
              user: {
                id: 15,
                email
              },
              schema: '/wr22/2.5',
              timestamp: 1628864543635,
              issueNumber: 3,
              incrementNumber: 0
            }
          },
          {
            type: 'edit.data',
            payload: {
              id: '6e44d0a2-b13c-48cd-a728-6e039111459f',
              data: {
                max_rate: 312,
                max_rate_unit: 'Ml/d',
                nald_condition: {
                  id: 'nald://conditions/1/256795',
                  value: '256795: Flow cessation condition'
                },
                gauging_station: {
                  id: '336083e1-68fd-491e-9dca-70e13af19655',
                  value: 'St Ives'
                },
                water_body_name: {
                  id: '6a02ac67-b491-3256-b369-fcd69a0dccb5',
                  name: 'Abermule',
                  value: 'Abermule (AP3, Abermule)',
                  waterBodyId: 'AP3, Abermule'
                }
              },
              user: {
                id: 15,
                email
              },
              timestamp: 1628864543732
            }
          },
          {
            type: 'set.status',
            payload: {
              user: {
                id: 15,
                email
              },
              notes: null,
              status: 'Approved',
              timestamp: 1628864547104
            }
          }
        ],
        lastEdit: {
          user: {
            id: 15,
            email
          },
          timestamp: 1628864547104
        }
      }
    },
    {
      licence_id: '123456',
      licence_ref: 'test/ref/01',
      licence_data_value: {
        status: 'test-status'
      }
    }

  ];

  experiment('When a licence has been approved in digitse with a new purpose condition on the licence', () => {
    beforeEach(async () => {
      const lvpc = { licenceVersionPurposeConditionId: 'lvpc-id', licenceVersionPurposeId: 'lvp-id' };
      sandbox.stub(LVPCService, 'getLicenceVersionConditionByPartialExternalId').resolves(lvpc);
      sandbox.stub(LVPCService, 'getLicenceVersionConditionType').resolves({ licenceVersionPurposeConditionTypeId: 'test-lvpc-type-id' });
      sandbox.stub(LVPCService, 'upsertByExternalId').resolves({});
      sandbox.stub(permitsConnector.licences, 'getWaterLicencesThatHaveConditionsThatNeedToBeCopiedFromDigitise').resolves(licences);
      sandbox.stub(permitsConnector.licences, 'updateOne').resolves();
      sandbox.stub(permitsConnector.licences, 'getWaterLicence').resolves({
        licence_data_value: {
          data: {
            current_version: {
              1: 1
            }
          }
        }
      });
      await syncLVPCFromDigitseJob.handler();
    });

    afterEach(async () => sandbox.restore());

    test('add the licence version purpose condition to the licence', async () => {
      const args = LVPCService.upsertByExternalId.lastCall.args;
      expect(args[0]).to.equal('digitise:123456:lvpc-id:/wr22/2.5');
      expect(args[1]).to.equal('lvp-id');
      expect(args[2].licenceVersionPurposeConditionTypeId).to.equal('test-lvpc-type-id');
      expect(args[4]).to.equal('digitise');
    });

    test('updates the licence record in the permits schema', async () => {
      const args = permitsConnector.licences.updateOne.lastCall.args;
      const date = moment(args[1].date_licence_version_purpose_conditions_last_copied);
      expect(args[0]).to.equal('123456');
      expect(Object.keys(args[1])).to.equal(['date_licence_version_purpose_conditions_last_copied']);
      expect(date.isValid()).to.be.true();
    });
  });
});
