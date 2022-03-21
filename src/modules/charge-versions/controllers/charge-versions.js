'use strict';

const Boom = require('@hapi/boom');

const controller = require('../../../lib/controller');
const documentsConnector = require('../../../lib/connectors/crm/documents');
const licencesService = require('../../../lib/services/licences');
const chargeElementsService = require('../../../lib/services/charge-elements');
const chargeVersionsService = require('../../../lib/services/charge-versions');
const chargeVersionWorkflowService = require('../services/charge-version-workflows');
const mapErrorResponse = require('../../../lib/map-error-response');

const userMapper = require('../../../lib/mappers/user');

const { logger } = require('../../../logger');
const eventFactory = require('../../charge-versions-upload/lib/event-factory');
const eventsService = require('../../../lib/services/events');
const { getUploadFilename, uploadStatus } = require('../../charge-versions-upload/lib/charge-information-upload');
const s3 = require('../../../lib/services/s3');
const startUploadJob = require('../../charge-versions-upload/jobs/update-charge-information-start');
const errorEvent = require('../../charge-versions-upload/lib/error-event');
const chargeInformationUpload = require('../../charge-versions-upload/lib/charge-information-upload');

const getEventStatusLink = eventId => `/water/1.0/event/${eventId}`;

/**
 * Gets a charge version complete with its elements and agreements
 * @param  {String}  request.params.versionId - the charge version ID
 */
const getChargeVersion = async request =>
  controller.getEntity(
    request.params.versionId,
    chargeVersionsService.getByIdWithInvoiceAccount
  );

const getChargeVersionsByDocumentId = async request => {
  const { documentId } = request.params;

  const { data: document } = await documentsConnector.getDocument(documentId, true);
  const chargeVersions = await chargeVersionsService.getByLicenceRef(document.system_external_id);

  return { data: chargeVersions };
};

const getChargeVersionsByLicenceId = async request => {
  const { licenceId } = request.params;
  const chargeVersions = await chargeVersionsService.getByLicenceId(licenceId);
  return { data: chargeVersions };
};

/**
 * Gets the default expected charge elements based on abstraction data
 * for the specified licence version
 * @param {String} request.params.licenceVersionId
 */
const getDefaultChargesForLicenceVersion = async request => {
  const { licenceVersionId } = request.params;

  const licenceVersion = await licencesService.getLicenceVersionById(licenceVersionId);

  return licenceVersion === null
    ? Boom.notFound('No licence version found')
    : chargeElementsService.getChargeElementsFromLicenceVersion(licenceVersion);
};

/**
 * Create a charge version from the specified workflow
 * @param {String} request.params.chargeVersionWorkflowId
 */
const postCreateFromWorkflow = async request => {
  const { chargeVersionWorkflowId } = request.params;
  try {
    const chargeVersionWorkflow = await chargeVersionWorkflowService.getById(chargeVersionWorkflowId);
    if (!chargeVersionWorkflow) {
      return Boom.notFound(`Charge version workflow ${chargeVersionWorkflowId} not found`);
    }

    const approvedBy = userMapper.pojoToModel(request.defra.internalCallingUser);
    return chargeVersionWorkflowService.approve(chargeVersionWorkflow, approvedBy);
  } catch (err) {
    logger.error(`Error creating charge version from workflow ${chargeVersionWorkflowId}`, err);
    return mapErrorResponse(err);
  }
};

/**
 * An API endpoint to upload the charge information file.
 *  Kicks off job to upload submitted data.
 * @param {String} request.params.filename - filename
 * @return {Promise} resolves with return data { error : null, data : {} }
 */
const postUpload = async (request, h) => {
  const { userName, fileData, filename } = request.payload;

  let event = eventFactory.createChargeInformationUploadEvent(userName, filename);

  try {
    // Create event
    event = await eventsService.create(event);

    // Upload user data to S3 bucket
    const uploadFilename = getUploadFilename(event);
    await s3.upload(uploadFilename, fileData);

    // Format and add BullMQ message
    const jobId = await request.queueManager.add(startUploadJob.jobName, event);

    return h.response({
      data: {
        eventId: event.id,
        statusLink: getEventStatusLink(event.id),
        jobId
      },
      error: null
    }).code(202);
  } catch (error) {
    logger.error('Failed to upload charge information', error);
    if (event.id) {
      event.status = uploadStatus.ERROR;
      await eventsService.update(event);
    }

    return h.response({ data: null, error }).code(500);
  }
};

const getDownloadErrorFile = async (request, h) => {
  const { eventId } = request.params || {};
  const event = await eventsService.findOne(eventId);
  if (!event) {
    return errorEvent.throwEventNotFoundError(eventId);
  }
  const s3Object = await chargeInformationUpload.getChargeInformationErrorsS3Object(event);
  return h.response(s3Object.Body).type('text/csv');
};

exports.getChargeVersion = getChargeVersion;
exports.getChargeVersionsByDocumentId = getChargeVersionsByDocumentId;
exports.getDefaultChargesForLicenceVersion = getDefaultChargesForLicenceVersion;
exports.postCreateFromWorkflow = postCreateFromWorkflow;
exports.getChargeVersionsByLicenceId = getChargeVersionsByLicenceId;
exports.postUpload = postUpload;
exports.getDownloadErrorFile = getDownloadErrorFile;
