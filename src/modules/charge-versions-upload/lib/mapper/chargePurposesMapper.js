const helpers = require('../helpers')

const mapPurposeUse = data => {
  if (data) {
    const { purposeUseId, legacyId, description, isTest, ...purposeUse } = data
    return {
      ...purposeUse,
      id: purposeUseId,
      code: legacyId,
      name: description
    }
  } else {
    return {}
  }
}

const mapPurposePrimary = data => {
  if (data) {
    const { purposePrimaryId, legacyId, description, isTest, ...purposePrimary } = data
    return {
      ...purposePrimary,
      type: 'primary',
      id: purposePrimaryId,
      code: legacyId,
      name: description
    }
  } else {
    return {}
  }
}

const mapPurposeSecondary = data => {
  if (data) {
    const { purposeSecondaryId, legacyId, description, isTest, ...purposeSecondary } = data
    return {
      ...purposeSecondary,
      type: 'secondary',
      id: purposeSecondaryId,
      code: legacyId,
      name: description
    }
  } else {
    return {}
  }
}

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

const mapLicenceVersionPurpose = async licenceVersionPurpose => {
  const { purposeUse = {}, purposePrimary = {}, purposeSecondary = {} } = licenceVersionPurpose || {}
  return {
    purposeUse: mapPurposeUse(purposeUse),
    purposePrimary: mapPurposePrimary(purposePrimary),
    purposeSecondary: mapPurposeSecondary(purposeSecondary)
  }
}

const mapToChargePurposes = licenceId => async data => {
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
  const licenceVersionPurposes = [...await helpers.getLicenceVersionPurposes(licenceId)] // Make a copy
  while (licenceVersionPurposes.length) {
    const licenceVersionPurpose = licenceVersionPurposes.shift()
    if (licenceVersionPurpose.purposeUse.description === data.chargeElementPurpose) {
      return {
        ...purpose,
        ...await mapLicenceVersionPurpose(licenceVersionPurpose),
        description: data.chargeElementDescription
      }
    }
  }
  return null
}

exports.mapToChargePurposes = mapToChargePurposes
