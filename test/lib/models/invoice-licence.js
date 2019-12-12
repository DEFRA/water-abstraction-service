const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { InvoiceLicence, Address, Company, Licence } =
  require('../../../src/lib/models');
const Contact = require('../../../src/lib/models/contact-v2');

const createData = () => {
  const licence = new Licence();
  licence.licenceNumber = '01/123';

  const company = new Company();
  company.id = '8e1052db-08e0-4b21-bce0-c3497892a890';

  const contact = new Contact();
  contact.id = '276fc2f4-bfe0-45a9-8fdb-6bf0d481b7ea';

  const address = new Address();
  address.id = '11c0fdc8-0645-45a1-86e3-5413d4a203ba';

  return {
    id: 'bc9541fc-bc20-4cf4-a72e-412795748e5d',
    licence,
    company,
    contact,
    address
  };
};

experiment('lib/models/invoice-licence', () => {
  let invoiceLicence, data;

  beforeEach(async () => {
    data = createData();
    invoiceLicence = new InvoiceLicence();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      invoiceLicence.id = data.id;
      expect(invoiceLicence.id).to.equal(data.id);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        invoiceLicence.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.licence', () => {
    test('can be set to a Licence instance', async () => {
      invoiceLicence.licence = data.licence;
      expect(invoiceLicence.licence).to.equal(data.licence);
    });

    test('throws an error if set to an invalid type', async () => {
      const func = () => {
        invoiceLicence.licence = '01/234/ABC';
      };
      expect(func).to.throw();
    });
  });

  experiment('.company', () => {
    test('can be set to a Company instance', async () => {
      invoiceLicence.company = data.company;
      expect(invoiceLicence.company).to.equal(data.company);
    });

    test('throws an error if set to an invalid type', async () => {
      const func = () => {
        invoiceLicence.company = data.licence;
      };
      expect(func).to.throw();
    });
  });

  experiment('.contact', () => {
    test('can be set to a Contact instance', async () => {
      invoiceLicence.contact = data.contact;
      expect(invoiceLicence.contact).to.equal(data.contact);
    });

    test('throws an error if set to an invalid type', async () => {
      const func = () => {
        invoiceLicence.contact = data.company;
      };
      expect(func).to.throw();
    });
  });

  experiment('.address', () => {
    test('can be set to a Address instance', async () => {
      invoiceLicence.address = data.address;
      expect(invoiceLicence.address).to.equal(data.address);
    });

    test('throws an error if set to an invalid type', async () => {
      const func = () => {
        invoiceLicence.address = data.company;
      };
      expect(func).to.throw();
    });
  });

  experiment('.uniqueId', () => {
    beforeEach(async () => {
      invoiceLicence.licence = data.licence;
      invoiceLicence.company = data.company;
      invoiceLicence.address = data.address;
      invoiceLicence.contact = data.contact;
    });

    test('returns a string', async () => {
      expect(invoiceLicence.uniqueId).to.be.a.string();
    });

    test('string is a composite of licence number, company ID, address ID and contact ID', async () => {
      expect(invoiceLicence.uniqueId).to.equal(
        '01/123.8e1052db-08e0-4b21-bce0-c3497892a890.11c0fdc8-0645-45a1-86e3-5413d4a203ba.276fc2f4-bfe0-45a9-8fdb-6bf0d481b7ea'
      );
    });
  });
});
