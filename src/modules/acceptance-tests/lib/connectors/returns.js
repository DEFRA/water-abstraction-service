const config = require('../../../../../config')
const { serviceRequest, urlJoin } = require('@envage/water-abstraction-helpers')
const { logger } = require('../../../../logger')

const createUrl = urlTail => urlJoin(config.services.returns, urlTail)

const createEntity = url => body => serviceRequest.post(url, { body }).catch(err => logger.error(err))

const tearDown = url => () => serviceRequest.delete(url).catch(err => logger.error(err))

exports.createReturn = createEntity(createUrl('returns'))
exports.createVersions = createEntity(createUrl('versions'))
exports.createLines = createEntity(createUrl('lines'))
exports.tearDown = tearDown(createUrl('acceptance-tests'))
