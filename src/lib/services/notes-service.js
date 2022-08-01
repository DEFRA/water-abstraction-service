const noteRepo = require('../connectors/repos/notes')
const mappers = require('../mappers')

/**
 * Gets the related note for the supplied model
 * @param {Object} model
 * @return {Object} decorated with note
 */
const decorateWithNote = async model => {
  const note = await noteRepo.findByChargeVersionId(model.id)
  if (note) {
    model.note = mappers.note.dbToModel(note)
  }
  return model
}

exports.decorateWithNote = decorateWithNote
