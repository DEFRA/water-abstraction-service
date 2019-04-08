const Joi = require('joi');
const helpers = require('@envage/water-abstraction-helpers');
const { last, get } = require('lodash');
const returnsConnector = require('../../../lib/connectors/returns');

const schema = {
  endDate: Joi.string().isoDate().required(),
  excludeLicences: Joi.string()
};

/**
 * Gets end date of current return cycle
 * @param  {String} [refDate] - for unit testing, allows setting of today
 * @return {String} cycle end date in form YYYY-MM-DD
 */
const getEndDate = (refDate) => {
  const cycles = helpers.returns.date.createReturnCycles(undefined, refDate);
  return last(cycles).endDate;
};

/**
 * Creates a filter to find returns for which we wish to send a paper
 * reminder letter and form
 * @TODO - confirm whether we need to include partial returns within the return
 * cycle
 * @param {String} endDate - the end date of the return cycle
 * @param {Array} excludeLicences - a list of licence numbers to exclude returns for
 * @return {Object} filter object
 */
const getReminderFilter = (excludeLicences = []) => {
  const filter = {
    end_date: getEndDate(),
    status: 'due',
    regime: 'water',
    licence_type: 'abstraction',
    'metadata->>isCurrent': 'true'
  };

  if (excludeLicences.length) {
    filter.licence_ref = {
      $nin: excludeLicences
    };
  }

  return filter;
};

const getExcludeLicences = data => {
  const csv = get(data, 'ev.metadata.options.excludeLicences', '');
  return csv.split(',').map(x => x.trim()).filter(x => x);
};

const getRecipients = async (data) => {
  const excludeLicences = getExcludeLicences(data);

  // Get filter object for loading returns
  const filter = getReminderFilter(excludeLicences);

  // Load due returns from returns service using filter
  const returns = await returnsConnector.returns.findAll(filter, {}, ['return_id', 'licence_ref']);

  console.log(returns);
};

module.exports = {
  prefix: 'RREM-',
  name: 'Returns: reminder',
  messageType: 'returnReminder',
  schema,
  getRecipients
};
