const Boom = require('boom');
const { find, first } = require('lodash');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

const { persistReturnData, patchReturnData } = require('./lib/api-connector');
const { mapReturnToModel } = require('./lib/model-returns-mapper');
const { getReturnData } = require('./lib/facade');
const { eventFactory } = require('./lib/event-factory');
const { repository: eventRepository } = require('../../controllers/events');
const s3 = require('../../lib/connectors/s3');
const event = require('../../lib/event');
const { uploadStatus, getUploadFilename } = require('./lib/returns-upload');
const { logger } = require('@envage/water-abstraction-helpers');
const startUploadJob = require('./lib/jobs/start-xml-upload');
const uploadValidator = require('./lib/returns-upload-validator');
const { mapSingleReturn, mapMultipleReturn } = require('./lib/upload-preview-mapper');
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
 * @returns {Object}
 */
const createXmlUploadEvent = (uploadUserName) => {
  return event.create({
    type: 'returns-upload',
    subtype: 'xml',
    issuer: uploadUserName,
    status: uploadStatus.PROCESSING
  });
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

  try {
    await event.save(evt);

    const filename = getUploadFilename(evt.eventId);
    const data = await s3.upload(filename, request.payload.fileData);
    const jobId = await startUploadJob.publish(evt.eventId);

    return h.response({
      data: {
        eventId: evt.eventId,
        filename,
        location: data.Location,
        statusLink: getEventStatusLink(evt.eventId),
        jobId
      },
      error: null
    }).code(202);
  } catch (error) {
    logger.error('Failed to upload returns xml', error);
    if (evt.eventId) {
      evt.status = uploadStatus.ERROR;
      await event.save(evt);
    }

    return h.response({ data: null, error }).code(500);
  }
};

/**
 * An API endpoint to preview the uploaded returns including any validation
 * errors.
 * Can be for either:
 * - the whole upload, with totalVolume only (return lines omitted)
 * - a single return, with return lines
 * @param  {[type]}  request [description]
 * @param  {[type]}  h       [description]
 * @return {Promise}         [description]
 */
const getUploadPreview = async (request, h) => {
  const { eventId, companyId } = parseRequest(request);

  try {
    const validated = await uploadValidator.validate(request.jsonData, companyId);

    const data = validated.map(mapMultipleReturn);

    return {
      error: null,
      data
    };
  } catch (error) {
    logger.error('Return upload preview failed', error, { eventId, companyId });
    throw error;
  }
};

/**
 * View a single return
 * The response from this call includes line data and metadata loaded from
 * the return service
 */
const getUploadPreviewReturn = async (request, h) => {
  const { eventId, companyId, returnId } = parseRequest(request);

  try {
    const match = find(request.jsonData, {returnId});

    if (!match) {
      throw Boom.notFound(`Return ${returnId} not found in upload`);
    }

    const validated = await uploadValidator.validate([match], companyId);

    // Load return from return service in order to get metadata
    const response = await returnsConnector.returns.findOne(returnId);
    throwIfError(response.error);

    const data = validated.map(row => mapSingleReturn(row, response.data));

    return {
      error: null,
      data: first(data)
    };
  } catch (error) {
    logger.error('Return upload preview failed', error, { eventId, companyId, returnId });
    throw error;
  }
};

/**
 * Update event to submitting status
 * @param  {Object} evt  - the event object
 * @param  {Array} data - array of return objects
 * @return {Object}
 */
const applySubmitting = (evt, data) => {
  return {
    ...evt,
    metadata: {
      returns: data.map(ret => ({
        returnId: ret.returnId,
        submitted: false,
        error: null
      }))
    },
    status: uploadStatus.SUBMITTING
  };
};

const isValidReturn = ret => ret.errors.length === 0;
const isValidatedEvent = evt => evt.status === 'validated';

const parseRequest = (request) => {
  const { eventId } = request.params;
  const { companyId, returnId } = request.query;
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
    if (!isValidatedEvent(request.evt)) {
      throw Boom.badRequest(`Event status not 'validated'`);
    }

    // Validate data in JSON
    const data = await uploadValidator.validate(request.jsonData, companyId);
    const valid = data.filter(isValidReturn);

    // Check 1+ valid returns
    if (valid.length < 1) {
      throw Boom.badRequest(`No valid returns found in submission`);
    }

    // Update event
    const updatedEvent = applySubmitting(request.evt, valid);
    await event.save(updatedEvent);

    // @TODO publish PG boss event

    return { data, error: null };
  } catch (error) {
    logger.error('Return upload preview failed', error, { eventId, companyId });
    throw error;
  }
};

exports.getReturn = getReturn;
exports.postReturn = postReturn;
exports.patchReturnHeader = patchReturnHeader;
exports.postUploadXml = postUploadXml;
exports.getUploadPreview = getUploadPreview;
exports.getUploadPreviewReturn = getUploadPreviewReturn;
exports.postUploadSubmit = postUploadSubmit;
