const fs = require('fs')
const libxmljs = require('libxmljs')
const util = require('util')
const path = require('path')
const readFile = util.promisify(fs.readFile)

/**
 * Gets libxmljs doc for the XSD schema
 * @return {Promise}
 */
const getSchemaDoc = async () => {
  const schema = await readFile(path.join(__dirname, './xml-returns-schema.xsd'), 'utf-8')
  return libxmljs.parseXml(schema)
}

/**
 * Validates the supplied XML doc
 * @param  {String}  xmlStr - the XML file to validate
 * @return {Promise} resolves with { isValid, validationErrors }
 */
const validateXml = async (xmlStr) => {
  const xmlReturnDoc = libxmljs.parseXml(xmlStr)
  const schema = await getSchemaDoc()

  const isValid = xmlReturnDoc.validate(schema)

  const validationErrors = isValid
    ? null
    : xmlReturnDoc.validationErrors.map(error => {
      return {
        message: error.message,
        line: error.line
      }
    })

  return { isValid, validationErrors }
}

module.exports.validateXml = validateXml
