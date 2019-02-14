const { getSchemaDoc } = require('./xml-helpers');

const validateXml = async (xmlReturnDoc) => {
  const schema = await getSchemaDoc();
  if (xmlReturnDoc.validate(schema)) return true;
  return xmlReturnDoc.validationErrors.map(error => {
    return {
      message: error.message,
      line: error.line
    };
  });
};

module.exports.validateXml = validateXml;
