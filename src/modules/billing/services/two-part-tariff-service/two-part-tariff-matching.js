const {
  getTptChargeElements,
  prepareChargeElementData,
  sortChargeElementsForMatching
} = require('./prepare-charge-elements');
const {
  checkForReturnsErrors,
  getReturnsWithMatchingPurposes,
  prepareReturnLinesData
} = require('./prepare-returns');
const matchReturns = require('./match-return-quantities');
const {
  getNullActualReturnQuantities,
  returnPurposeMatchesElementPurpose
} = require('./two-part-tariff-helpers');
const { reshuffleQuantities } = require('./reshuffle-quantities');

const matchReturnLines = (ret, ele) => {
  if (returnPurposeMatchesElementPurpose(ret, ele)) {
    for (const retLine of ret.lines) {
      const {
        updatedLineQuantityAllocated,
        updatedElementQuantity,
        updatedMaxPossibleReturnQuantity
      } = matchReturns.matchReturnLineToElement(retLine, ele);

      retLine.quantityAllocated = updatedLineQuantityAllocated;
      ele.actualReturnQuantity = updatedElementQuantity;
      ele.maxPossibleReturnQuantity = updatedMaxPossibleReturnQuantity;
    }
  };
};

/**
 * Matches prepared returns to sorted charge elements
 * @param {Array} chargeElements - sorted charge elements for matching
 * @param {Aray} returns - returns for TPT Purposes
 * @return {Array} charge elements array with allocated quantities
 */
const matchReturnQuantities = (chargeElements, returnsToMatch) => {
  for (const ele of chargeElements) {
    for (const ret of returnsToMatch) {
      matchReturnLines(ret, ele);
    };
  };
  return chargeElements;
};

/**
 * Filter, prepare and sort charge elements for returns matching
 * @param {Array} chargeElements
 * @return {Array} chargeElements ready for matching
 */
const prepareChargeElementsForMatching = chargeElements => {
  const tptChargeElements = getTptChargeElements(chargeElements);

  const preparedChargeElements = prepareChargeElementData(tptChargeElements);

  return sortChargeElementsForMatching(preparedChargeElements);
};

/**
 * Returns an array of the charge element purpose codes
 */
const getChargeElementPurposeCodes = chargeElements =>
  chargeElements.map(element => element.purposeUse.code);

/**
 * Check that returns are completed and ready to be matched, return error/s otherwise
 * @param {Array<Object>} returns for checking
 * @param {Array<Object>} chargeElements for checking
 * @return {Object}
 *         {Array<Object>} return related errors or
 *         {Array<Object>} returns prepared for matching exercise
 */
const prepareReturnsForMatching = (returns, chargeElements) => {
  const chargeElementPurposes = getChargeElementPurposeCodes(chargeElements);
  const tptReturns = getReturnsWithMatchingPurposes(returns, chargeElementPurposes);

  const returnError = checkForReturnsErrors(tptReturns);
  if (returnError) return { error: returnError, data: null };

  return {
    error: null,
    data: prepareReturnLinesData(tptReturns)
  };
};

/**
 * @param  {Array}  returns - return objects for matching with elements
 * @param  {Object} chargeVersion - charge version object containing charging elements
 * @return {Array}           - objects with chargeElement.id and actualQuantities for each
 */
const matchReturnsToChargeElements = (chargeElements, returns) => {
  const preparedChargeElements = prepareChargeElementsForMatching(chargeElements);

  const { error, data: preparedReturns } = prepareReturnsForMatching(returns, preparedChargeElements);
  if (error) return getNullActualReturnQuantities(getTptChargeElements(chargeElements), error);

  const matchedChargeElements = matchReturnQuantities(preparedChargeElements, preparedReturns);

  return reshuffleQuantities(matchedChargeElements);
};

exports.matchReturnQuantities = matchReturnQuantities;
exports.prepareChargeElementsForMatching = prepareChargeElementsForMatching;
exports.prepareReturnsForMatching = prepareReturnsForMatching;
exports.matchReturnsToChargeElements = matchReturnsToChargeElements;
