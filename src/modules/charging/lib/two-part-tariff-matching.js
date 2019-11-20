const { cloneDeep } = require('lodash');
const {
  getTPTChargeElements,
  prepareChargeElementData,
  sortChargeElementsForMatching
} = require('./prepare-charge-elements');
const {
  checkReturnsAreCompleted,
  getTPTReturns,
  prepareReturnLinesData
} = require('./prepare-returns');
const matchRets = require('./match-return-quantities');
const { returnMatchingError, returnPurposeMatchesElementPurpose } = require('./two-part-tariff-helpers');
const { reshuffleQuantities } = require('./reshuffle-quantities');

/**
 * Matches prepared returns to sorted charge elements
 * @param {Array} chargeElements - sorted charge elements for matching
 * @param {Aray} returns - returns for TPT Purposes
 * @return {Array} charge elements array with allocated quantities
 */
const matchReturnQuantities = (chargeElements, returnsToMatch) => {
  const returns = cloneDeep(returnsToMatch);
  const elements = cloneDeep(chargeElements);
  // loop through charge elements - break if all relevant return quantities have been used up OR charge element quantity is full
  elements.forEach(ele => {
    returns.forEach(ret => {
      if (returnPurposeMatchesElementPurpose(ret, ele)) {
        ret.lines.forEach(retLine => {
          const {
            updatedLineQuantityAllocated,
            updatedElementQuantity
          } = matchRets.matchReturnLineToElement(retLine, ele);

          retLine.quantityAllocated = updatedLineQuantityAllocated;
          ele.actualAnnualQuantity = updatedElementQuantity;
        });
      }
    });
  });
  return elements;
};

const prepareChargeElementsForMatching = chargeElements => {
  const tptChargeElements = getTPTChargeElements(chargeElements);

  const preparedChargeElements = prepareChargeElementData(tptChargeElements);

  return sortChargeElementsForMatching(preparedChargeElements);
};

const prepareReturnsForMatching = returns => {
  const returnErrors = checkReturnsAreCompleted(returns);
  if (returnErrors) returnMatchingError(returnErrors);

  const tptReturns = getTPTReturns(returns);

  const preparedReturns = prepareReturnLinesData(tptReturns);

  return { error: null,
    data: preparedReturns };
};

/**
 * @param  {Array}  returns - return objects for matching with elements
 * @param  {Object} chargeVersion - charge version object containing charging elements
 * @return {Array}           - objects with chargeElementIds and actualQuantities for each
 */
const matchReturnsToChargeElements = (chargeVersion, returns) => {
  const { error, data: preparedReturns } = prepareReturnsForMatching(returns);
  if (error) returnMatchingError(error);

  const preparedChargeElements = prepareChargeElementsForMatching(chargeVersion.chargeElements);

  const matchedChargeElements = matchReturnQuantities(preparedChargeElements, preparedReturns);

  return reshuffleQuantities(matchedChargeElements);
};

exports.matchReturnsToChargeElements = matchReturnsToChargeElements;
exports.matchReturnQuantities = matchReturnQuantities;
