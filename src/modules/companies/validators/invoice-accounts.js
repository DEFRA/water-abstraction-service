const Joi = require('@hapi/joi');

const CONTACT_TYPES = ['person', 'department'];
const COMPANY_TYPES = ['individual', 'limitedCompany', 'partnership', 'limitedLiabilityPartnership'];

const mandatoryPostcodeCountries = [
  'united kingdom',
  'england',
  'wales',
  'scotland',
  'northern ireland',
  'uk'
];

// https://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom#Validation
const postcodeRegex = /^(([A-Z]{1,2}[0-9][A-Z0-9]?|ASCN|STHL|TDCU|BBND|[BFS]IQQ|PCRN|TKCA) ?[0-9][A-Z]{2}|BFPO ?[0-9]{1,4}|(KY[0-9]|MSR|VG|AI)[ -]?[0-9]{4}|[A-Z]{2} ?[0-9]{2}|GE ?CX|GIR ?0A{2}|SAN ?TA1)$/;

const newAddressSchema = Joi.object({
  address1: Joi.string().optional(),
  address2: Joi.string().optional(),
  address3: Joi.when('address2', { is: null, then: Joi.string().required(), otherwise: Joi.string().optional() }),
  address4: Joi.string().optional(),
  town: Joi.when('address4', { is: null, then: Joi.string().required(), otherwise: Joi.string().optional() }),
  county: Joi.string().optional(),
  country: Joi.string().trim().replace(/\./g, '').required(),
  postcode: Joi.string().trim().empty('').default(null).optional().when('country', {
    is: Joi.string().lowercase().replace(/\./g, '').valid(mandatoryPostcodeCountries),
    then: Joi.string().required()
      // uppercase and remove any spaces (BS1 1SB -> BS11SB)
      .uppercase().replace(/ /g, '')
      // then ensure the space is before the inward code (BS11SB -> BS1 1SB)
      .replace(/(.{3})$/, ' $1').regex(postcodeRegex)
  }),
  uprn: Joi.number().integer().min(0).default(null).allow(null)
}).or('address2', 'address3').or('address4', 'town');

const existingAddressSchema = Joi.object({
  addressId: Joi.string().guid().required()
});

const newCompanySchema = Joi.object({
  type: Joi.string().valid(COMPANY_TYPES).required(),
  name: Joi.string().trim().replace(/\./g, '').required(),
  companyNumber: Joi.string().uppercase().replace(/ /g, '').length(8).optional()
});

const existingCompanySchema = Joi.object({
  companyId: Joi.string().guid().required()
});

const contactPersonSchema = Joi.object({
  title: Joi.string().trim().replace(/\./g, '').optional(),
  firstName: Joi.string().trim().required(),
  middleInitials: Joi.string().trim().replace(/\./g, '').optional(),
  lastName: Joi.string().trim().required(),
  suffix: Joi.string().trim().replace(/\./g, '').optional(),
  department: Joi.string().trim().replace(/\./g, '').optional()
});

const contactDepartmentSchema = Joi.object({
  department: Joi.string().trim().replace(/\./g, '').required()
});

const contactTypeSchema = Joi.string().valid(CONTACT_TYPES).required();

const existingContactSchema = Joi.object({
  contactId: Joi.string().guid().required()
});

const validateAddress = address => {
  const { addressId, ...newAddressData } = address;
  if (addressId) return Joi.validate(address, existingAddressSchema, { abortEarly: false });
  return Joi.validate(newAddressData, newAddressSchema, { abortEarly: false });
};

const validateAgentCompany = agentCompany => {
  if (!agentCompany) return;
  const { companyId, ...newCompanyData } = agentCompany;
  if (companyId) return Joi.validate(agentCompany, existingCompanySchema, { abortEarly: false });
  return Joi.validate(newCompanyData, newCompanySchema, { abortEarly: false });
};

const contactSchema = {
  person: contactPersonSchema,
  department: contactDepartmentSchema
};

const validateNewContactData = contact => {
  const { type, ...newContactData } = contact;
  const { error } = Joi.validate(type, contactTypeSchema);
  if (error) return error;

  return Joi.validate(newContactData, contactSchema[type], { abortEarly: false });
};

const validateContact = contact => {
  const { contactId, ...rest } = contact;
  if (contactId) return Joi.validate(contact, existingContactSchema, { abortEarly: false });
  return validateNewContactData(rest);
};

exports.COMPANY_TYPES = COMPANY_TYPES;
exports.CONTACT_TYPES = CONTACT_TYPES;
exports.validateAddress = validateAddress;
exports.validateAgentCompany = validateAgentCompany;
exports.validateContact = validateContact;
