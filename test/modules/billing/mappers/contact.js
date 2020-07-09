const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const contactMapper = require('../../../../src/modules/billing/mappers/contact');
const Contact = require('../../../../src/lib/models/contact-v2');

experiment('modules/billing/mappers/contact .crmToModel', () => {
  let contactData, result;
  beforeEach(() => {
    contactData = {
      salutation: 'Sir',
      firstName: 'John',
      lastName: 'Testington',
      suffix: 'MBE',
      department: 'Hydrology',
      type: 'person'
    };
    result = contactMapper.crmToModel(contactData);
  });

  test('result is a Contact model', () => {
    expect(result).to.be.instanceOf(Contact);
  });

  test('maps the title', () => {
    expect(result.title).to.equal(contactData.salutation);
  });

  test('maps the first name', () => {
    expect(result.firstName).to.equal(contactData.firstName);
  });

  test('maps the last name', () => {
    expect(result.lastName).to.equal(contactData.lastName);
  });

  test('maps the suffix', () => {
    expect(result.suffix).to.equal(contactData.suffix);
  });

  test('maps the department', () => {
    expect(result.department).to.equal(contactData.department);
    expect(result.type).to.equal(contactData.type);
  });

  test('maps the type', () => {
    expect(result.type).to.equal(contactData.type);
  });

  experiment('maps the initials correctly', () => {
    test('when the initials field is provided', () => {
      const result = contactMapper.crmToModel({ initials: 'J T' });
      expect(result.initials).to.equal('J T');
    });

    test('when the middle initials field is provided', () => {
      const result = contactMapper.crmToModel({ firstName: 'John', middleInitials: 'T' });
      expect(result.initials).to.equal('J T');
    });

    test('when no initials are provided', () => {
      const result = contactMapper.crmToModel({ firstName: 'John', lastName: 'Testington' });
      expect(result.initials).to.equal(null);
    });
  });

  experiment('when data passed in is null', () => {
    beforeEach(() => {
      result = contactMapper.crmToModel(null);
    });

    test('returns null', () => {
      expect(result).to.be.null();
    });
  });
});
