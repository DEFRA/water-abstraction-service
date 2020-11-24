'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChangeReason = require('../../../src/lib/models/change-reason');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';

experiment('lib/models/change-reason', () => {
  let changeReason;

  beforeEach(async () => {
    changeReason = new ChangeReason();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      changeReason.id = TEST_GUID;
      expect(changeReason.id).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        changeReason.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.description', () => {
    test('can set description to a string', async () => {
      changeReason.description = 'New licence';
      expect(changeReason.description).to.equal('New licence');
    });

    test('setting description to invalid value throws an error', async () => {
      const func = () => {
        changeReason.description = 123;
      };
      expect(func).throw();
    });
  });

  experiment('.triggersMinimumCharge', () => {
    test('can set triggersMinimumCharge to a true', async () => {
      changeReason.triggersMinimumCharge = true;
      expect(changeReason.triggersMinimumCharge).to.equal(true);
    });

    test('can set triggersMinimumCharge to a false', async () => {
      changeReason.triggersMinimumCharge = false;
      expect(changeReason.triggersMinimumCharge).to.equal(false);
    });

    test('setting triggersMinimumCharge to invalid value throws an error', async () => {
      const func = () => {
        changeReason.triggersMinimumCharge = 'yes';
      };
      expect(func).throw();
    });
  });

  experiment('.type', () => {
    ChangeReason.changeReasonTypes.forEach(type => {
      test(`can be set to ${type}`, async () => {
        changeReason.type = type;
        expect(changeReason.type).to.equal(type);
      });
    });

    test('setting type to invalid value throws an error', async () => {
      const func = () => {
        changeReason.type = 'invalid_type';
      };
      expect(func).throw();
    });
  });

  experiment('.isEnabledForNewChargeVersions', () => {
    test('has a default value of true', async () => {
      expect(changeReason.isEnabledForNewChargeVersions).to.equal(true);
    });

    test('can set isEnabledForNewChargeVersions to a true', async () => {
      changeReason.isEnabledForNewChargeVersions = true;
      expect(changeReason.isEnabledForNewChargeVersions).to.equal(true);
    });

    test('can set isEnabledForNewChargeVersions to a false', async () => {
      changeReason.isEnabledForNewChargeVersions = false;
      expect(changeReason.isEnabledForNewChargeVersions).to.equal(false);
    });

    test('setting isEnabledForNewChargeVersions to null value throws an error', async () => {
      const func = () => {
        changeReason.isEnabledForNewChargeVersions = null;
      };
      expect(func).throw();
    });
  });
});
