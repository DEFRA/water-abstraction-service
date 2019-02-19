const Boom = require('boom');
const { persistReturnData, patchReturnData } = require('./lib/api-connector');
const { mapReturnToModel } = require('./lib/model-returns-mapper');
const { getReturnData } = require('./lib/facade');
const { eventFactory } = require('./lib/event-factory');
const { repository: eventRepository } = require('../../controllers/events');
const s3 = require('../../lib/connectors/s3');
const Event = require('../../lib/event');
const { uploadStatus, getUploadFilename, getReturnsS3Object } = require('./lib/returns-upload');
const { logger } = require('@envage/water-abstraction-helpers');
const startUploadJob = require('./lib/jobs/start-xml-upload');
const uploadValidator = require('./lib/returns-upload-validator');

/**
 * A controller method to get a unified view of a return, to avoid handling
 * in UI layer
 */
const getReturn = async (request, h) => {
  const { returnId, versionNumber } = request.query;

  const { return: ret, version, lines, versions } = await getReturnData(returnId, versionNumber);

  return mapReturnToModel(ret, version, lines, versions);
};

/**
 * Accepts posted return data from UI layer and submits back to returns service
 */
const postReturn = async (request, h) => {
  const ret = request.payload;

  // Persist data to return service
  const returnServiceData = await persistReturnData(ret);

  // Log event in water service event log
  const event = eventFactory(ret, returnServiceData.version);
  await eventRepository.create(event);

  return {
    error: null
  };
};

/**
 * Allows the patching of return header data
 * @param {String} request.payload.returnId - the return_id in the returns.returns table
 * @param {String} [request.payload.status] - return status
 * @param {String} [request.payload.receivedDate] - date received, ISO 8601 YYYY-MM-DD
 * @param {String} [request.payload.isUnderQuery] - is the return under query
 * @return {Promise} resolves with JSON payload
 */
const patchReturnHeader = async (request, h) => {
  const data = await patchReturnData(request.payload);

  // Log event in water service event log
  const eventData = {
    ...request.payload,
    licenceNumber: data.licence_ref
  };
  const event = eventFactory(eventData, null, 'return.status');
  await eventRepository.create(event);

  return {
    returnId: data.return_id,
    status: data.status,
    receivedDate: data.received_date,
    isUnderQuery: data.under_query
  };
};

/**
 * Creates the event object that represent the upload
 * of a returns xml document.
 * @param uploadUserName The username of end user.
 * @returns {Event}
 */
const createXmlUploadEvent = (uploadUserName) => {
  const evt = new Event();
  evt.setType('returns-upload', 'xml');
  evt.setIssuer(uploadUserName);
  evt.setStatus(uploadStatus.PROCESSING);
  return evt;
};

/**
 * Creates the relative URL for a consumer to find out
 * the status of the event described by the eventId parameter.
 */
const getEventStatusLink = eventId => {
  return `/water/1.0/event/${eventId}`;
};

const postUploadXml = async (request, h) => {
  const evt = createXmlUploadEvent(request.payload.userName);
  let eventId;

  try {
    await evt.save();
    eventId = evt.getId();

    const filename = getUploadFilename(eventId);
    const data = await s3.upload(filename, request.payload.fileData);
    const jobId = await startUploadJob.publish(eventId);

    return h.response({
      data: {
        eventId,
        filename,
        location: data.Location,
        statusLink: getEventStatusLink(eventId),
        jobId
      },
      error: null
    }).code(202);
  } catch (error) {
    logger.error('Failed to upload returns xml', error);
    if (eventId) {
      await evt.setStatus(uploadStatus.ERROR).save();
    }

    return h.response({ data: null, error }).code(500);
  }
};

/**
 * Allows the user to review their submitted return prior to submitting it
 * @param {String} request.params.eventId - the upload event ID
 * @param {String} request.payload.companyId - the company CRM entity ID
 * @param {String} request.payload.userName - email address of current user
 */
const postUploadPreview = async (request, h) => {
  const { eventId } = request.params;
  const { companyId } = request.payload;

  try {
    // Load event - 404 if not found
    const evt = await Event.load(eventId);
    if (!evt) {
      throw Boom.notFound(`Return upload event not found`, { eventId });
    }

    // Load JSON from S3 and validate
    const response = await getReturnsS3Object(eventId, 'json');
    const returns = JSON.parse(response.Body.toString());
    const result = await uploadValidator.validate(returns, companyId);
    return {
      data: result,
      error: null
    };
  } catch (error) {
    logger.error('Return upload preview failed', error, {
      eventId,
      companyId
    });

    throw error;
  }
};

module.exports = {
  getReturn,
  postReturn,
  patchReturnHeader,
  postUploadXml,
  postUploadPreview
};
