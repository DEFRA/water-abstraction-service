const helpers = require('../helpers')

const mapToChangeReason = async () => {
  const changeReason = await helpers.getChangeReason()
  if (changeReason) {
    const { changeReasonId, type, description, triggersMinimumCharge, isEnabledForNewChargeVersions } = changeReason
    return {
      type,
      description,
      triggersMinimumCharge,
      isEnabledForNewChargeVersions,
      id: changeReasonId
    }
  } else {
    return {}
  }
}

exports.mapToChangeReason = mapToChangeReason
