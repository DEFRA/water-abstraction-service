const {
  getTptChargeElements,
  prepareChargeElementData,
  sortChargeElementsForMatching
} = require('./prepare-charge-elements');
const {
  checkForReturnsErrors,
  getTPTReturns,
  prepareReturnLinesData
} = require('./prepare-returns');
const matchReturns = require('./match-return-quantities');
const {
  returnsError,
  returnPurposeMatchesElementPurpose
} = require('./two-part-tariff-helpers');
const { reshuffleQuantities } = require('./reshuffle-quantities');

const matchReturnLines = (ret, ele) => {
  for (const retLine of ret.lines) {
    const {
      updatedLineQuantityAllocated,
      updatedElementQuantity,
      updatedMaxPossibleReturnQuantity
    } = matchReturns.matchReturnLineToElement(retLine, ele);

    retLine.quantityAllocated = updatedLineQuantityAllocated;
    ele.actualReturnQuantity = updatedElementQuantity;
    ele.maxPossibleReturnQuantity = updatedMaxPossibleReturnQuantity;
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
      if (returnPurposeMatchesElementPurpose(ret, ele)) matchReturnLines(ret, ele);
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
 * Check that returns are completed and ready to be matched, return error/s otherwise
 * @param {Array} returns for checking
 * @return {Object}
 *         {Array} errors about returns which are not in a ready state or
 *         {Array} data prepared returns
 */
const prepareReturnsForMatching = returns => {
  const tptReturns = getTPTReturns(returns);

  const returnError = checkForReturnsErrors(tptReturns);
  if (returnError) return { error: returnError, data: null };

  const preparedReturns = prepareReturnLinesData(tptReturns);

  return {
    error: null,
    data: preparedReturns
  };
};

/**
 * @param  {Array}  returns - return objects for matching with elements
 * @param  {Object} chargeVersion - charge version object containing charging elements
 * @return {Array}           - objects with chargeElement.id and actualQuantities for each
 */
const matchReturnsToChargeElements = (chargeElements, returns) => {
  const { error, data: preparedReturns } = prepareReturnsForMatching(returns);
  if (error) return returnsError(error, getTptChargeElements(chargeElements));

  const preparedChargeElements = prepareChargeElementsForMatching(chargeElements);

  const matchedChargeElements = matchReturnQuantities(preparedChargeElements, preparedReturns);

  return reshuffleQuantities(matchedChargeElements);
};

exports.matchReturnQuantities = matchReturnQuantities;
exports.prepareChargeElementsForMatching = prepareChargeElementsForMatching;
exports.prepareReturnsForMatching = prepareReturnsForMatching;
exports.matchReturnsToChargeElements = matchReturnsToChargeElements;
