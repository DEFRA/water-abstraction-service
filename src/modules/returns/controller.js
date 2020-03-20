const Boom = require('@hapi/boom');
const { find, first, get, set } = require('lodash');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

const { persistReturnData, patchReturnData } = require('./lib/api-connector');
const { mapReturnToModel } = require('./lib/model-returns-mapper');
const { getReturnData } = require('./lib/facade');
const eventFactory = require('./lib/event-factory');
const eventsService = require('../../lib/services/events');
const s3 = require('../../lib/connectors/s3');
const { uploadStatus, getUploadFilename } = require('./lib/returns-upload');
const { logger } = require('../../logger');
const startUploadJob = require('./lib/jobs/start-upload');
const persistReturnsJob = require('./lib/jobs/persist-returns');
const uploadValidator = require('./lib/returns-upload-validator');
const { mapSingleReturn } = require('./lib/upload-preview-mapper');
const returnsConnector = require('../../lib/connectors/returns');

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
  const event = eventFactory.createSubmissionEvent(ret, returnServiceData.version);
  await eventsService.update(event);

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

  const event = eventFactory.createSubmissionEvent(eventData, null, 'return.status');
  await eventsService.update(event);

  return {
    returnId: data.return_id,
    status: data.status,
    receivedDate: data.received_date,
    isUnderQuery: data.under_query
  };
};

const getEventStatusLink = eventId => `/water/1.0/event/${eventId}`;

const postUpload = async (request, h) => {
  const { type } = request.params;
  const { companyId } = request.payload;

  let event = eventFactory.createBulkUploadEvent(request.payload.userName, type);

  try {
    event = await eventsService.create(event);

    const filename = getUploadFilename(event.id, type);
    await s3.upload(filename, request.payload.fileData);
    const jobId = await startUploadJob.publish({ eventId: event.id, companyId });

    return h.response({
      data: {
        eventId: event.id,
        statusLink: getEventStatusLink(event.id),
        jobId
      },
      error: null
    }).code(202);
  } catch (error) {
    logger.error('Failed to upload bulk returns', error);
    if (event.id) {
      event.status = uploadStatus.ERROR;
      await eventsService.update(event);
    }

    return h.response({ data: null, error }).code(500);
  }
};

/**
 * An API endpoint to preview a single uploaded return, included full line data
 * and metadata loaded from the return service return record to support the view
 * @param {String} request.params.eventId - the upload event ID
 * @param {String} request.query.returnId - the return service ID to view
 * @param {String} request.query.companyId - the company CRM entity ID
 * @param {String} request.query.userName - email address of current user
 * @return {Promise} resolves with return data { error : null, data : {} }
 */
const getUploadPreviewReturn = async (request, h) => {
  const params = parseRequest(request);
  const { companyId, returnId } = params;

  try {
    const match = find(request.jsonData, { returnId });

    if (!match) {
      throw Boom.notFound(`Return ${returnId} not found in upload`, params);
    }

    // Validate JSON data, and fetch return from return service
    const [validated, response] = await Promise.all([
      uploadValidator.validate([match], companyId),
      returnsConnector.returns.findOne(returnId)
    ]);

    throwIfError(response.error);

    const data = validated.map(row => mapSingleReturn(row, response.data));

    return {
      error: null,
      data: first(data)
    };
  } catch (error) {
    logger.error('Return upload preview failed', error, params);
    throw error;
  }
};

/**
 * Update event to submitting status
 * @param  {Event} event  - the event object
 * @param  {Array} data - array of return objects
 * @return {Event}
 */
const applySubmitting = (event, data) => {
  const returns = data.map(ret => ({
    returnId: ret.returnId,
    submitted: false,
    error: null
  }));

  set(event, 'metadata.returns', returns);
  event.status = uploadStatus.SUBMITTING;

  return event;
};

const isValidReturn = ret => ret.errors.length === 0;
const isReadyEvent = evt => evt.status === uploadStatus.READY;

const parseRequest = (request) => {
  const { eventId, returnId } = request.params;
  const { companyId } = request.query;
  return { eventId, companyId, returnId };
};

/**
 * Route handler to trigger the submission of valid returns corresponding
 * to the supplied upload event ID
 * @param  {String}  request.params.eventId - GUID from the water events table
 * @param  {String}  request.params.companyId - CRM company entity GUID
 * @param  {String}  request.params.entityId - CRM individual entity GUID
 * @param  {String}  request.params.userName - email of current user
 * @return {Promise}         resolves with JSON if submitted
 */
const postUploadSubmit = async (request, h) => {
  const { eventId, companyId } = parseRequest(request);

  try {
    // Check event status is 'validated'
    if (!isReadyEvent(request.event)) {
      throw Boom.badRequest('Event status not \'ready\'');
    }

    // Validate data in JSON
    const data = await uploadValidator.validate(request.jsonData, companyId);

    const valid = data.filter(isValidReturn);

    // Check 1+ valid returns
    if (valid.length < 1) {
      throw Boom.badRequest('No valid returns found in submission');
    }

    // Update event
    eventsService.update(applySubmitting(request.event, valid));

    await persistReturnsJob.publish(get(request, 'event.id'));

    return { data, error: null };
  } catch (error) {
    logger.error('Return upload preview failed', error, { eventId, companyId });
    throw error;
  }
};

exports.getReturn = getReturn;
exports.postReturn = postReturn;
exports.patchReturnHeader = patchReturnHeader;
exports.postUpload = postUpload;
exports.getUploadPreviewReturn = getUploadPreviewReturn;
exports.postUploadSubmit = postUploadSubmit;
