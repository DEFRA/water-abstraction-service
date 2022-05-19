const { cloneDeep } = require('lodash')

const licenceDataValue = require('./licence-data.json')
const emptyActions = {
  actions: []
}

const licences = {
  data: [{
    licence_data_value: licenceDataValue,
    licence_status_id: '1',
    licence_type_id: '8',
    licence_regime_id: '1',
    licence_id: '1234',
    licence_search_key: null,
    is_public_domain: null,
    licence_start_dt: '2018-01-01T23:00:00.000Z',
    licence_end_dt: null,
    licence_ref: '12/34/56/78',
    licence_summary: null,
    metadata: null
  }],
  error: null
}

const abstractionReformActions = () => ({
  status: 'In progress',
  actions: [
    {
      type: 'edit.version',
      payload: {
        data: { CHARGEABLE: 'Y' },
        user: { id: 1234, email: 'test@example.com' },
        timestamp: 1550148300724,
        issueNumber: 100,
        incrementNumber: 0
      }
    }
  ],
  lastEdit: {
    user: { id: 2392, email: 'markswaffer.defra@gmail.com' },
    timestamp: 1550148602230
  }
})

const emptyAbstractionReform = () => {
  const shell = cloneDeep(licences)
  shell.data[0].licence_data_value = emptyActions
  return shell
}

const abstractionReformLicence = () => {
  const shell = cloneDeep(licences)
  shell.data[0].licence_data_value = abstractionReformActions()
  return shell
}

const getWaterLicence = () => {
  const shell = cloneDeep(licences)
  return shell.data[0]
}

const getExpiringLicence = () => {
  const shell = cloneDeep(licences)
  shell.data[0].licence_end_dt = '01/01/2021'
  return shell
}

module.exports = {
  licences: () => cloneDeep(licences),
  emptyAbstractionReform,
  abstractionReformLicence,
  getWaterLicence,
  getExpiringLicence
}
