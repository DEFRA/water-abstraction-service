'use strict';

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Event = require('../../../src/lib/models/event');
const eventMapper = require('../../../src/lib/mappers/event');

experiment('src/lib/mappers/event', () => {
  experiment('.dbToModel', () => {
    test('returns an Event instance', async () => {
      const STATUS = 'completed';
      const result = eventMapper.dbToModel({ status: STATUS });
      expect(result).to.be.an.instanceOf(Event);
    });

    test('maps status when it is a string', async () => {
      const STATUS = 'completed';
      const result = eventMapper.dbToModel({ status: STATUS });
      expect(result.status).to.equal(STATUS);
    });

    test('maps status to null when it is an empty string', async () => {
      const result = eventMapper.dbToModel({ status: '' });
      expect(result.status).to.be.null();
    });

    test('maps status to null when it is null', async () => {
      const result = eventMapper.dbToModel({ status: null });
      expect(result.status).to.be.null();
    });
  });
});
