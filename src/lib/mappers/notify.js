'use strict';

/**
 * @module maps service models to Notify address lines
 */

const { chunk, identity, pick } = require('lodash');
const { DATA_SOURCE_TYPES } = require('../models/contact-v2');

const minimum = (num, min) =>
  num < min ? min : num;

const combineAddressLines = arr => {
  const over = minimum(arr.length - 7, 0);

  const groupedLines = chunk(arr, 2).map(arr => arr.join(', '));

  return [
    ...groupedLines.slice(0, over),
    ...arr.slice(over * 2)
  ];
};

const getAddressObject = arr => arr.reduce((acc, line, index) => ({
  ...acc,
  [`address_line_${index + 1}`]: line
}), {});

/**
 * Maps service models to a Notify address personalisation object
 * with no more than 7 lines
 * @param {Object} service models, { address, contact, company }
 * @return {Object} personalisation object for Notify letter
 */
const mapModelsToNotifyAddress = (models) => {
  const { address, company, contact } = models;
  const lines = [];
  if (contact && (contact.dataSource !== DATA_SOURCE_TYPES.nald)) {
    lines.push(`FAO ${contact.fullName}`);
  }
  if (company) {
    lines.push(company.name);
  }

  // Get non-empty address lines in order
  const addressLines = Object.values(
    pick(address, 'addressLine1', 'addressLine2', 'addressLine3', 'addressLine4', 'town', 'county', 'postcode')
  ).filter(identity);

  lines.push(...addressLines);

  if (!address.isUKAddress) {
    lines.push(address.country);
  }

  const arr = combineAddressLines(lines);

  return getAddressObject(arr);
};

exports.mapModelsToNotifyAddress = mapModelsToNotifyAddress;
