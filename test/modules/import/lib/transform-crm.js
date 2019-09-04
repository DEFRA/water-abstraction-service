const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const moment = require('moment');

const transformCrm = require('../../../../src/modules/import/transform-crm');

experiment('modules/import/lib/transform-crm', () => {
  experiment('.buildCRMMetadata', () => {
    test('returns a default object if the current version is falsy', async () => {
      const meta = transformCrm.buildCRMMetadata();
      expect(meta).to.equal({
        IsCurrent: false
      });
    });

    test('IsCurrent is true if the currentVersion is supplied', async () => {
      const currentVersion = {
        expiry_date: moment().add(2, 'months').format('YYYYMMDD'),
        version_effective_date: moment().subtract(1, 'month').format('YYYYMMDD'),
        party: {},
        address: {}
      };

      const meta = transformCrm.buildCRMMetadata(currentVersion);
      expect(meta.IsCurrent).to.be.true();
      expect(meta.Expires).to.equal(currentVersion.expiry_date);
      expect(meta.Modified).to.equal(currentVersion.version_effective_date);
    });
  });

  experiment('.contactsFormatter', () => {
    experiment('when the current version is null', () => {
      test('an empty array is returned', async () => {
        const contacts = transformCrm.contactsFormatter(null, []);
        expect(contacts).to.equal([]);
      });
    });

    experiment('when the current version is present', () => {
      let currentVersion;
      let roles;

      beforeEach(async () => {
        currentVersion = {
          ACON_APAR_ID: 1,
          ACON_AADD_ID: 2,
          parties: [
            {
              ID: 1,
              APAR_TYPE: 'PER',
              FORENAME: 'forename',
              NAME: 'name',
              contacts: [
                {
                  AADD_ID: 2,
                  party_address: {
                    ADDR_LINE1: 'test-1'
                  }
                }
              ]
            }
          ]
        };

        roles = [
          {
            role_type: {
              DESCR: 'For Sentance Casing'
            },
            role_address: {
              ADDR_LINE1: 'test-1'
            }
          }
        ];
      });

      test('the licence holder is added to the contacts', async () => {
        const contacts = transformCrm.contactsFormatter(currentVersion, roles);
        const licenceHolder = contacts[0];
        expect(licenceHolder.role).to.equal('Licence holder');
        expect(licenceHolder.type).to.equal('Person');
        expect(licenceHolder.forename).to.equal('forename');
        expect(licenceHolder.name).to.equal('name');
        expect(licenceHolder.addressLine1).to.equal('test-1');
      });

      test('the roles are added after the licence holder', async () => {
        const contacts = transformCrm.contactsFormatter(currentVersion, roles);
        const role = contacts[1];

        expect(role.role).to.equal('For sentance casing');
        expect(role.type).to.equal('Person');
        expect(role.forename).to.equal('forename');
        expect(role.name).to.equal('name');
        expect(role.addressLine1).to.equal('test-1');
      });
    });
  });
});
