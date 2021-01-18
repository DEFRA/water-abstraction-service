'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { getExistingEntity } = require('../../src/lib/crm-response');

experiment('lib/crm-response', () => {
  experiment('.getExistingEntity', () => {
    let err;

    const EXISTING_ENTITY = {
      entityId: 'test-id'
    };

    beforeEach(async () => {
      err = new Error();
      err.statusCode = 409;
      err.error = {
        existingEntity: EXISTING_ENTITY
      };
    });

    test('when the status code is 409 and there is an existingEntity propert', async () => {
      const result = getExistingEntity(err);
      expect(result).to.equal(EXISTING_ENTITY);
    });

    test('if there is no existingEntity, the error is rethrown', async () => {
      delete err.error.existingEntity;
      expect(() => getExistingEntity(err)).to.throw();
    });

    test('if the status code is not 409 the error is rethrown', async () => {
      err.statusCode = 404;
      expect(() => getExistingEntity(err)).to.throw();
    });
  });
});
