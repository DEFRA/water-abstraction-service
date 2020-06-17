'use strict';

const { omit } = require('lodash');

const data = require('./data');
const { ChargeElement, bookshelf } = require('../../../src/lib/connectors/bookshelf');

/**
 * Create the charge element with the scenario key, attached to the
 * specified charge version
 * @param {Object} chargeVersion - bookshelf model
 * @param {String} scenarioKey
 */
const create = async (chargeVersion, scenarioKey) => ChargeElement
  .forge({
    isTest: true,
    chargeVersionId: chargeVersion.get('chargeVersionId'),
    purposePrimaryId: chargeVersion.get('purposePrimaryId'),
    purposeSecondaryId: chargeVersion.get('purposeSecondaryId'),
    purposeUseId: chargeVersion.get('purposeUseId'),
    ...omit(data.chargeElements[scenarioKey], ['purposePrimary', 'purposeSecondary', 'purposeUse'])
  })
  .save();

const tearDown = () =>
  bookshelf.knex('water.charge_elements')
    .where('is_test', true)
    .del();

exports.create = create;
exports.tearDown = tearDown;
