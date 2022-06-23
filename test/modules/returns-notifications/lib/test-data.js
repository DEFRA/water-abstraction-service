// Define test data
const data = {
  eventId: '27175f42-cae3-4e19-85fa-65e8fbff6125',
  messageRef: 'pdf.testRef',
  licenceNumber: '01/123',
  config: {
    rolePriority: ['licence_holder', 'returns_to']
  }
}

const ret = {
  return_id: 'v1:123:456',
  licence_ref: '01/123',
  start_date: '2017-11-01',
  end_date: '2018-10-31',
  due_date: '2018-11-30',
  returns_frequency: 'week',
  metadata: {
    nald: {
      formatId: '01234567',
      regionCode: 5
    },
    description: 'Borehole A',
    isTwoPartTariff: true,
    purposes: [{
      tertiary: {
        description: 'Spray irrigation'
      }
    }]
  }
}

const contact = {

  contact: {
    entity_id: '31656ee1-1130-4d38-ab49-030c5336f3e7',
    address_1: 'Daisy Cottage',
    address_2: 'Buttercup Road',
    town: 'Testing',
    postcode: 'TT1 1TT'
  }
}

module.exports = {
  data,
  ret,
  contact
}
