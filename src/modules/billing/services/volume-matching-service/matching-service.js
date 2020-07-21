'use strict';

const { RETURN_SEASONS } = require('../../../../lib/models/constants');

const match = (context, returnGroups, isSummer) => {
  const seasonKey = isSummer ? RETURN_SEASONS.summer : RETURN_SEASONS.winterAllYear;
  const returnGroup = returnGroups[seasonKey];

  // Returns have errors - assign error and full billable/null to billing volumes
  // of relevant season
  if (returnGroup.errorCode) {

  }
};

exports.match = match;
