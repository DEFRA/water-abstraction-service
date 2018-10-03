const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const actionCreators = require('../../../../src/modules/returns-invitation/lib/action-creators.js');

experiment('actionCreators', () => {
  const testConfig = {
    name: 'Notification: test',
    prefix: 'NOTE:',
    messageRef: {
      default: 'test_letter'
    },
    rolePriority: ['role_a', 'role_b'],
    issuer: 'mail@example.com',
    sendAfter: '2018-10-01'
  };

  const returns = [{
    start_date: '2017-11-01',
    end_date: '2018-10-01',
    status: 'due'
  }];

  const contact = {
    name: 'Bob',
    address_1: 'Daisy Farm',
    postcode: 'DD1 1DD'
  };

  const messages = [{
    recipient: 'bob@example.com'
  }, {
    recipient: 'dave@example.com'
  }];

  test('init with valid config should return action', async () => {
    const action = actionCreators.init(testConfig);

    expect(action).to.equal({
      'type': 'init',
      'payload': {
        'config': {
          'name': 'Notification: test',
          'prefix': 'NOTE:',
          'messageRef': {
            'default': 'test_letter'
          },
          'rolePriority': [
            'role_a',
            'role_b'
          ],
          'issuer': 'mail@example.com',
          'sendAfter': '2018-10-01'
        },
        'documentFilter': null,
        'returnsFilter': null,
        'taskConfig': {},
        'notifyTemplate': {},
        'event': {},
        'personalisation': {},
        'returns': [],
        'licences': [],
        'contacts': [],
        'messages': []
      }
    });
  });

  test('init with invalid config should throw an error', async () => {
    const createAction = () => {
      return actionCreators.init({
        ...testConfig,
        issuer: 'Test'
      });
    };
    expect(createAction).to.throw();
  });

  test('setReturnFilter', async () => {
    const action = actionCreators.setReturnFilter({
      status: 'due'
    });
    expect(action).to.equal({ type: 'set.returnFilter', payload: { status: 'due' } });
  });

  test('setReturns', async () => {
    const action = actionCreators.setReturns(returns);
    expect(action).to.equal(
      { type: 'set.returns',
        payload:
          [ { start_date: '2017-11-01',
            end_date: '2018-10-01',
            status: 'due' } ] });
  });

  test('addContact', async () => {
    const action = actionCreators.addContact(contact);
    expect(action).to.equal({ type: 'add.contact',
      payload: { name: 'Bob', address_1: 'Daisy Farm', postcode: 'DD1 1DD' } });
  });

  test('setContacts', async () => {
    const action = actionCreators.setContacts([contact]);
    expect(action).to.equal({ type: 'set.contacts',
      payload:
   [ { name: 'Bob', address_1: 'Daisy Farm', postcode: 'DD1 1DD' } ] });
  });

  test('createEvent with event ID supplied', async () => {
    const action = actionCreators.createEvent('TEST-EVENT', '83c8d4a1-aa43-4e81-ac13-6417ef6264e2');
    expect(action).to.equal({ type: 'create.event',
      payload:
   { eventId: '83c8d4a1-aa43-4e81-ac13-6417ef6264e2',
     reference: 'TEST-EVENT' } });
  });

  test('createEvent with auto-ID generation', async () => {
    const action = actionCreators.createEvent('TEST-EVENT');
    expect(action.type).to.equal('create.event');
    expect(action.payload.reference).to.equal('TEST-EVENT');
    expect(action.payload.eventId).to.have.length(36);
  });

  test('setMessages', async () => {
    const action = actionCreators.setMessages(messages);
    expect(action).to.equal({ type: 'set.messages',
      payload:
   [ { recipient: 'bob@example.com' },
     { recipient: 'dave@example.com' } ] });
  });

  test('setNotifyTemplate with default message type and Notify key', async () => {
    const action = actionCreators.setNotifyTemplate('template-id');
    expect(action).to.equal({ type: 'set.notifyTemplate',
      payload:
   { templateId: 'template-id',
     notifyKey: 'test',
     messageType: 'default' } });
  });

  test('setNotifyTemplate with custom notify key', async () => {
    const action = actionCreators.setNotifyTemplate('template-id', 'live');
    expect(action).to.equal({ type: 'set.notifyTemplate',
      payload:
   { templateId: 'template-id',
     notifyKey: 'live',
     messageType: 'default' } });
  });

  test('setNotifyTemplate with custom notify key and message type', async () => {
    const action = actionCreators.setNotifyTemplate('template-id', 'live', 'sms');
    expect(action).to.equal({ type: 'set.notifyTemplate',
      payload:
   { templateId: 'template-id',
     notifyKey: 'live',
     messageType: 'sms' } });
  });

  test('setPersonalisation', async () => {
    const action = actionCreators.setPersonalisation({ name: 'Bob', gauging_station: 'Teston' });
    expect(action).to.equal({ type: 'set.personalisation',
      payload: { name: 'Bob', gauging_station: 'Teston' }});
  });
});
