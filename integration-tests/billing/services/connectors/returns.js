const config = require('../../../../config');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const urlJoin = require('url-join');
const { logger } = require('../../../../src/logger');

const createUrl = urlTail => urlJoin(config.services.returns, urlTail);

const createEntity = url => body => serviceRequest.post(url, { body }).catch(err => logger.error(err));

const tearDown = url => () => serviceRequest.delete(url);

exports.createReturn = createEntity(createUrl('returns'));
exports.createVersions = createEntity(createUrl('versions'));
exports.createLines = createEntity(createUrl('lines'));
exports.tearDown = tearDown(createUrl('acceptance-tests'));
