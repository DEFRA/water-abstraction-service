'use strict'

const purposeUses = require('../../../lib/connectors/repos/purpose-uses')
const primaryPurposes = require('../../../lib/connectors/repos/purpose-primary')
const secondaryPurposes = require('../../../lib/connectors/repos/purpose-secondary')

const createPurposes = async () => {
  // empty container for the purposes
  const purposes = {
    primaryPurpose: '',
    secondaryPurposes: '',
    purposeUse: ''
  }
  purposes.primaryPurpose = await primaryPurposes.findOneByLegacyId('A')
  if (!purposes.primaryPurpose) {
    purposes.primaryPurpose = await primaryPurposes.create({ legacy_id: 'A', description: 'Agriculture' })
  }

  purposes.secondaryPurpose = await secondaryPurposes.findOneByLegacyId('AGR')
  if (!purposes.secondaryPurpose) {
    purposes.secondaryPurpose = secondaryPurposes.create({ legacy_id: 'AGR', description: 'General Agriculture' })
  }

  purposes.purposeUse = await purposeUses.findOneByLegacyId(140)
  if (!purposes.purposeUse) {
    purposes.purposeUse = await purposeUses.create(
      {
        legacy_id: 140,
        description: 'General Farming & Domestic',
        lossFactor: 'medium',
        isTwoPartTariff: false
      })
  }

  return purposes
}
exports.create = createPurposes
