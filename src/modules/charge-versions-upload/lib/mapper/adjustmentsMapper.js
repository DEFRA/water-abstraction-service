const { isEqual } = require('lodash')
const { parseFactor, parseBool } = require('../helpers')

const getAdjustments = data => {
  const adjustments = {
    s126: parseFactor(data.chargeReferenceDetailsAbatementFactor),
    s127: parseBool(data.chargeReferenceDetailsTwoPartTariffAgreementApplies),
    s130: parseBool(data.chargeReferenceDetailsCanalAndRiverTrustAgreementApplies),
    charge: parseFactor(data.chargeReferenceDetailsAdjustmentFactor),
    winter: parseBool(data.chargeReferenceDetailsWinterDiscount),
    aggregate: parseFactor(data.chargeReferenceDetailsAggregateFactor)
  }

  // Return Empty adjustments if there are no adjustments

  return isEqual(adjustments, {
    s126: null,
    s127: false,
    s130: false,
    charge: null,
    winter: false,
    aggregate: null
  })
    ? {}
    : adjustments
}

exports.mapToAdjustments = getAdjustments
