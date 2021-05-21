/**
 * Controller to allow interaction with returns service models
 */
const returnsService = require('../../../lib/services/returns');
const controller = require('../../../lib/controller');

/**
 * Get single return model by ID
 */
const getReturnById = request =>
  controller.getEntity(request.params.returnId, returnsService.getReturnById);

exports.getReturnById = getReturnById;
