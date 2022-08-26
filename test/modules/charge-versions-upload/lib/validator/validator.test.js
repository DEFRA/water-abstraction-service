'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const repos = require('../../../../../src/lib/connectors/repos')
const { billing } = require('../../../../../config')
const { validate } = require('../../../../../src/modules/charge-versions-upload/lib/validator')
const helpers = require('../../../../../src/modules/charge-versions-upload/lib/helpers')

const SUPPORTED_SOURCE_NAME = 'Valid Supported Source Name'
const PURPOSE_USE_DESCRIPTION = 'Valid Purpose Use Description'
const PURPOSE_USE_DESCRIPTION_TPT = 'Valid Purpose Use Description With Two Part Tariff'
const LINE_DESCRIPTION = 'Valid Line Description'
const INVOICE_ACCOUNT = 'Valid Invoice Account'

const testRow = {
  licence_number: 'TEST/LICENCE/1',
  charge_information_start_date: '01/04/2022',
  charge_information_billing_account: 'TEST/BILLING/ACCOUNT',
  charge_element_purpose: PURPOSE_USE_DESCRIPTION_TPT,
  charge_element_description: 'Test Description',
  charge_element_abstraction_period: '01/04-31/03',
  charge_element_authorised_quantity: '2920.123456',
  charge_element_time_limit_start: '',
  charge_element_time_limit_end: '',
  charge_element_loss: 'medium',
  charge_element_agreement_apply: 'Y',
  charge_reference_details_charge_element_group: 'A',
  charge_reference_details_source: 'N',
  charge_reference_details_loss: 'medium',
  charge_reference_details_volume: '2920',
  charge_reference_details_water_availability: 'Y',
  charge_reference_details_modelling: 'tier 1',
  charge_reference_line_description: LINE_DESCRIPTION,
  charge_reference_details_supported_source_charge: 'N',
  charge_reference_details_supported_source_name: '',
  charge_reference_details_public_water_supply: 'Y',
  charge_reference_details_aggregate_factor: '1',
  charge_reference_details_adjustment_factor: '1',
  charge_reference_details_abatement_factor: '0.1',
  charge_reference_details_winter_discount: 'N',
  charge_reference_details_two_part_tariff_agreement_applies: 'N',
  charge_reference_details_canal_and_river_trust_agreement_applies: 'N',
  charge_information_notes: ''
}

const getHeadings = data => Object.keys(data)
const getValues = data => Object.values(data)

const testValidate = async (firstRow, ...otherRows) => validate([getHeadings(firstRow), getValues(firstRow), ...otherRows.map(getValues)].join('\n'))

const rowErrors = validationErrors => ({
  validationErrors,
  errorType: 'rows',
  isValid: false
})

experiment('validator', () => {
  beforeEach(() => {
    sandbox.stub(helpers, 'getLicence')
    sandbox.stub(helpers, 'getLicenceVersionPurposes')
    sandbox.stub(helpers, 'getInvoiceAccount')
    sandbox.stub(helpers, 'getPurposeUses')
    sandbox.stub(helpers, 'confirmPurposeExists')
    sandbox.stub(helpers, 'getSupportedSources')
    sandbox.stub(helpers, 'updateEventStatus')
    sandbox.stub(repos.supportedSources, 'findAll')
    sandbox.stub(repos.purposeUses, 'findAll')
    sandbox.stub(billing, 'srocStartDate')
    helpers.clearCache()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.validate', () => {
    const dummyLicence = {
      startDate: '2022-03-31',
      expiredDate: '2022-05-01',
      lapsedDate: '2022-05-01',
      revokedDate: '2022-05-01',
      isWaterUndertaker: true
    }

    beforeEach(() => {
      billing.srocStartDate = new Date('2022-04-01')
      helpers.getSupportedSources.resolves([
        { name: SUPPORTED_SOURCE_NAME }
      ])
      helpers.getPurposeUses.resolves([
        { description: PURPOSE_USE_DESCRIPTION, isTwoPartTariff: false },
        { description: PURPOSE_USE_DESCRIPTION_TPT, isTwoPartTariff: true }
      ])

      // TODO: Correctly stub helpers.confirmPurposeExists

      helpers.getLicence = async licenceNumber => licenceNumber === 'INVALID'
        ? undefined
        : dummyLicence
      helpers.getLicenceVersionPurposes.resolves([
        { purposeUse: { description: PURPOSE_USE_DESCRIPTION } },
        { purposeUse: { description: PURPOSE_USE_DESCRIPTION_TPT } }
      ])
      helpers.getInvoiceAccount.resolves([INVOICE_ACCOUNT])
      helpers.updateEventStatus.resolves()
    })

    test('when the number of headings is inconsistent with the number of rows', async () => {
      const result = await validate(['heading-1,heading-2', 'col-1'].join('\n'))
      expect(result).to.equal({
        validationErrors: ['Number of columns is inconsistent on line 2'],
        errorType: 'parse',
        isValid: false
      })
    })

    experiment('with a single row', () => {
      test('when the contents of a csv are valid ', async () => {
        expect(await testValidate(testRow)).to.equal({
          isValid: true
        })
      })

      experiment('when the licence number', () => {
        test('is blank', async () => {
          const row = { ...testRow, licence_number: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, licence_number is blank']))
        })

        test('is invalid', async () => {
          const row = { ...testRow, licence_number: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, licence_number is not valid']))
        })
      })

      experiment('when the charge information start date', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_information_start_date: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_information_start_date is blank']))
        })

        test('has an incorrect date format', async () => {
          const row = { ...testRow, charge_information_start_date: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, "charge_information_start_date has an incorrect format, expected DD/MM/YYYY"']))
        })

        test('is before the licence start date', async () => {
          const row = { ...testRow, charge_information_start_date: '30/03/2022' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_information_start_date is before the licence start date']))
        })

        test('is before 1 April 2022', async () => {
          const row = { ...testRow, charge_information_start_date: '31/03/2022' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_information_start_date is before 1 April 2022']))
        })
      })

      experiment('when the charge element purpose', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_element_purpose: '', charge_element_agreement_apply: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_purpose is blank']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, charge_element_purpose: 'INVALID', charge_element_agreement_apply: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_purpose is not an accepted term']))
        })
      })

      test('when the charge element description is blank', async () => {
        const row = { ...testRow, charge_element_description: '' }
        expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_description is blank']))
      })

      test('when the charge element abstraction period has an incorrect date format', async () => {
        const row = { ...testRow, charge_element_abstraction_period: 'INVALID' }
        expect(await testValidate(row)).to.equal(rowErrors(['Row 2, "charge_element_abstraction_period is an incorrect format, expected DD/MM-DD/MM"']))
      })

      experiment('when the charge element authorised quantity', () => {
        test('is not a number', async () => {
          const row = { ...testRow, charge_element_authorised_quantity: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_authorised_quantity is not a number']))
        })

        test('has more than 6 decimal places', async () => {
          const row = { ...testRow, charge_element_authorised_quantity: '10.1234567' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_authorised_quantity has more than 6 decimal places']))
        })
      })

      experiment('when the charge element time limit start', () => {
        const row = { ...testRow, charge_element_time_limit_end: '01/04/2022' }

        test('has an incorrect date format', async () => {
          row.charge_element_time_limit_start = 'INVALID'
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, "charge_element_time_limit_start has an incorrect format, expected DD/MM/YYYY"']))
        })

        test('is before the charge information start date', async () => {
          row.charge_element_time_limit_start = '01/01/2022'
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_time_limit_start is before the charge information start date']))
        })
      })

      experiment('when the charge element time limit end', () => {
        const row = { ...testRow, charge_element_time_limit_start: '01/04/2022' }

        test('has an incorrect date format', async () => {
          row.charge_element_time_limit_end = 'INVALID'
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, "charge_element_time_limit_end has an incorrect format, expected DD/MM/YYYY"']))
        })

        test('is before the time limit start', async () => {
          row.charge_element_time_limit_end = '01/01/2022'
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_time_limit_end is before the time limit start']))
        })

        test('is after the licence expiry date', async () => {
          row.charge_element_time_limit_end = '01/06/2022'
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_time_limit_end is after the licence expiry date']))
        })
      })

      test('when the charge element loss is not an accepted term', async () => {
        const row = { ...testRow, charge_element_loss: 'INVALID' }
        expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_loss is not an accepted term']))
      })

      experiment('when the charge element agreement apply', () => {
        test('is not an accepted term', async () => {
          const row = { ...testRow, charge_element_agreement_apply: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_agreement_apply is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, charge_element_purpose: PURPOSE_USE_DESCRIPTION, charge_element_agreement_apply: 'Y' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_agreement_apply does not match the purpose']))
        })
      })

      experiment('when the charge reference details charge element group', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_reference_details_charge_element_group: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_charge_element_group is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, charge_reference_details_charge_element_group: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_charge_element_group is not an accepted term']))
        })
      })

      experiment('when the charge reference details source', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_reference_details_source: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_source is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, charge_reference_details_source: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_source is not an accepted term']))
        })
      })

      experiment('when the charge reference details loss', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_reference_details_loss: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_loss is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, charge_reference_details_loss: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_loss is not an accepted term']))
        })
      })

      experiment('when the charge reference details volume', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_reference_details_volume: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is blank']))
        })

        test('is not a number', async () => {
          const row = { ...testRow, charge_reference_details_volume: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is not a number']))
        })

        test('is zero', async () => {
          const row = { ...testRow, charge_reference_details_volume: '0' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is less than or equal to 0']))
        })

        test('is a negative number', async () => {
          const row = { ...testRow, charge_reference_details_volume: '-1' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is less than or equal to 0']))
        })

        test('has more than 6 decimal places', async () => {
          const row = { ...testRow, charge_reference_details_volume: '123.1234567' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume has more than 6 decimal places']))
        })

        test('is greater than 1000000000000000', async () => {
          const row = { ...testRow, charge_reference_details_volume: '1000000000000001' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is too large']))
        })

        test('has too many digits', async () => {
          const row = { ...testRow, charge_reference_details_volume: '12345678.0123456789' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume has too many digits']))
        })
      })

      experiment('when the charge reference details water availability', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_reference_details_water_availability: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_water_availability is blank']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, charge_reference_details_water_availability: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_water_availability is not an accepted term']))
        })
      })

      experiment('when the charge reference details modelling', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_reference_details_modelling: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_modelling is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, charge_reference_details_modelling: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_modelling is not an accepted term']))
        })
      })

      experiment('when the charge reference line description', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_reference_line_description: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_line_description is blank']))
        })

        test('contains more than 180 characters', async () => {
          const row = { ...testRow, charge_reference_line_description: 'a'.repeat(181) }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_line_description has more than 180 characters']))
        })

        test('contains unaccepted characters', async () => {
          const row = { ...testRow, charge_reference_line_description: 'I_N_V_A_L_I_D?' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_line_description contains at least one unaccepted character']))
        })
      })

      experiment('when the charge reference details supported source charge', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_reference_details_supported_source_charge: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_charge is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, charge_reference_details_supported_source_charge: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_charge is not an accepted term']))
        })
      })

      experiment('when the charge reference details supported source name', () => {
        test('is not an accepted term', async () => {
          const row = {
            ...testRow,
            charge_reference_details_supported_source_name: 'INVALID'
          }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_name is not an accepted term']))
        })

        test('is blank and the supported source charge is "Y"', async () => {
          const row = {
            ...testRow,
            charge_reference_details_supported_source_name: '',
            charge_reference_details_supported_source_charge: 'Y'
          }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_name is blank when the supported source charge is "Y"']))
        })

        test('is populated and the supported source charge is "N"', async () => {
          const row = {
            ...testRow,
            charge_reference_details_supported_source_name: SUPPORTED_SOURCE_NAME,
            charge_reference_details_supported_source_charge: 'N'
          }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_name is populated when the supported source charge is "N"']))
        })
      })

      experiment('when the charge reference details public water supply', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_reference_details_public_water_supply: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_public_water_supply is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, charge_reference_details_public_water_supply: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_public_water_supply is not an accepted term']))
        })

        test('is Y when the licence holder is not a water undertaker', async () => {
          helpers.getLicence = async licenceNumber => {
            return {
              ...dummyLicence,
              isWaterUndertaker: false
            }
          }
          const row = { ...testRow, charge_reference_details_public_water_supply: 'Y' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_public_water_supply cannot be Y if the licence holder is not a water undertaker']))
        })
      })

      experiment('when the charge reference details aggregate factor', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_reference_details_aggregate_factor: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_aggregate_factor is blank']))
        })

        test('is not a number', async () => {
          const row = { ...testRow, charge_reference_details_aggregate_factor: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_aggregate_factor is not a number']))
        })

        test('has more than 15 decimal places', async () => {
          const row = { ...testRow, charge_reference_details_aggregate_factor: '1.1234567890123456' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_aggregate_factor has more than 15 decimal places']))
        })

        test('is less than or equal to 0', async () => {
          const row = { ...testRow, charge_reference_details_aggregate_factor: '0' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_aggregate_factor is less than or equal to 0']))
        })
      })

      experiment('when the charge reference details adjustment factor', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_reference_details_adjustment_factor: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_adjustment_factor is blank']))
        })

        test('is not a number', async () => {
          const row = { ...testRow, charge_reference_details_adjustment_factor: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_adjustment_factor is not a number']))
        })

        test('has more than 15 decimal places', async () => {
          const row = { ...testRow, charge_reference_details_adjustment_factor: '1.1234567890123456' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_adjustment_factor has more than 15 decimal places']))
        })

        test('is less than or equal to 0', async () => {
          const row = { ...testRow, charge_reference_details_adjustment_factor: '0' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_adjustment_factor is less than or equal to 0']))
        })
      })

      experiment('when the charge reference details abatement factor', () => {
        test('is blank', async () => {
          const row = { ...testRow, charge_reference_details_abatement_factor: '' }
          expect(await testValidate(row)).to.equal({ isValid: true })
        })

        test('is not a number', async () => {
          const row = { ...testRow, charge_reference_details_abatement_factor: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_abatement_factor is not a number']))
        })

        test('has more than 15 decimal places', async () => {
          const row = { ...testRow, charge_reference_details_abatement_factor: '0.1234567890123456' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_abatement_factor has more than 15 decimal places']))
        })

        test('is less than or equal to 0', async () => {
          const row = { ...testRow, charge_reference_details_abatement_factor: '0' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_abatement_factor is less than or equal to 0']))
        })

        test('is greater than or equal to 1', async () => {
          const row = { ...testRow, charge_reference_details_abatement_factor: '1' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_abatement_factor is greater than or equal to 1']))
        })

        experiment('when the charge reference details winter discount', () => {
          test('is blank', async () => {
            const row = { ...testRow, charge_reference_details_winter_discount: '' }
            expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_winter_discount is not an accepted term']))
          })

          test('is not an accepted term', async () => {
            const row = { ...testRow, charge_reference_details_winter_discount: 'INVALID' }
            expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_winter_discount is not an accepted term']))
          })
        })

        experiment('when the charge reference details two part tariff agreement applies', () => {
          test('is blank', async () => {
            const row = { ...testRow, charge_reference_details_two_part_tariff_agreement_applies: '' }
            expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_two_part_tariff_agreement_applies is not an accepted term']))
          })

          test('is not an accepted term', async () => {
            const row = { ...testRow, charge_reference_details_two_part_tariff_agreement_applies: 'INVALID' }
            expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_two_part_tariff_agreement_applies is not an accepted term']))
          })
        })

        experiment('when the charge reference details canal and river trust agreement applies', () => {
          test('is blank', async () => {
            const row = { ...testRow, charge_reference_details_canal_and_river_trust_agreement_applies: '' }
            expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_canal_and_river_trust_agreement_applies is not an accepted term']))
          })

          test('is not an accepted term', async () => {
            const row = { ...testRow, charge_reference_details_canal_and_river_trust_agreement_applies: 'INVALID' }
            expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_canal_and_river_trust_agreement_applies is not an accepted term']))
          })
        })
      })

      test('when the contents of a row has two invalid fields ', async () => {
        expect(await testValidate({
          ...testRow,
          charge_reference_details_abatement_factor: '1',
          licence_number: 'INVALID'
        })).to.equal({
          errorType: 'rows',
          validationErrors: [
            'Row 2, charge_reference_details_abatement_factor is greater than or equal to 1',
            'Row 2, licence_number is not valid'
          ],
          isValid: false
        })
      })
    })

    experiment('with multiple rows', () => {
      // Two rows with test licence 2
      const testRow2 = { ...testRow, licence_number: 'TEST/LICENCE/2', charge_reference_details_charge_element_group: 'A', charge_reference_details_loss: 'high' }
      const testRow3 = { ...testRow, licence_number: 'TEST/LICENCE/2', charge_reference_details_charge_element_group: 'A', charge_reference_details_loss: 'low' }

      // Two rows with test licence 3
      const testRow4 = { ...testRow, licence_number: 'TEST/LICENCE/3', charge_reference_details_charge_element_group: 'B' }
      const testRow5 = { ...testRow, licence_number: 'TEST/LICENCE/3', charge_reference_details_charge_element_group: 'B' }

      test('when the contents of a csv with 5 rows are valid ', async () => {
        expect(await testValidate(testRow, testRow2, testRow3, testRow4, testRow5)).to.equal({
          isValid: true
        })
      })

      test('when the contents of a csv with 5 rows has 2 invalid rows ', async () => {
        expect(await testValidate(
          testRow,
          testRow2,
          { ...testRow3, licence_number: 'INVALID' },
          testRow4,
          { ...testRow5, charge_reference_details_abatement_factor: '1' }
        )).to.equal({
          errorType: 'rows',
          validationErrors: [
            'Row 4, licence_number is not valid',
            'Row 6, charge_reference_details_abatement_factor is greater than or equal to 1'
          ],
          isValid: false
        })
      })

      experiment('when the contents of a csv with 5 rows has 2 rows for the same licence number and group where the group is A', () => {
        test('all reference details are the same', async () => {
          expect(await testValidate(
            testRow,
            { ...testRow2, charge_reference_details_loss: 'low' },
            { ...testRow3, charge_reference_details_loss: 'low' },
            testRow4,
            testRow5
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 3, has the same licence and references as row 4 and both are in group A'],
            isValid: false
          })
        })
      })

      experiment('when the contents of a csv with 5 rows has 2 rows for the same licence number and group where the group is not A', () => {
        test('different source', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, charge_reference_details_source: 'Y' },
            { ...testRow5, charge_reference_details_source: 'N' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence and group as row 6 but charge_reference_details_source is different'],
            isValid: false
          })
        })

        test('different loss', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, charge_reference_details_loss: 'low' },
            { ...testRow5, charge_reference_details_loss: 'high' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence and group as row 6 but charge_reference_details_loss is different'],
            isValid: false
          })
        })

        test('different volume', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, charge_reference_details_volume: '10' },
            { ...testRow5, charge_reference_details_volume: '25' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence and group as row 6 but charge_reference_details_volume is different'],
            isValid: false
          })
        })

        test('different water availability', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, charge_reference_details_water_availability: 'Y' },
            { ...testRow5, charge_reference_details_water_availability: 'N' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence and group as row 6 but charge_reference_details_water_availability is different'],
            isValid: false
          })
        })

        test('different modelling', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, charge_reference_details_modelling: 'tier 1' },
            { ...testRow5, charge_reference_details_modelling: 'tier 2' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence and group as row 6 but charge_reference_details_modelling is different'],
            isValid: false
          })
        })

        test('different billing account', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, charge_information_billing_account: 'BILLING-ACCOUNT-ONE' },
            { ...testRow5, charge_information_billing_account: 'BILLING-ACCOUNT-TWO' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence as row 6 but charge_information_billing_account is different'],
            isValid: false
          })
        })

        test('different start date', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, charge_information_start_date: '01/04/2022' },
            { ...testRow5, charge_information_start_date: '02/05/2023' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence as row 6 but charge_information_start_date is different'],
            isValid: false
          })
        })
      })
    })
  })
})
