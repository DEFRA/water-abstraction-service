'use strict'

const chargeVersionsService = require('../../../lib/services/charge-versions')
const controller = require('../../../lib/controller')

const getLicenceChargeVersions = async request =>
  controller.getEntities(
    request.params.licenceId,
    chargeVersionsService.getByLicenceId
  )

exports.getLicenceChargeVersions = getLicenceChargeVersions
