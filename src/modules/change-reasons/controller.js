'use strict';

const repos = require('../../lib/connectors/repos');

/**
 * Get all change reasons
 */
const getChangeReasons = async (request, h) => {
  const changeReasons = await repos.changeReasons.find();
  return {
    data: changeReasons
  };
};

exports.getChangeReasons = getChangeReasons;
