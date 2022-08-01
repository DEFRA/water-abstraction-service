'use strict'

const Boom = require('@hapi/boom')

const applicationStateService = require('../../lib/services/application-state')

const getApplicationState = async request => {
  const { key } = request.params
  const state = await applicationStateService.get(key)
  return state || Boom.notFound(`No application state for key: ${key}`)
}

const postApplicationState = async (request, h) => {
  const { key } = request.params
  const data = request.payload
  return applicationStateService.save(key, data)
}

exports.getApplicationState = getApplicationState
exports.postApplicationState = postApplicationState
