const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const {
  createReturnsIndex, getTransformedReturnsContacts
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
    const contacts = getTransformedReturnsContacts(data, index, ['returns_contact', 'licence_holder']);

    expect(contacts).to.equal([ { data: { system_external_id: '01/123', return_id: 'v1:123:456' },
      contact: { role: 'returns_contact', name: 'Contact B' },
      group: 'dbd14dea22213a945d901c068458242f1b02ff44' },
    { data: { system_external_id: '01/123', return_id: 'v1:789:123' },
      contact: { role: 'returns_contact', name: 'Contact B' },
      group: 'dbd14dea22213a945d901c068458242f1b02ff44' },
    { data: { system_external_id: '01/456', return_id: 'v1:142:635' },
      contact: { role: 'licence_holder', name: 'Contact C' },
      group: 'ef6e40de93886bada7430abc6382d9b5b4d91282' } ]);
  });
});
