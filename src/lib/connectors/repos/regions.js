'use strict';

const Region = require('../bookshelf/Region');

const find = async () => {
  const regions = await Region.fetchAll();
  return regions.toJSON();
};

exports.find = find;
