'use strict'

const { parseFactor, parseBool } = require('../helpers')

// Return Empty adjustments if there are no adjustments
const isFalseyOrNull = (value) => {
  return value === false || value === null
}

const getAdjustments = data => {
  const adjustments = {
    s126: parseFactor(data.chargeReferenceDetailsAbatementFactor),
    s127: parseBool(data.chargeReferenceDetailsTwoPartTariffAgreementApplies),
    s130: parseBool(data.chargeReferenceDetailsCanalAndRiverTrustAgreementApplies),
    charge: parseFactor(data.chargeReferenceDetailsAdjustmentFactor),
    winter: parseBool(data.chargeReferenceDetailsWinterDiscount),
    aggregate: parseFactor(data.chargeReferenceDetailsAggregateFactor)
  }

  const noAdjustmentsToReturn = Object.keys(adjustments).every((key) => isFalseyOrNull(adjustments[key]))

  return noAdjustmentsToReturn
    ? {}
    : adjustments
}

exports.mapToAdjustments = getAdjustments
