'use strict'

const urlJoin = require('url-join')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

const getUri = (...tail) => urlJoin(config.services.import, 'jobs', ...tail)

/**
 * Gets a summary of the job queue in the water_import schema
 */
const getSummary = () => serviceRequest.get(getUri('summary'))

exports.getSummary = getSummary
