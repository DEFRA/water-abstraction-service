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

  experiment('.reason', () => {
    test('can set reason to a string', async () => {
      changeReason.reason = 'New licence';
      expect(changeReason.reason).to.equal('New licence');
    });

    test('setting reason to invalid value throws an error', async () => {
      const func = () => {
        changeReason.reason = 123;
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
});
