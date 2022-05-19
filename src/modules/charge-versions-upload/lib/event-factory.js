const Event = require('../../../lib/models/event')
const { uploadStatus } = require('./charge-information-upload')

/**
 * Creates the event object that represent the upload
 * of a bulk returns document.
 * @param {String} uploadUserName The username of end user.
 * @param {String} uploadFilename The uploaded filename
 * @returns {Event}
 */
const createChargeInformationUploadEvent = (uploadUserName, uploadFilename) => {
  const event = new Event()
  return event.fromHash({
    metadata: { filename: uploadFilename },
    type: 'charge-information-upload',
    issuer: uploadUserName,
    status: uploadStatus.PROCESSING
  })
}

exports.createChargeInformationUploadEvent = createChargeInformationUploadEvent
