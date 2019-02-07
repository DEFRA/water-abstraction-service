const { cloneDeep } = require('lodash');

const licenceDataValue = require('./licence-data.json');

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
};

module.exports = {
  licences: () => cloneDeep(licences)
};
