const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');

const { getJobData, formatAddressKeys } = require('../../../../src/modules/returns-notifications/lib/message-helpers.js');

lab.experiment('Test getJobData', () => {
  const ret = {
    return_id: 'v1:123:456',
    licence_ref: '01/123'
  };

  const event = {
    event_id: '12345'
  };

  const messageRef = 'REF';

  lab.test('getJobData should format object', async () => {
    const obj = getJobData(ret, event, messageRef);

    Code.expect(obj).to.equal({
      eventId: event.event_id,
      returnId: ret.return_id,
      messageRef,
      licenceNumber: ret.licence_ref
    });
  });
});

lab.experiment('Test formatAddressKeys', () => {
  const contact = {
    town: 'Bristol',
    address_1: 'Daisy House',
    address_12: 'Windy Lane',
    address_email: 'mail@example.com'
  };

  lab.test('formatAddressKeys should replace address_<i> keys with address_line_<i> and leave other keys unchanged', async () => {
    const obj = formatAddressKeys(contact);

    Code.expect(obj).to.equal({
      town: 'Bristol',
      address_line_1: 'Daisy House',
      address_line_12: 'Windy Lane',
      address_email: 'mail@example.com'
    });
  });
});

exports.lab = lab;
