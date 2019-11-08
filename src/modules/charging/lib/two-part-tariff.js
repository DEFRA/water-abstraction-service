const { cloneDeep } = require('lodash');
const helpers = require('./two-part-tariff-helpers');

const returnPurposeMatchesElementPurpose = (ret, ele) => {
  const purposeMatch = ret.metadata.purposes.map(purpose => {
    return parseInt(purpose.tertiary.code) === ele.purposeTertiary;
  });
  return purposeMatch.includes(true);
};
/**
 * Matches prepared returns to sorted charge elements
 * @param {Array} chargeElements - sorted charge elements for matching
 * @param {Aray} returns - returns for TPT Purposes
 */
const matchReturnQuantities = (chargeElements, returnsToMatch) => {
  const returns = cloneDeep(returnsToMatch);
  const elements = cloneDeep(chargeElements);
  // loop through charge elements - break if all relevant return quantities have been used up OR charge element quantity is full
  elements.forEach(ele => {
    returns.forEach(ret => {
      if (returnPurposeMatchesElementPurpose(ret, ele)) {
        ret.lines.forEach(retLine => {
          const { updatedLineQuantityAllocated, updatedElementQuantity } = helpers.matchReturnLineToElement(retLine, ele);
          retLine.quantityAllocated = updatedLineQuantityAllocated;
          ele.actualAnnualQuantity = updatedElementQuantity;
        });
      }
    });
  });
  return elements;
};

/**
 * @param  {Array}  returns - return objects for matching with elements
 * @param  {Object} chargeVersion - charge version object containing charging elements
 * @return {Array}           - objects with chargeElementIds and actualQuantities for each
 */
const matchReturnsToChargeElements = (chargeVersion, returns) => {
  const tptChargeElements = helpers.getTPTChargeElements(chargeVersion);

  const sortedChargeElements = helpers.prepareChargeElementsForMatching(tptChargeElements);

  const filteredReturns = helpers.prepareReturns(returns);

  const matchedChargeElements = matchReturnQuantities(sortedChargeElements, filteredReturns);

  return helpers.reshuffleQuantities(matchedChargeElements);
};

exports.matchReturnsToChargeElements = matchReturnsToChargeElements;
exports.matchReturnQuantities = matchReturnQuantities;
