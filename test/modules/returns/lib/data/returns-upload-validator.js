
const createReturn = data => ({
  startDate: '2017-11-01',
  endDate: '2018-10-31',
  dueDate: '2018-11-28',
  receivedDate: '2018-11-15',
  frequency: 'week',
  isNil: true,
  status: 'due',
  versionNumber: 1,
  isCurrent: true,
  user: {
    email: 'mail@example.com',
    entityId: 'd9c5412c-8993-49b9-9d20-b8f2208ccd8e',
    type: 'external'
  },
  ...data,
  metadata: {}
});

module.exports = {
  'companyId': 'company_1',
  'licenceRegimeId': 1,
  'licenceTypeId': 8,
  'documents': [
    {
      'system_external_id': '01/ABC',
      'company_entity_id': 'some_other_company'
    },
    {
      'system_external_id': '05/678',
      'company_entity_id': 'company_1'
    },
    {
      'system_external_id': '06/890',
      'company_entity_id': 'company_1'
    }
  ],
  'licences': [
    {
      'licence_ref': '05/678',
      '?column?': '1'
    },
    {
      'licence_ref': '06/890',
      '?column?': '2'
    }
  ],
  'returns': [
    {
      'return_id': 'v1:1:05/678:456:2017-11-01:2018-10-31',
      'status': 'completed'
    },
    {
      'return_id': 'v1:2:06/890:789:2017-11-01:2018-10-31',
      'status': 'due'
    },
    {
      'return_id': 'v1:2:06/890:789:2019-02-01:2019-02-28',
      'status': 'due'
    }
  ],
  'upload': [
    createReturn({
      'returnId': 'v1:1:01/234:01234:2017-11-01:2018-10-31',
      'licenceNumber': '01/234'
    }),
    createReturn({
      'returnId': 'v1:1:01/ABC:01234:2017-11-01:2018-10-31',
      'licenceNumber': '01/ABC'
    }),
    createReturn({
      'returnId': 'v1:1:05/678:0123:2017-11-01:2018-10-31',
      'licenceNumber': '05/678'
    }),
    createReturn({
      'returnId': 'v1:1:05/678:456:2017-11-01:2018-10-31',
      'licenceNumber': '05/678'
    }),
    createReturn({
      'returnId': 'v1:2:06/890:789:2017-11-01:2018-10-31',
      'licenceNumber': '06/890'
    }),
    createReturn({
      'returnId': 'v1:2:06/890:789:2019-02-01:2019-02-28',
      'licenceNumber': '06/890',
      'isNil': false,
      'lines': [
        {
          'timePeriod': 'month',
          'startDate': '2019-02-01',
          'endDate': '2019-02-28',
          'quantity': '0'
        },
        {
          'timePeriod': 'month',
          'startDate': '2019-03-01',
          'endDate': '2019-03-31',
          'quantity': '0'
        }
      ]
    })
  ]
};
