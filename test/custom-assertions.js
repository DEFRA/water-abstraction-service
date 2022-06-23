const { expect } = require('@hapi/code')
const Joi = require('joi')

const isUuid = value => Joi.string().uuid().validate(value).error === undefined

const assertIsUuid = value => expect(value).to.satisfy(isUuid)

exports.assertIsUuid = assertIsUuid
