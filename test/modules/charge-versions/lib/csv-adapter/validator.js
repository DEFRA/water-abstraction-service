'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const licenceService = require('../../../../../src/lib/services/licences');
const repos = require('../../../../../src/lib/connectors/repos');
const { billing } = require('../../../../../config');
const { validate } = require('../../../../../src/modules/charge-versions/lib/csv-adapter/validator');
const { snakeCase } = require('lodash');

const SUPPORTED_SOURCE_NAME = 'Valid Supported Source Name';
const PURPOSE_USE_DESCRIPTION = 'Valid Purpose Use Description';
const PURPOSE_USE_DESCRIPTION_TPT = 'Valid Purpose Use Description With Two Part Tariff';
const LINE_DESCRIPTION = 'Valid Line Description';

const testData = {
  licenceNumber: 'TH/038/0009/030/R01',
  chargeInformationStartDate: '01/04/2022',
  chargeElementPurpose: PURPOSE_USE_DESCRIPTION_TPT,
  chargeElementDescription: 'Test Description',
  chargeElementAbstractionPeriod: '01/04-31/03',
  chargeElementAuthorisedQuantity: '2920.123456',
  chargeElementTimeLimitStart: '01/04/2022',
  chargeElementTimeLimitEnd: '',
  chargeElementLoss: 'medium',
  chargeElementAgreementApply: 'Y',
  chargeReferenceDetailsChargeElementGroup: 'A',
  chargeReferenceDetailsSource: 'N',
  chargeReferenceDetailsLoss: 'medium',
  chargeReferenceDetailsVolume: '2920',
  chargeReferenceDetailsWaterAvailability: 'Y',
  chargeReferenceDetailsModelling: 'tier 1',
  chargeReferenceLineDescription: LINE_DESCRIPTION,
  chargeReferenceDetailsSupportedSourceCharge: 'N',
  chargeReferenceDetailsSupportedSourceName: '',
  chargeReferenceDetailsPublicWaterSupply: 'Y',
  chargeReferenceDetailsAggregateFactor: '1',
  chargeReferenceDetailsAdjustmentFactor: '1',
  chargeReferenceDetailsAbatementFactor: '0.1',
  chargeReferenceDetailsWinterDiscount: 'N',
  chargeReferenceDetailsTwoPartTariffAgreementApplies: 'N',
  chargeReferenceDetailsCanalAndRiverTrustAgreementApplies: 'N',
  chargeInformationNotes: ''
};

const getHeadings = data => Object.keys(data).map(heading => snakeCase(heading));
const getValues = data => Object.values(data);

const testValidate = async data => validate([getHeadings(data), getValues(data)].join('\n'));
const rowErrors = validationErrors => ({
  validationErrors,
  errorType: 'rows',
  isValid: false
});

experiment('validator', () => {
  beforeEach(() => {
    sandbox.stub(licenceService, 'getLicenceByLicenceRef');
    sandbox.stub(repos.supportedSources, 'findAll');
    sandbox.stub(repos.purposeUses, 'findAll');
    sandbox.stub(billing, 'srocStartDate');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.validate', () => {
    beforeEach(() => {
      billing.srocStartDate = new Date('2022-04-01');
      repos.supportedSources.findAll.resolves([
        { name: SUPPORTED_SOURCE_NAME }
      ]);
      repos.purposeUses.findAll.resolves([
        { description: PURPOSE_USE_DESCRIPTION, isTwoPartTariff: false },
        { description: PURPOSE_USE_DESCRIPTION_TPT, isTwoPartTariff: true }
      ]);
    });

    test('when the number of headings is inconsistent with the number of rows', async () => {
      const result = await validate(['heading-1,heading-2', 'col-1'].join('\n'));
      expect(result).to.equal({
        validationErrors: ['Number of columns is inconsistent on line 2'],
        errorType: 'parse',
        isValid: false
      });
    });

    test('when the contents of a csv are valid ', async () => {
      licenceService.getLicenceByLicenceRef.resolves({
        startDate: '2022-03-31',
        expiredDate: '2022-04-01',
        lapsedDate: '2022-04-01',
        revokedDate: '2022-04-01'
      });
      expect(await testValidate(testData)).to.equal({
        isValid: true
      });
    });

    experiment('when the licence number', () => {
      test('is blank', async () => {
        const data = { ...testData, licenceNumber: '' };
        expect(await testValidate(data)).to.equal(rowErrors(['Row 2, licence_number is blank']));
      });

      test('is invalid', async () => {
        const data = { ...testData, licenceNumber: 'INVALID' };
        expect(await testValidate(data)).to.equal(rowErrors(['Row 2, licence_number is not valid']));
      });
    });

    experiment('', () => {
      beforeEach(() => {
        licenceService.getLicenceByLicenceRef.resolves({
          startDate: '2022-03-31',
          expiredDate: '2022-05-01',
          lapsedDate: '2022-05-01',
          revokedDate: '2022-05-01'
        });
      });

      experiment('when the charge information start date', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeInformationStartDate: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_information_start_date is blank']));
        });

        test('has an incorrect date format', async () => {
          const data = { ...testData, chargeInformationStartDate: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_information_start_date has an incorrect format']));
        });

        test('is before the licence start date', async () => {
          const data = { ...testData, chargeInformationStartDate: '30/03/2022' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_information_start_date is before the licence start date']));
        });

        test('is before 1 April 2022', async () => {
          const data = { ...testData, chargeInformationStartDate: '31/03/2022' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_information_start_date is before 1 April 2022']));
        });
      });

      experiment('when the charge element purpose', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeElementPurpose: '', chargeElementAgreementApply: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_purpose is blank']));
        });

        test('is not an accepted term', async () => {
          const data = { ...testData, chargeElementPurpose: 'INVALID', chargeElementAgreementApply: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_purpose is not an accepted term']));
        });
      });

      test('when the charge element description is blank', async () => {
        const data = { ...testData, chargeElementDescription: '' };
        expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_description is blank']));
      });

      test('when the charge element abstraction period has an incorrect date format', async () => {
        const data = { ...testData, chargeElementAbstractionPeriod: 'INVALID' };
        expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_abstraction_period is an incorrect format']));
      });

      experiment('when the charge element authorised quantity', () => {
        test('is not a number', async () => {
          const data = { ...testData, chargeElementAuthorisedQuantity: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_authorised_quantity is not a number']));
        });

        test('has more than 6 decimal places', async () => {
          const data = { ...testData, chargeElementAuthorisedQuantity: '10.1234567' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_authorised_quantity has more than 6 decimal places']));
        });
      });

      experiment('when the charge element time limit start', () => {
        test('has an incorrect date format', async () => {
          const data = { ...testData, chargeElementTimeLimitStart: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_time_limit_start has an incorrect format']));
        });

        test('is before the charge information start date', async () => {
          const data = { ...testData, chargeElementTimeLimitStart: '01/01/2022' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_time_limit_start is before the charge information start date']));
        });
      });

      experiment('when the charge element time limit end', () => {
        test('has an incorrect date format', async () => {
          const data = { ...testData, chargeElementTimeLimitEnd: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_time_limit_end has an incorrect format']));
        });

        test('is before the time limit start', async () => {
          const data = { ...testData, chargeElementTimeLimitEnd: '01/01/2022' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_time_limit_end is before the time limit start']));
        });

        test('is after the licence expiry date', async () => {
          const data = { ...testData, chargeElementTimeLimitEnd: '01/06/2022' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_time_limit_end is after the licence expiry date']));
        });
      });

      test('when the charge element loss is not an accepted term', async () => {
        const data = { ...testData, chargeElementLoss: 'INVALID' };
        expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_loss is not an accepted term']));
      });

      experiment('when the charge element agreement apply', () => {
        test('is not an accepted term', async () => {
          const data = { ...testData, chargeElementAgreementApply: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_agreement_apply is not an accepted term']));
        });

        test('is not an accepted term', async () => {
          const data = { ...testData, chargeElementPurpose: PURPOSE_USE_DESCRIPTION, chargeElementAgreementApply: 'Y' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_element_agreement_apply does not match the purpose']));
        });
      });

      experiment('when the charge reference details charge element group', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeReferenceDetailsChargeElementGroup: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_charge_element_group is blank']));
        });

        test('is not an accepted term', async () => {
          const data = { ...testData, chargeReferenceDetailsChargeElementGroup: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_charge_element_group is not an accepted term']));
        });
      });

      experiment('when the charge reference details source', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeReferenceDetailsSource: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_source is blank']));
        });

        test('is not an accepted term', async () => {
          const data = { ...testData, chargeReferenceDetailsSource: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_source is not an accepted term']));
        });
      });

      experiment('when the charge reference details loss', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeReferenceDetailsLoss: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_loss is blank']));
        });

        test('is not an accepted term', async () => {
          const data = { ...testData, chargeReferenceDetailsLoss: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_loss is not an accepted term']));
        });
      });

      experiment('when the charge reference details volume', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeReferenceDetailsVolume: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is blank']));
        });

        test('is not a number', async () => {
          const data = { ...testData, chargeReferenceDetailsVolume: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is not a number']));
        });

        test('has more than 6 decimal places', async () => {
          const data = { ...testData, chargeReferenceDetailsVolume: '123.1234567' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_volume has more than 6 decimal places']));
        });

        test('is greater than 1000000000000000', async () => {
          const data = { ...testData, chargeReferenceDetailsVolume: '1000000000000001' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is too large']));
        });

        test('has too many digits', async () => {
          const data = { ...testData, chargeReferenceDetailsVolume: '12345678.0123456789' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_volume has too many digits']));
        });
      });

      experiment('when the charge reference details water availability', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeReferenceDetailsWaterAvailability: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_water_availability is blank']));
        });

        test('is not an accepted term', async () => {
          const data = { ...testData, chargeReferenceDetailsWaterAvailability: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_water_availability is not an accepted term']));
        });
      });

      experiment('when the charge reference details modelling', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeReferenceDetailsModelling: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_modelling is blank']));
        });

        test('is not an accepted term', async () => {
          const data = { ...testData, chargeReferenceDetailsModelling: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_modelling is not an accepted term']));
        });
      });

      experiment('when the charge reference line description', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeReferenceLineDescription: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_line_description is blank']));
        });

        test('contains more than 180 characters', async () => {
          const data = { ...testData, chargeReferenceLineDescription: 'a'.repeat(181) };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_line_description has more than 180 characters']));
        });

        test('contains unaccepted characters', async () => {
          const data = { ...testData, chargeReferenceLineDescription: 'I_N_V_A_L_I_D' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_line_description contains at least one unaccepted character']));
        });
      });

      experiment('when the charge reference details supported source charge', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeReferenceDetailsSupportedSourceCharge: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_charge is blank']));
        });

        test('is not an accepted term', async () => {
          const data = { ...testData, chargeReferenceDetailsSupportedSourceCharge: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_charge is not an accepted term']));
        });
      });

      experiment('when the charge reference details supported source name', () => {
        test('is not an accepted term', async () => {
          const data = {
            ...testData,
            chargeReferenceDetailsSupportedSourceName: 'INVALID'
          };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_name is not an accepted term']));
        });

        test('is blank and the supported source charge is "Y"', async () => {
          const data = {
            ...testData,
            chargeReferenceDetailsSupportedSourceName: '',
            chargeReferenceDetailsSupportedSourceCharge: 'Y'
          };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_name is blank when the supported source charge is "Y"']));
        });

        test('is populated and the supported source charge is "N"', async () => {
          const data = {
            ...testData,
            chargeReferenceDetailsSupportedSourceName: SUPPORTED_SOURCE_NAME,
            chargeReferenceDetailsSupportedSourceCharge: 'N'
          };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_name is populated when the supported source charge is "N"']));
        });
      });

      experiment('when the charge reference details public water supply', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeReferenceDetailsPublicWaterSupply: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_public_water_supply is blank']));
        });

        test('is not an accepted term', async () => {
          const data = { ...testData, chargeReferenceDetailsPublicWaterSupply: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_public_water_supply is not an accepted term']));
        });
      });

      experiment('when the charge reference details aggregate factor', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeReferenceDetailsAggregateFactor: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_aggregate_factor is blank']));
        });

        test('is not a number', async () => {
          const data = { ...testData, chargeReferenceDetailsAggregateFactor: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_aggregate_factor is not a number']));
        });

        test('has more than 15 decimal places', async () => {
          const data = { ...testData, chargeReferenceDetailsAggregateFactor: '1.1234567890123456' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_aggregate_factor has more than 15 decimal places']));
        });

        test('is less than or equal to 0', async () => {
          const data = { ...testData, chargeReferenceDetailsAggregateFactor: '0' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_aggregate_factor is less than or equal to 0']));
        });
      });

      experiment('when the charge reference details adjustment factor', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeReferenceDetailsAdjustmentFactor: '' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_adjustment_factor is blank']));
        });

        test('is not a number', async () => {
          const data = { ...testData, chargeReferenceDetailsAdjustmentFactor: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_adjustment_factor is not a number']));
        });

        test('has more than 15 decimal places', async () => {
          const data = { ...testData, chargeReferenceDetailsAdjustmentFactor: '1.1234567890123456' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_adjustment_factor has more than 15 decimal places']));
        });

        test('is less than or equal to 0', async () => {
          const data = { ...testData, chargeReferenceDetailsAdjustmentFactor: '0' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_adjustment_factor is less than or equal to 0']));
        });
      });

      experiment('when the charge reference details abatement factor', () => {
        test('is blank', async () => {
          const data = { ...testData, chargeReferenceDetailsAbatementFactor: '' };
          expect(await testValidate(data)).to.equal({ isValid: true });
        });

        test('is not a number', async () => {
          const data = { ...testData, chargeReferenceDetailsAbatementFactor: 'INVALID' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_abatement_factor is not a number']));
        });

        test('has more than 15 decimal places', async () => {
          const data = { ...testData, chargeReferenceDetailsAbatementFactor: '0.1234567890123456' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_abatement_factor has more than 15 decimal places']));
        });

        test('is less than or equal to 0', async () => {
          const data = { ...testData, chargeReferenceDetailsAbatementFactor: '0' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_abatement_factor is less than or equal to 0']));
        });

        test('is greater than or equal to 1', async () => {
          const data = { ...testData, chargeReferenceDetailsAbatementFactor: '1' };
          expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_abatement_factor is greater than or equal to 1']));
        });

        experiment('when the charge reference details winter discount', () => {
          test('is blank', async () => {
            const data = { ...testData, chargeReferenceDetailsWinterDiscount: '' };
            expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_winter_discount is blank']));
          });

          test('is not an accepted term', async () => {
            const data = { ...testData, chargeReferenceDetailsWinterDiscount: 'INVALID' };
            expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_winter_discount is not an accepted term']));
          });
        });

        experiment('when the charge reference details two part tariff agreement applies', () => {
          test('is blank', async () => {
            const data = { ...testData, chargeReferenceDetailsTwoPartTariffAgreementApplies: '' };
            expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_two_part_tariff_agreement_applies is blank']));
          });

          test('is not an accepted term', async () => {
            const data = { ...testData, chargeReferenceDetailsTwoPartTariffAgreementApplies: 'INVALID' };
            expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_two_part_tariff_agreement_applies is not an accepted term']));
          });
        });

        experiment('when the charge reference details canal and river trust agreement applies', () => {
          test('is blank', async () => {
            const data = { ...testData, chargeReferenceDetailsCanalAndRiverTrustAgreementApplies: '' };
            expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_canal_and_river_trust_agreement_applies is blank']));
          });

          test('is not an accepted term', async () => {
            const data = { ...testData, chargeReferenceDetailsCanalAndRiverTrustAgreementApplies: 'INVALID' };
            expect(await testValidate(data)).to.equal(rowErrors(['Row 2, charge_reference_details_canal_and_river_trust_agreement_applies is not an accepted term']));
          });
        });
      });
    });
  });
});
