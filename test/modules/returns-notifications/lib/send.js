const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');

const sinon = require('sinon');

const contactList = require('../../../../src/lib/contact-list');
const returns = require('../../../../src/lib/connectors/returns');

const { prepareMessageData } = require('../../../../src/modules/returns-notifications/lib/send');

const { data, ret, contact } = require('./test-data');

lab.experiment('Test send', () => {
  let baseUrl = process.env.base_url;

  lab.afterEach(async () => {
    process.env.base_url = baseUrl;
    returns.returns.findMany.restore();
    contactList.contactList.restore();
  });

  lab.test('It should call enqueue with correct data', async () => {
    process.env.base_url = 'http://localhost/return';
    sinon.stub(returns.returns, 'findMany').resolves({ data: [ret], error: null });
    sinon.stub(contactList, 'contactList').resolves([contact]);

    const result = await prepareMessageData(data);

    Code.expect(result).to.equal({ messageRef: 'pdf.testRef',
      personalisation:
   { address_line_1: 'Daisy Cottage',
     address_line_2: 'Buttercup Road',
     town: 'Testing',
     postcode: 'TT1 1TT',
     formatId: '01234567',
     qrUrl: 'http://localhost/return?returnId=v1:123:456',
     startDate: '2017-11-01',
     endDate: '2018-10-31',
     returnsFrequency: 'week' },
      licences: [ '01/123' ],
      individualEntityId: '31656ee1-1130-4d38-ab49-030c5336f3e7',
      companyEntityId: null,
      eventId: '27175f42-cae3-4e19-85fa-65e8fbff6125',
      messageType: 'letter',
      metadata: { returnId: 'v1:123:456' } });
  });

  lab.test('It should throw an error if contacts API call rejects', async () => {
    sinon.stub(returns.returns, 'findMany').resolves({ data: [ret], error: null });
    sinon.stub(contactList, 'contactList').rejects();

    Code.expect(prepareMessageData(data)).to.reject();
  });

  lab.test('It should throw an error if returns API call rejects', async () => {
    sinon.stub(returns.returns, 'findMany').rejects();
    sinon.stub(contactList, 'contactList').resolves([contact]);
    Code.expect(prepareMessageData(data)).to.reject();
  });

  lab.test('It should throw an error if returns API resolves with error', async () => {
    sinon.stub(returns.returns, 'findMany').resolves({ data: null, error: 'Some error' });
    sinon.stub(contactList, 'contactList').resolves([contact]);
    Code.expect(prepareMessageData(data)).to.reject();
  });
});

exports.lab = lab;
