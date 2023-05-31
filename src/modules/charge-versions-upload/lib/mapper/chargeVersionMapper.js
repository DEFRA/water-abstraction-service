const { SCHEME } = require('../../../../lib/models/constants')
const chargeElementMapper = require('./chargeElementMapper')
const changeReasonMapper = require('./changeReasonMapper')
const chargeCategoryMapper = require('./chargeCategoryMapper')
const chargePurposesMapper = require('./chargePurposesMapper')
const helpers = require('../helpers')

const { sroc } = SCHEME

const mapToChargeVersion = async (chargeVersionGroup, user, invoiceAccountNumber) => {
  const mappedUser = {
    id: user.user_id,
    email: user.user_name
  }

  const firstChargeElement = chargeVersionGroup[0][0]
  const { licenceNumber, chargeInformationNotes, chargeInformationStartDate } = firstChargeElement

  const licence = await helpers.getLicence(licenceNumber)

  const chargeElements = []
  while (chargeVersionGroup.length) {
    const chargeElementGroup = chargeVersionGroup.shift()
    const chargeElementData = chargeElementGroup[0]
    const chargeCategory = await chargeCategoryMapper.mapToChargeCategory(chargeElementData)
    const chargePurposes = await Promise.all(chargeElementGroup.map(chargePurposesMapper.mapToChargePurposes))
    chargeElements.push(await chargeElementMapper.mapToChargeElement(
      chargeElementData,
      licence,
      chargeCategory,
      chargePurposes.filter(chargePurpose => chargePurpose) // Filter out any nulls
    ))
  }

  const chargeVersion = {
    chargeElements,
    scheme: sroc,
    status: 'draft',
    dateRange: {
      startDate: helpers.formatDate(chargeInformationStartDate)
    },
    changeReason: await changeReasonMapper.mapToChangeReason(),
    invoiceAccount: await helpers.getInvoiceAccount(licence, invoiceAccountNumber)
  }
  if (chargeInformationNotes) {
    chargeVersion.note = {
      text: chargeInformationNotes,
      type: 'charge_version',
      user: mappedUser
    }
  }
  return {
    chargeVersion,
    licenceRef: licenceNumber,
    user: mappedUser
  }
}

exports.mapToChargeVersion = mapToChargeVersion
