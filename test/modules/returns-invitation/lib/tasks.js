const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const {
  createReturnsIndex, getTransformedReturnsContacts, formatReturn
} = require('../../../../src/modules/returns-invitation/lib/tasks');

const returns = [{
  'return_id': 'v1:123:456',
  'licence_ref': '01/123'
}, {
  'return_id': 'v1:789:123',
  'licence_ref': '01/123'
}, {
  'return_id': 'v1:142:635',
  'licence_ref': '01/456'
}];

experiment('createReturnsIndex', () => {
  test('It should create an index of return IDs by licence ref', async () => {
    const index = createReturnsIndex(returns);
    expect(index).to.equal(
      { '01/123': [ 'v1:123:456', 'v1:789:123' ],
        '01/456': [ 'v1:142:635' ] });
  });
});

experiment('getTransformedReturnsContacts', () => {
  const state = {
    returns
  };

  const data = [{
    system_external_id: '01/123',
    contacts: [{
      role: 'licence_holder',
      name: 'Contact A'
    }, {
      role: 'returns_contact',
      name: 'Contact B'
    }]
  }, {
    system_external_id: '01/456',
    contacts: [{
      role: 'licence_holder',
      name: 'Contact C'
    }]
  }];

  test('It should transform contacts returned from CRM API', async () => {
    const index = createReturnsIndex(returns);
    const contacts = getTransformedReturnsContacts(data, index, ['returns_contact', 'licence_holder'], state);

    expect(contacts).to.equal([
      { data: { system_external_id: '01/123', return_return_id: 'v1:123:456', return_licence_ref: '01/123' },
        contact: { role: 'returns_contact', name: 'Contact B' },
        group: 'dbd14dea22213a945d901c068458242f1b02ff44' },
      { data: { system_external_id: '01/123', return_return_id: 'v1:789:123', return_licence_ref: '01/123' },
        contact: { role: 'returns_contact', name: 'Contact B' },
        group: 'dbd14dea22213a945d901c068458242f1b02ff44' },
      { data: { system_external_id: '01/456', return_return_id: 'v1:142:635', return_licence_ref: '01/456' },
        contact: { role: 'licence_holder', name: 'Contact C' },
        group: 'ef6e40de93886bada7430abc6382d9b5b4d91282' } ]);
  });
});

experiment('formatReturn for use in Notify personalisation', () => {
  const ret = {
    return_id: 'v1:123',
    start_date: '2017-11-01',
    end_date: '2018-10-31',
    due_date: '2018-11-28',
    licence_ref: '01/123'
  };

  test('It should convert keys to have return_ prefix', async () => {
    const result = formatReturn(ret);
    expect(Object.keys(result)).to.equal([
      'return_return_id',
      'return_start_date',
      'return_end_date',
      'return_due_date', 'return_licence_ref'
    ]);
  });

  test('Dates should be converted to human readable form ', async () => {
    const result = formatReturn(ret);
    expect(result.return_start_date).to.equal('1 November 2017');
    expect(result.return_end_date).to.equal('31 October 2018');
    expect(result.return_due_date).to.equal('28 November 2018');
  });
});
