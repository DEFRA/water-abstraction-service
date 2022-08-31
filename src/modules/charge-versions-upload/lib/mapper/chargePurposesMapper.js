const helpers = require('../helpers')

const mapAbstractionPeriod = abstractionPeriod => {
  const [startDate, endDate] = abstractionPeriod.split('-')
  const [startDay, startMonth] = startDate.split('/')
  const [endDay, endMonth] = endDate.split('/')
  return {
    startDay: parseInt(startDay),
    startMonth: parseInt(startMonth),
    endDay: parseInt(endDay),
    endMonth: parseInt(endMonth)
  }
}

const mapToChargePurposes = () => async data => {
  const purpose = {
    loss: data.chargeElementLoss,
    abstractionPeriod: mapAbstractionPeriod(data.chargeElementAbstractionPeriod),
    authorisedAnnualQuantity: parseFloat(data.chargeElementAuthorisedQuantity),
    isSection127AgreementEnabled: !!helpers.parseBool(data.chargeElementAgreementApply) // blank will also be false
  }
  if (data.chargeElementTimeLimitStart) {
    purpose.timeLimitedPeriod = {
      startDate: helpers.formatDate(data.chargeElementTimeLimitStart),
      endDate: helpers.formatDate(data.chargeElementTimeLimitEnd)
    }
  }

  const purposeUse = await helpers.getPurposeUse(data.chargeElementPurpose)
  return {
    ...purpose,
    purposeUse: { id: purposeUse.purposeUseId },
    purposePrimary: {},
    purposeSecondary: {},
    description: data.chargeElementDescription
  }
}

exports.mapToChargePurposes = mapToChargePurposes
