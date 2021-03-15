'use strict';

const returnCyclesService = require('../../../lib/services/return-cycles');

const getReturnCyclesReport = async (request, h) => {
  const data = await returnCyclesService.getReturnCycleReport();
  return { data };
};

exports.getReturnCyclesReport = getReturnCyclesReport;
