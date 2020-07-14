'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');

const validators = require('../../../../src/modules/companies/validators/invoice-accounts');

experiment('modules/companies/validators/invoice-accounts', () => {
  experiment('.validateAddress', () => {
    experiment('when addressId is provided', () => {
      experiment('addressId', () => {
        test('is required', () => {
          const { error } = validators.validateAddress({ });
          expect(error).to.not.be.null();
        });

        test('cannot be a string that is not a guid', () => {
          const { error } = validators.validateAddress({ addressId: 'address-id' });
          expect(error).to.not.be.null();
        });

        test('is valid when it is a guid', () => {
          const addressId = uuid();
          const { error, value } = validators.validateAddress({ addressId });
          expect(error).to.be.null();
          expect(value.addressId).to.equal(addressId);
        });
      });

      test('other address data must not be present', () => {
        const address = {
          addressId: uuid(),
          addressLine3: '123',
          addressLine4: 'Assertion Avenue',
          town: 'Teston-super-mare',
          postcode: 'TT1 1TT'
        };
        const { error } = validators.validateAddress(address);
        expect(error).to.not.be.null();
      });
    });

    experiment('when addressId is not provided', () => {
      let address;
      beforeEach(() => {
        address = {
          addressLine1: 'First Floor',
          addressLine2: 'Test HQ',
          addressLine3: '123',
          addressLine4: 'Assertion Avenue',
          town: 'Teston-super-mare',
          county: 'Testingshire',
          country: 'UK',
          postcode: 'TT1 1TT',
          uprn: 123456
        };
      });

      experiment('addressLine1, addressLine2, addressLine3, addressLine4, town, county', () => {
        const keys = ['addressLine1', 'addressLine2', 'addressLine3', 'addressLine4', 'town', 'county'];

        keys.forEach(key => {
          test(`${key}: is optional`, async () => {
            delete address[key];

            const { error } = validators.validateAddress(address);
            expect(error).to.equal(null);
          });

          test(`${key}: is valid when present`, async () => {
            const { error, value } = validators.validateAddress(address);
            expect(error).to.equal(null);
            expect(value[key]).to.equal(address[key]);
          });
        });
      });

      test('at least 1 of addressLine2 and addressLine3 are required', async () => {
        address.addressLine2 = '';
        address.addressLine3 = '';
        const { error } = validators.validateAddress(address);
        expect(error.details[0].message).to.equal('"addressLine2" is not allowed to be empty');
      });

      test('at least 1 of addressLine4 and town are required', async () => {
        address.addressLine4 = '';
        address.town = '';
        const { error } = validators.validateAddress(address);
        expect(error.details[0].message).to.equal('"addressLine4" is not allowed to be empty');
      });

      experiment('country', () => {
        test('is required', async () => {
          delete address.country;

          const { error } = validators.validateAddress(address);
          expect(error).to.not.equal(null);
        });

        test('cannot equal an empty string', async () => {
          address.country = '';

          const { error } = validators.validateAddress(address);
          expect(error).to.not.equal(null);
        });

        test('cannot equal white space', async () => {
          address.country = '    ';

          const { error } = validators.validateAddress(address);
          expect(error).to.not.equal(null);
        });

        test('is valid when present', async () => {
          const { error, value } = validators.validateAddress(address);
          expect(error).to.equal(null);
          expect(value.country).to.equal(address.country);
        });

        test('is trimmed and valid when present with extra whitespace', async () => {
          address.country = '   new country   ';
          const { error, value } = validators.validateAddress(address);
          expect(error).to.equal(null);
          expect(value.country).to.equal('new country');
        });

        test('removes full stops', async () => {
          address.country = 'U.K.';
          const { error, value } = validators.validateAddress(address);
          expect(error).to.equal(null);
          expect(value.country).to.equal('UK');
        });
      });

      experiment('uprn', () => {
        test('is optional', async () => {
          delete address.uprn;

          const { error } = validators.validateAddress(address);
          expect(error).to.equal(null);
        });

        test('cannot be a string', async () => {
          address.uprn = 'abc';

          const { error } = validators.validateAddress(address);
          expect(error).to.not.equal(null);
        });

        test('cannot equal white space', async () => {
          address.uprn = '    ';

          const { error } = validators.validateAddress(address);
          expect(error).to.not.equal(null);
        });

        test('is valid when present', async () => {
          const { error, value } = validators.validateAddress(address);
          expect(error).to.equal(null);
          expect(value.uprn).to.equal(address.uprn);
        });
      });

      experiment('postcode', () => {
        experiment('when the country is not part of the UK', () => {
          beforeEach(async () => {
            address.country = 'France';
          });

          test('the postcode can be omitted', async () => {
            delete address.postcode;
            const { error, value } = validators.validateAddress(address);
            expect(error).to.equal(null);
            expect(value.postcode).to.equal(null);
          });

          test('a postcode can be supplied', async () => {
            address.postcode = 'TEST';
            const { error, value } = validators.validateAddress(address);
            expect(error).to.equal(null);
            expect(value.postcode).to.equal('TEST');
          });

          test('an empty postcode resolves to null', async () => {
            address.postcode = '';
            const { error, value } = validators.validateAddress(address);
            expect(error).to.equal(null);
            expect(value.postcode).to.equal(null);
          });

          test('a whitespace postcode resolves to null', async () => {
            address.postcode = '    ';
            const { error, value } = validators.validateAddress(address);
            expect(error).to.equal(null);
            expect(value.postcode).to.equal(null);
          });
        });

        const countries = [
          'United Kingdom',
          'ENGLAND',
          'wales',
          'Scotland',
          'Northern IRELAND',
          'UK',
          'U.K',
          'u.k.'
        ];

        countries.forEach(country => {
          experiment(`when the country is ${country}`, async () => {
            beforeEach(async () => {
              address.country = country;
            });
            test('the postcode is mandatory', async () => {
              delete address.postcode;
              const { error } = validators.validateAddress(address);
              expect(error).to.not.equal(null);
            });

            test('an invalid postcode is rejected', async () => {
              address.postcode = 'nope';
              const { error } = validators.validateAddress(address);
              expect(error).to.not.equal(null);
            });

            test('a valid postcode is trimmed', async () => {
              address.postcode = 'BS98 1TL';
              const { error, value } = validators.validateAddress(address);
              expect(error).to.equal(null);
              expect(value.postcode).to.equal('BS98 1TL');
            });

            test('a postcode can be without spaces', async () => {
              address.postcode = 'BS981TL';
              const { error, value } = validators.validateAddress(address);
              expect(error).to.equal(null);
              expect(value.postcode).to.equal('BS98 1TL');
            });

            test('a postcode will be uppercased', async () => {
              address.postcode = 'bs98 1TL';
              const { error, value } = validators.validateAddress(address);
              expect(error).to.equal(null);
              expect(value.postcode).to.equal('BS98 1TL');
            });
          });
        });
      });
    });
  });

  experiment('.validateAgentCompany', () => {
    experiment('when companyId is provided', () => {
      experiment('companyId', () => {
        test('is required', () => {
          const { error } = validators.validateAgentCompany({});
          expect(error).to.not.be.null();
        });

        test('cannot be a string that is not a guid', () => {
          const { error } = validators.validateAgentCompany({ companyId: 'company-id' });
          expect(error).to.not.be.null();
        });

        test('is valid when it is a guid', () => {
          const companyId = uuid();
          const { error, value } = validators.validateAgentCompany({ companyId });
          expect(error).to.be.null();
          expect(value.companyId).to.equal(companyId);
        });
      });

      test('other company data must not be present', () => {
        const agentCompany = {
          companyId: uuid(),
          name: 'Test Company Ltd'
        };
        const { error } = validators.validateAgentCompany(agentCompany);
        expect(error).to.not.be.null();
      });
    });

    experiment('when companyId is not provided', () => {
      let agentCompany;
      beforeEach(() => {
        agentCompany = {
          type: 'limitedCompany',
          name: 'Test Company Ltd',
          companyNumber: 'SO123456'
        };
      });

      test('agentCompany is optional', () => {
        const result = validators.validateAgentCompany();
        expect(result).to.be.undefined();
      });

      test('cannot be an expected value', () => {
        agentCompany.type = 'unexpected-type';
        const { error } = validators.validateAgentCompany(agentCompany);
        expect(error).to.not.be.null();
      });

      experiment('type', () => {
        test('is required', async () => {
          delete agentCompany.type;

          const { error } = validators.validateAgentCompany(agentCompany);
          expect(error).to.not.be.null();
        });

        validators.COMPANY_TYPES.forEach(type => {
          test(`can be set to ${type}`, async () => {
            agentCompany.type = type;

            const { error, value } = validators.validateAgentCompany(agentCompany);
            expect(error).to.be.null();
            expect(value.type).to.equal(type);
          });
        });
      });

      experiment('name', () => {
        test('is required', async () => {
          delete agentCompany.name;

          const { error } = validators.validateAgentCompany(agentCompany);
          expect(error).to.not.be.null();
        });

        test('cannot equal an empty string', async () => {
          agentCompany.name = '';

          const { error } = validators.validateAgentCompany(agentCompany);
          expect(error).to.not.be.null();
        });

        test('cannot equal white space', async () => {
          agentCompany.name = '    ';

          const { error } = validators.validateAgentCompany(agentCompany);
          expect(error).to.not.be.null();
        });

        test('is valid when present', async () => {
          const { error, value } = validators.validateAgentCompany(agentCompany);
          expect(error).to.be.null();
          expect(value.name).to.equal(agentCompany.name);
        });

        test('is trimmed and valid when present with extra whitespace', async () => {
          agentCompany.name = '   new company   ';
          const { error, value } = validators.validateAgentCompany(agentCompany);
          expect(error).to.be.null();
          expect(value.name).to.equal('new company');
        });

        test('removes full stops', async () => {
          agentCompany.name = 'new company ltd.';
          const { error, value } = validators.validateAgentCompany(agentCompany);
          expect(error).to.be.null();
          expect(value.name).to.equal('new company ltd');
        });
      });

      experiment('companyNumber', () => {
        test('is optional', async () => {
          delete agentCompany.companyNumber;

          const { error } = validators.validateAgentCompany(agentCompany);
          expect(error).to.be.null();
        });

        test('must have a length of 8', async () => {
          agentCompany.companyNumber = 'abc123';

          const { error } = validators.validateAgentCompany(agentCompany);
          expect(error).to.not.be.null();
        });

        test('cannot equal white space', async () => {
          agentCompany.companyNumber = '    ';

          const { error } = validators.validateAgentCompany(agentCompany);
          expect(error).to.not.be.null();
        });

        test('is valid when present', async () => {
          const { error, value } = validators.validateAgentCompany(agentCompany);
          expect(error).to.be.null();
          expect(value.companyNumber).to.equal(agentCompany.companyNumber);
        });

        test('will be uppercased', async () => {
          agentCompany.companyNumber = 'sc123456';

          const { error, value } = validators.validateAgentCompany(agentCompany);
          expect(error).to.be.null();
          expect(value.companyNumber).to.equal('SC123456');
        });
      });
    });
  });

  experiment('.validateContact', () => {
    experiment('when contactId is provided', () => {
      experiment('contactId', () => {
        test('cannot be a string that is not a guid', () => {
          const { error } = validators.validateContact({ contactId: 'contact-id' });
          expect(error).to.not.be.null();
        });

        test('is valid when it is a guid', () => {
          const contactId = uuid();
          const { error, value } = validators.validateContact({ contactId });
          expect(error).to.be.null();
          expect(value.contactId).to.equal(contactId);
        });
      });

      test('other contact data must not be present', () => {
        const contact = {
          contactId: uuid(),
          firstName: 'Bob'
        };
        const { error } = validators.validateContact(contact);
        expect(error).to.not.be.null();
      });
    });

    experiment('when contactId is not provided', () => {
      experiment('type', () => {
        test('is required', async () => {
          const { error } = validators.validateContact({ department: 'department' });
          expect(error).to.not.be.null();
        });

        test('cannot be an expected value', () => {
          const { error } = validators.validateContact({ type: 'unexpected-type' });
          expect(error).to.not.be.null();
        });
      });

      experiment('and contact is a person', () => {
        let contact;
        beforeEach(() => {
          contact = {
            type: 'person',
            title: 'Dr',
            firstName: 'Bob',
            middleInitials: 'M',
            lastName: 'Jones',
            suffix: 'OBE',
            department: 'Hydrology Dept'
          };
        });

        experiment('title, middleInitials, suffix, department', () => {
          const keys = ['title', 'middleInitials', 'suffix', 'department'];

          keys.forEach(key => {
            test(`${key}: is optional`, async () => {
              delete contact[key];

              const { error } = validators.validateContact(contact);
              expect(error).to.equal(null);
            });

            test(`${key}: is valid when present`, async () => {
              const { error, value } = validators.validateContact(contact);
              expect(error).to.equal(null);
              expect(value[key]).to.equal(contact[key]);
            });

            test(`${key}: is trimmed when present with extra whitespace`, async () => {
              const trimmedValue = contact[key];
              contact[key] = `     ${trimmedValue}      `;
              const { error, value } = validators.validateContact(contact);
              expect(error).to.be.null();
              expect(value[key]).to.equal(trimmedValue);
            });

            test(`${key}: removes full stops`, async () => {
              const expectedValue = contact[key];
              contact[key] = `${expectedValue}.`;
              const { error, value } = validators.validateContact(contact);
              expect(error).to.be.null();
              expect(value[key]).to.equal(expectedValue);
            });
          });
        });

        experiment('firstName', () => {
          test('is required', async () => {
            delete contact.firstName;

            const { error } = validators.validateContact(contact);
            expect(error).to.not.be.null();
          });

          test('cannot equal an empty string', async () => {
            contact.firstName = '';

            const { error } = validators.validateContact(contact);
            expect(error).to.not.be.null();
          });

          test('cannot equal white space', async () => {
            contact.firstName = '    ';

            const { error } = validators.validateContact(contact);
            expect(error).to.not.be.null();
          });

          test('is valid when present', async () => {
            const { error, value } = validators.validateContact(contact);
            expect(error).to.be.null();
            expect(value.firstName).to.equal(contact.firstName);
          });

          test('is trimmed and valid when present with extra whitespace', async () => {
            contact.firstName = '   Bob   ';
            const { error, value } = validators.validateContact(contact);
            expect(error).to.be.null();
            expect(value.firstName).to.equal('Bob');
          });
        });

        experiment('lastName', () => {
          test('is required', async () => {
            delete contact.lastName;

            const { error } = validators.validateContact(contact);
            expect(error).to.not.be.null();
          });

          test('cannot equal an empty string', async () => {
            contact.lastName = '';

            const { error } = validators.validateContact(contact);
            expect(error).to.not.be.null();
          });

          test('cannot equal white space', async () => {
            contact.lastName = '    ';

            const { error } = validators.validateContact(contact);
            expect(error).to.not.be.null();
          });

          test('is valid when present', async () => {
            const { error, value } = validators.validateContact(contact);
            expect(error).to.be.null();
            expect(value.lastName).to.equal(contact.lastName);
          });

          test('is trimmed and valid when present with extra whitespace', async () => {
            contact.lastName = '   Jones   ';
            const { error, value } = validators.validateContact(contact);
            expect(error).to.be.null();
            expect(value.lastName).to.equal('Jones');
          });
        });
      });

      experiment('and contact is a department', () => {
        let contact;
        beforeEach(() => {
          contact = {
            type: 'department',
            department: 'Hydrology Dept'
          };
        });

        experiment('department', () => {
          test('is required', async () => {
            delete contact.department;

            const { error } = validators.validateContact(contact);
            expect(error).to.not.be.null();
          });

          test('cannot equal an empty string', async () => {
            contact.department = '';

            const { error } = validators.validateContact(contact);
            expect(error).to.not.be.null();
          });

          test('cannot equal white space', async () => {
            contact.department = '    ';

            const { error } = validators.validateContact(contact);
            expect(error).to.not.be.null();
          });

          test('is valid when present', async () => {
            const { error, value } = validators.validateContact(contact);
            expect(error).to.be.null();
            expect(value.department).to.equal(contact.department);
          });

          test('is trimmed and valid when present with extra whitespace', async () => {
            contact.department = '   Hydrology Dept   ';
            const { error, value } = validators.validateContact(contact);
            expect(error).to.be.null();
            expect(value.department).to.equal('Hydrology Dept');
          });

          test('removes full stops', async () => {
            contact.department = 'Hydrology Dept.';
            const { error, value } = validators.validateContact(contact);
            expect(error).to.be.null();
            expect(value.department).to.equal('Hydrology Dept');
          });
        });
      });
    });
  });
});
