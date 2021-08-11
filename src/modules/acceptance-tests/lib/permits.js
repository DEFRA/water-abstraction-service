const permitsConnector = require('../../../lib/connectors/permit');
const moment = require('moment');

const { ACCEPTANCE_TEST_SOURCE } = require('./constants');

const formatMoment = date => date.format('DD/MM/YYYY');
const formatMomentIso = date => date.toISOString();

const testAddress = {
  TOWN: 'Test town',
  COUNTY: 'Test county',
  COUNTRY: 'null',
  POSTCODE: 'AT1 1AT',
  ADDR_LINE1: 'Test address line 1',
  ADDR_LINE2: 'Test address line 2',
  ADDR_LINE3: 'Test address line 3',
  ADDR_LINE4: 'Test address line 4',
  ID: '9000022',
  FGAC_REGION_CODE: '6'
};

const testQuanties = {
  INST_QTY: '12',
  HOURLY_QTY: '12',
  DAILY_QTY: '123',
  ANNUAL_QTY: '12345'
};

const testPurpose = {
  purpose_primary: { CODE: 'P', DESCR: 'Production Of Energy' },
  purpose_tertiary: { CODE: '80', DESCR: 'Evaporative Cooling', ALSF_CODE: 'H' },
  purpose_secondary: { CODE: 'ELC', DESCR: 'Electricity' }
};

const TEST_PARTY_ID = '9999999';

const getLicenceData = (licenceRef, startDate, endDate) => {
  return {
    ID: '9000000',
    data: {
      cams: [],
      roles: [
        {
          array: [
            {
              CODE: 'WP',
              DESCR: 'Work Phone',
              CONT_NO: '01234 567 567',
              ACON_AADD_ID: '9000020',
              ACON_APAR_ID: TEST_PARTY_ID,
              FGAC_REGION_CODE: '6'
            }
          ],
          role_type: { CODE: 'EO', DESCR: 'Enforcement Officer' },
          role_party: {
            ID: TEST_PARTY_ID,
            NAME: 'Test',
            DESCR: 'Test role description',
            FORENAME: 'Test role first name',
            INITIALS: 'N',
            APAR_TYPE: 'PER',
            SALUTATION: 'Ms'
          },
          role_detail: {
            ID: '9000004',
            EFF_ST_DATE: formatMoment(startDate),
            ACON_AADD_ID: '9000020',
            ACON_APAR_ID: TEST_PARTY_ID,
            EFF_END_DATE: formatMoment(endDate)
          },
          role_address: testAddress
        }
      ],
      purposes: [
        {
          ID: '9000007',
          LANDS: 'Boldly outlined on map',
          NOTES: 'null',
          purpose: [testPurpose],
          ...testQuanties,
          PERIOD_ST_DAY: '1',
          purposePoints: [
            {
              NOTES: 'null',
              point_detail: {
                ID: '90000012',
                NGR1_EAST: '1234',
                LOCAL_NAME: 'Test purpose local name',
                NGR1_NORTH: '1234',
                NGR1_SHEET: 'TQ',
                FGAC_REGION_CODE: '6'
              },
              point_source: {
                CODE: 'ABC',
                NAME: 'Test source name',
                NOTES: 'Test source notes',
                CART_NORTH: '1234',
                LOCAL_NAME: 'Test local name',
                FGAC_REGION_CODE: '6'
              },
              FGAC_REGION_CODE: '6',
              means_of_abstraction: {
                CODE: 'ABC',
                DESCR: 'Test means of abstraction',
                NOTES: 'null'
              }
            }
          ],
          APUR_APPR_CODE: 'P',
          APUR_APSE_CODE: 'ELC',
          APUR_APUS_CODE: '80',
          PERIOD_END_DAY: '31',
          PERIOD_ST_MONTH: '1',
          TIMELTD_ST_DATE: 'null',
          FGAC_REGION_CODE: '6',
          PERIOD_END_MONTH: '12',
          TIMELTD_END_DATE: 'null',
          licenceAgreements: [],
          licenceConditions: []
        }
      ],
      versions: [
        {
          APP_NO: licenceRef,
          STATUS: 'CURR',
          INCR_NO: '0',
          parties: [
            {
              ID: TEST_PARTY_ID,
              NAME: 'Test party name',
              DESCR: 'null',
              FORENAME: 'null',
              INITIALS: 'null',
              contacts: [
                {
                  AADD_ID: '9000020',
                  APAR_ID: TEST_PARTY_ID,
                  party_address: testAddress,
                  FGAC_REGION_CODE: '6'
                }
              ],
              APAR_TYPE: 'ORG',
              LOCAL_NAME: 'null',
              SALUTATION: 'null',
              FGAC_REGION_CODE: '6'
            }
          ],
          ISSUE_NO: '100',
          EFF_ST_DATE: formatMoment(startDate),
          RETURNS_REQ: 'Y',
          ACON_AADD_ID: '9000020',
          ACON_APAR_ID: TEST_PARTY_ID,
          EFF_END_DATE: formatMoment(endDate),
          LIC_SIG_DATE: formatMoment(startDate),
          FGAC_REGION_CODE: '6'
        }
      ],
      current_version: {
        party: {
          ID: TEST_PARTY_ID,
          NAME: 'Testing',
          DESCR: 'null',
          FORENAME: 'null',
          INITIALS: 'null',
          APAR_TYPE: 'ORG',
          LOCAL_NAME: 'null',
          SALUTATION: 'null',
          FGAC_REGION_CODE: '6',
          ASIC_ASID_DIVISION: 'null'
        },
        address: testAddress,
        formats: [
          {
            ID: '9000025',
            DESCR: 'Test format description',
            CC_IND: 'N',
            points: [
              {
                ID: '9000026',
                AADD_ID: '9000020',
                NGR1_EAST: '1234',
                LOCAL_NAME: 'Test point local name',
                NGR1_NORTH: '1234',
                NGR1_SHEET: 'TQ',
                FGAC_REGION_CODE: '6'
              }
            ],
            TPT_FLAG: 'N',
            purposes: [
              {
                ARTY_ID: '9000027',
                PURP_ALIAS: 'Evaporative Cooling',
                APUR_APPR_CODE: 'P',
                APUR_APSE_CODE: 'ELC',
                APUR_APUS_CODE: '80',
                primary_purpose: 'Production Of Energy',
                FGAC_REGION_CODE: '6',
                tertiary_purpose: 'Evaporative Cooling',
                secondary_purpose: 'Electricity'
              }
            ],
            ANNUAL_QTY: '1234',
            SITE_DESCR: 'Test site description',
            TIMELTD_ST_DATE: 'null',
            FGAC_REGION_CODE: '6',
            FORM_PRODN_MONTH: '10',
            TIMELTD_END_DATE: 'null',
            ABS_PERIOD_ST_DAY: '1',
            ABS_PERIOD_END_DAY: '31',
            ARTC_REC_FREQ_CODE: 'D',
            ARTC_RET_FREQ_CODE: 'A',
            FORMS_REQ_ALL_YEAR: 'Y',
            ABS_PERIOD_ST_MONTH: '1',
            ABS_PERIOD_END_MONTH: '12'
          }
        ],
        licence: {
          CODE: 'FULL',
          DESCR: 'Full Licence (>=28 Days)',
          party: [
            {
              ID: '9000029',
              NAME: 'Test party name',
              APAR_TYPE: 'ORG',
              FGAC_REGION_CODE: '6'
            }
          ],
          STATUS: 'CURR',
          INCR_NO: '0',
          ISSUE_NO: '100',
          EFF_ST_DATE: formatMoment(startDate),
          RETURNS_REQ: 'Y',
          ACON_AADD_ID: '9000020',
          ACON_APAR_ID: TEST_PARTY_ID,
          EFF_END_DATE: 'null',
          LIC_SIG_DATE: formatMoment(startDate),
          FGAC_REGION_CODE: '6'
        },
        purposes: [
          {
            ID: '9000030',
            LANDS: 'Boldly outlined on map',
            NOTES: 'null',
            purpose: [testPurpose],
            ...testQuanties,
            PERIOD_ST_DAY: '1',
            purposePoints: [
              {
                NOTES: 'null',
                point_detail: {
                  ID: '9000031',
                  AADD_ID: '9000020',
                  NGR1_EAST: '1234',
                  LOCAL_NAME: 'Test local name',
                  NGR1_NORTH: '1234',
                  NGR1_SHEET: 'TQ',
                  FGAC_REGION_CODE: '6'
                },
                point_source: {
                  CODE: 'ABC',
                  NAME: 'Test point source name',
                  NOTES: 'Test point source notes',
                  CART_NORTH: '1234',
                  LOCAL_NAME: 'Test local name',
                  FGAC_REGION_CODE: '6'
                },
                FGAC_REGION_CODE: '6',
                means_of_abstraction: { CODE: 'UNP', DESCR: 'Unspecified Pump' }
              }
            ],
            APUR_APPR_CODE: 'P',
            APUR_APSE_CODE: 'ELC',
            APUR_APUS_CODE: '80',
            PERIOD_END_DAY: '31',
            PERIOD_ST_MONTH: '1',
            TIMELTD_ST_DATE: 'null',
            FGAC_REGION_CODE: '6',
            PERIOD_END_MONTH: '12',
            TIMELTD_END_DATE: 'null',
            licenceAgreements: [],
            licenceConditions: []
          }
        ],
        expiry_date: formatMoment(endDate),
        version_effective_date: startDate.format('YYYYMMDD'),
        original_effective_date: startDate.format('YYYYMMDD')
      }
    },
    NOTES: 'Licence notes',
    LIC_NO: licenceRef,
    REV_DATE: 'null',
    vmlVersion: 2,
    EXPIRY_DATE: formatMoment(endDate),
    LAPSED_DATE: 'null',
    ORIG_EFF_DATE: formatMoment(startDate),
    ORIG_SIG_DATE: formatMoment(startDate),
    FGAC_REGION_CODE: '6'
  };
};

const createPermitRow = (startDate, endDate, licenceRef, licenceData) => {
  return {
    licence_status_id: 1,
    licence_type_id: 8,
    licence_regime_id: 1,
    licence_start_dt: formatMomentIso(startDate),
    licence_end_dt: formatMomentIso(endDate),
    licence_ref: licenceRef,
    licence_data_value: JSON.stringify(licenceData),
    metadata: JSON.stringify({ source: ACCEPTANCE_TEST_SOURCE })
  };
};

const createCurrentLicence = async (licenceRef) => {
  const startDate = moment().subtract(1, 'year');
  const endDate = moment().add(1, 'year');
  const licence = getLicenceData(licenceRef, startDate, endDate);

  const row = createPermitRow(startDate, endDate, licenceRef, licence);
  const { data } = await permitsConnector.licences.create(row);
  return data;
};

exports.createCurrentLicence = createCurrentLicence;
