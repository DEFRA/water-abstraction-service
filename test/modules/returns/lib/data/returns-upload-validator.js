
const createReturn = data => ({
  startDate: '2017-11-01',
  endDate: '2018-10-31',
  dueDate: '2018-11-28',
  receivedDate: '2018-11-15',
  frequency: 'month',
  isNil: true,
  status: 'due',
  versionNumber: 1,
  isCurrent: true,
  meters: [],
  user: {
    email: 'mail@example.com',
    entityId: 'd9c5412c-8993-49b9-9d20-b8f2208ccd8e',
    type: 'external'
  },
  ...data
})

module.exports = {
  companyId: 'company_1',
  licenceRegimeId: 1,
  licenceTypeId: 8,
  documents: [
    {
      system_external_id: '01/ABC',
      company_entity_id: 'some_other_company'
    },
    {
      system_external_id: '05/678',
      company_entity_id: 'company_1'
    },
    {
      system_external_id: '06/890',
      company_entity_id: 'company_1'
    }
  ],
  licences: [
    {
      licence_ref: '05/678',
      '?column?': '1'
    },
    {
      licence_ref: '06/890',
      '?column?': '2'
    }
  ],
  returns: [
    {
      return_id: 'v1:1:05/678:456:2017-11-01:2018-10-31',
      status: 'completed',
      start_date: '2017-11-01',
      end_date: '2018-10-31',
      returns_frequency: 'month'
    },
    {
      return_id: 'v1:2:06/890:789:2017-11-01:2018-10-31',
      status: 'due',
      start_date: '2017-11-01',
      end_date: '2018-10-31',
      returns_frequency: 'month'
    },
    {
      return_id: 'v1:2:06/890:789:2019-02-01:2019-02-28',
      status: 'due',
      start_date: '2019-02-01',
      end_date: '2019-02-28',
      returns_frequency: 'month'
    }
  ],
  upload: [
    createReturn({
      returnId: 'v1:1:01/234:01234:2017-11-01:2018-10-31',
      licenceNumber: '01/234'
    }),
    createReturn({
      returnId: 'v1:1:01/ABC:01234:2017-11-01:2018-10-31',
      licenceNumber: '01/ABC'
    }),
    createReturn({
      returnId: 'v1:1:05/678:0123:2017-11-01:2018-10-31',
      licenceNumber: '05/678'
    }),
    createReturn({
      returnId: 'v1:1:05/678:456:2017-11-01:2018-10-31',
      licenceNumber: '05/678'
    }),
    createReturn({
      returnId: 'v1:2:06/890:789:2017-11-01:2018-10-31',
      licenceNumber: '06/890'
    }),
    createReturn({
      returnId: 'v1:2:06/890:789:2019-02-01:2019-02-28',
      licenceNumber: '06/890',
      isNil: false,
      lines: [
        {
          timePeriod: 'month',
          startDate: '2019-02-01',
          endDate: '2019-02-28',
          quantity: '0'
        },
        {
          timePeriod: 'month',
          startDate: '2019-03-01',
          endDate: '2019-03-31',
          quantity: '0'
        }
      ]
    }),
    createReturn({
      returnId: 'v1:2:06/890:789:2019-02-01:2019-02-28',
      licenceNumber: '06/890',
      isNil: false,
      frequency: 'day',
      startDate: '2019-02-01',
      endDate: '2019-02-28',
      lines: [
        {
          timePeriod: 'day',
          startDate: '2019-02-01',
          endDate: '2019-02-01',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-02',
          endDate: '2019-02-02',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-03',
          endDate: '2019-02-03',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-04',
          endDate: '2019-02-04',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-05',
          endDate: '2019-02-05',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-06',
          endDate: '2019-02-06',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-07',
          endDate: '2019-02-07',
          quantity: '8'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-08',
          endDate: '2019-02-08',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-09',
          endDate: '2019-02-09',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-10',
          endDate: '2019-02-10',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-11',
          endDate: '2019-02-11',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-12',
          endDate: '2019-02-12',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-13',
          endDate: '2019-02-13',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-14',
          endDate: '2019-02-14',
          quantity: '8'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-15',
          endDate: '2019-02-15',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-16',
          endDate: '2019-02-16',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-17',
          endDate: '2019-02-17',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-18',
          endDate: '2019-02-18',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-19',
          endDate: '2019-02-19',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-20',
          endDate: '2019-02-20',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-21',
          endDate: '2019-02-21',
          quantity: '8'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-22',
          endDate: '2019-02-22',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-23',
          endDate: '2019-02-23',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-24',
          endDate: '2019-02-24',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-25',
          endDate: '2019-02-25',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-26',
          endDate: '2019-02-26',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-27',
          endDate: '2019-02-27',
          quantity: '0'
        },
        {
          timePeriod: 'day',
          startDate: '2019-02-28',
          endDate: '2019-02-28',
          quantity: '8'
        }
      ]
    })
  ]
}
