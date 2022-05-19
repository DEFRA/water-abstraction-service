'use strict'

const invoiceLicenceService = require('../services/invoice-licences-service')
const controller = require('../../../lib/controller')

const deleteInvoiceLicence = (request, h) => controller.deleteEntity(
  invoiceLicenceService.deleteByInvoiceLicenceId,
  h,
  request.params.invoiceLicenceId
)

exports.deleteInvoiceLicence = deleteInvoiceLicence
