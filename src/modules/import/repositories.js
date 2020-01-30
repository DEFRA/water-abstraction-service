const Repository = require('./lib/repository');
const { pool } = require('../../lib/connectors/db');

const repoConfig = {

  licence: {
    table: 'permit.licence',
    upsert: {
      fields: ['licence_regime_id', 'licence_type_id', 'licence_ref'],
      set: ['licence_status_id', 'licence_search_key', 'is_public_domain', 'licence_start_dt', 'licence_end_dt', 'licence_data_value']
    }
  },

  document: {
    table: 'crm.document_header',
    upsert: {
      fields: ['system_id', 'system_internal_id', 'regime_entity_id'],
      set: ['system_external_id', 'metadata']
    }
  },

  return: {
    table: 'returns.returns',
    primaryKey: 'return_id',
    upsert: {
      fields: ['return_id'],
      set: ['regime', 'licence_type', 'licence_ref', 'start_date', 'end_date', 'returns_frequency', 'status', 'source', 'metadata', 'received_date']
    }
  },

  version: {
    table: 'returns.versions',
    upsert: {
      fields: ['version_id'],
      set: ['return_id', 'user_id', 'user_type', 'version_number', 'metadata', 'nil_return']
    }
  },

  line: {
    table: 'returns.lines',
    upsert: {
      fields: ['version_id', 'end_date'],
      set: ['version_id', 'substance', 'quantity', 'unit', 'start_date', 'end_date', 'time_period', 'metadata', 'reading_type']
    }
  }

};

module.exports = {
  licence: new Repository(pool, repoConfig.licence),
  document: new Repository(pool, repoConfig.document),
  return: new Repository(pool, repoConfig.return),
  version: new Repository(pool, repoConfig.version),
  line: new Repository(pool, repoConfig.line)
};
