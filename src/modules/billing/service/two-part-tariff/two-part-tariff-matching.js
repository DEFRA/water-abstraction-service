const { cloneDeep } = require('lodash');
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
const matchRets = require('./match-return-quantities');
const {
  returnsError,
  returnPurposeMatchesElementPurpose
} = require('./two-part-tariff-helpers');
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

  elements.forEach(ele => {
    returns.forEach(ret => {
      if (returnPurposeMatchesElementPurpose(ret, ele)) {
        ret.lines.forEach(retLine => {
          const {
            updatedLineQuantityAllocated,
            updatedElementQuantity,
            updatedMaxPossibleReturnQuantity
          } = matchRets.matchReturnLineToElement(retLine, ele);

          retLine.quantityAllocated = updatedLineQuantityAllocated;
          ele.actualReturnQuantity = updatedElementQuantity;
          ele.maxPossibleReturnQuantity = updatedMaxPossibleReturnQuantity;
        });
      }
    });
  });
  return elements;
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
 * @return {Array}           - objects with chargeElementIds and actualQuantities for each
 */
const matchReturnsToChargeElements = (chargeVersion, returns) => {
  const { error, data: preparedReturns } = prepareReturnsForMatching(returns);
  if (error) return returnsError(error, getTptChargeElements(chargeVersion.chargeElements));

  const preparedChargeElements = prepareChargeElementsForMatching(chargeVersion.chargeElements);

  const matchedChargeElements = matchReturnQuantities(preparedChargeElements, preparedReturns);

  return reshuffleQuantities(matchedChargeElements);
};

exports.matchReturnQuantities = matchReturnQuantities;
exports.prepareChargeElementsForMatching = prepareChargeElementsForMatching;
exports.prepareReturnsForMatching = prepareReturnsForMatching;
exports.matchReturnsToChargeElements = matchReturnsToChargeElements;
