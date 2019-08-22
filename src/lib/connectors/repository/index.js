const { pool } = require('../db');
const ChargeVersionRepository = require('./ChargeVersionRepository');
const ChargeElementRepository = require('./ChargeElementRepository');
const ChargeAgreementRepository = require('./ChargeAgreementRepository');

const chargeVersions = new ChargeVersionRepository({
  connection: pool,
  table: 'water.charge_versions',
  primaryKey: 'charge_version_id'
});

const chargeElements = new ChargeElementRepository({
  connection: pool,
  table: 'water.charge_elements',
  primaryKey: 'charge_element_id'
});

const chargeAgreements = new ChargeAgreementRepository({
  connection: pool,
  table: 'water.charge_agreements',
  primaryKey: 'charge_agreement_id'
});

module.exports = {
  chargeVersions,
  chargeElements,
  chargeAgreements
};
