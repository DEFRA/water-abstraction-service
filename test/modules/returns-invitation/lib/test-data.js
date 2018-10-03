module.exports = {
  state: {
    config: {
      name: 'Test notification',
      messageRef: {
        default: 'template_name'
      },
      issuer: 'mail@example.com'
    },
    event: {
      event_id: 'event_id'
    },
    contacts: [{
      entity_id: 'entity_a',
      address_1: 'Daisy Farm',
      address_2: 'Testington',
      postcode: 'DD1 1DD',
      data: {
        system_external_id: 'licence_a'
      }
    }, {
      entity_id: 'entity_b',
      address_1: 'Buttercup Farm',
      address_2: 'Testtown',
      postcode: 'BC1 1FF',
      data: [{
        system_external_id: 'licence_b'
      }, {
        system_external_id: 'licence_c'
      }]
    }, {
      entity_id: 'entity_c',
      email: 'entity_c@example.com',
      data: {
        system_external_id: 'licence_d'
      }
    }]
  }
};
