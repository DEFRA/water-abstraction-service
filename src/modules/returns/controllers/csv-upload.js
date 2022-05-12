'use strict';

/**
 * @module controller to handle the CSV bulk returns upload process
 */

const Boom = require('@hapi/boom');
const { find, set } = require('lodash');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

const eventFactory = require('../lib/event-factory');
const eventsService = require('../../../lib/services/events');
const s3 = require('../../../lib/services/s3');
const { uploadStatus, getUploadFilename } = require('../lib/returns-upload');
const { logger } = require('../../../logger');
const startUploadJob = require('../lib/jobs/start-upload');
const persistReturnsJob = require('../lib/jobs/persist-returns');
const { mapSingleReturn } = require('../lib/upload-preview-mapper');
const returnsConnector = require('../../../lib/connectors/returns');

const getEventStatusLink = eventId => `/water/1.0/event/${eventId}`;

/**
 * An API endpoint to upload a bulk return file.
 *  Kicks off job to upload submitted data.
 * @param {String} request.params.type - file type csv|xml
 * @param {String} request.query.companyId - the company CRM entity ID
 * @return {Promise} resolves with return data { error : null, data : {} }
 */
const postUpload = async (request, h) => {
  const { type } = request.params;
  const { companyId } = request.payload;

  let event = eventFactory.createBulkUploadEvent(request.payload.userName, type);

  try {
    // Create event
    event = await eventsService.create(event);

    // Upload user data to S3 bucket
    const filename = getUploadFilename(event.id, type);
    await s3.upload(filename, request.payload.fileData);

    // Format and add BullMQ message
    const jobId = await request.queueManager.add(startUploadJob.jobName, event, companyId);

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
  const { returnId } = request.params;

  try {
    const match = find(request.jsonData, { returnId });

    if (!match) {
      throw Boom.notFound(`Return ${returnId} not found in upload`, request.params);
    }

    const response = await returnsConnector.returns.findOne(returnId);

    throwIfError(response.error);

    const data = mapSingleReturn(match, response.data);

    return {
      data: {
        ...data,
        errors: []
      }
    };
  } catch (error) {
    logger.error('Return upload preview failed', error, request.params);
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
  const { eventId } = request.params;
  const { companyId } = request.query;
  try {
    // Check event status is 'validated'
    if (!isReadyEvent(request.event)) {
      throw Boom.badRequest('Event status not \'ready\'');
    }

    const valid = request.jsonData.filter(isValidReturn);

    // Check 1+ valid returns
    if (valid.length < 1) {
      throw Boom.badRequest('No valid returns found in submission');
    }

    // Update event
    await eventsService.update(applySubmitting(request.event, valid));

    // Format and add BullMQ message
    await request.queueManager.add(persistReturnsJob.jobName, { eventId });

    return { data: request.jsonData, error: null };
  } catch (error) {
    logger.error('Return upload preview failed', error, { eventId, companyId });
    throw error;
  }
};

exports.postUpload = postUpload;
exports.getUploadPreviewReturn = getUploadPreviewReturn;
exports.postUploadSubmit = postUploadSubmit;
