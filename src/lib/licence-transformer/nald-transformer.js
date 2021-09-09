/**
 * Transforms NALD data into VML native format
 * @module lib/licence-transformer/nald-transformer
 */
const { find, uniqBy, isArray } = require('lodash');
const sentenceCase = require('sentence-case');

const BaseTransformer = require('./base-transformer');
const LicenceTitleLoader = require('./licence-title-loader');
const licenceTitleLoader = new LicenceTitleLoader();
const NALDHelpers = require('./nald-helpers');

const waterHelpers = require('@envage/water-abstraction-helpers');
const { nald } = waterHelpers;

class NALDTransformer extends BaseTransformer {
  /**
   * Load data into the transformer
   * @param {Object} data - data loaded from NALD
   */
  async load (data) {
    data = nald.transformNull(data);

    const currentVersion = nald.findCurrent(data.data.versions);

    const licenceHolderParty = find(currentVersion.parties, (party) => {
      return party.ID === currentVersion.ACON_APAR_ID;
    });

    const conditions = await this.conditionFormatter(data.data.current_version.purposes);

    this.data = {
      licenceNumber: data.LIC_NO,
      regionCode: data.FGAC_REGION_CODE,
      licenceHolderTitle: licenceHolderParty.SALUTATION,
      licenceHolderInitials: licenceHolderParty.INITIALS,
      licenceHolderName: licenceHolderParty.NAME,
      licenceHolderFullName: this.fullNameFormatter(licenceHolderParty),
      effectiveDate: nald.dates.calendarToIso(data.ORIG_EFF_DATE),
      currentVersionEffectiveStartDate: nald.dates.calendarToIso(currentVersion.EFF_ST_DATE),
      expiryDate: nald.dates.calendarToIso(data.EXPIRY_DATE),
      versionCount: data.data.versions.length,
      conditions: conditions,
      points: this.pointsFormatter(data.data.current_version.purposes),
      abstractionPeriods: this.periodsFormatter(data.data.current_version.purposes),
      aggregateQuantity: this.aggregateQuantitiesFormatter(data.data.current_version.purposes),
      contacts: this.contactsFormatter(currentVersion, data.data.roles),
      purposes: this.purposesFormatter(data.data.current_version.purposes),
      uniquePurposeNames: this.uniquePurposeNamesFormatter(data.data.current_version.purposes),
      hofTypes: this.getHofTypes(conditions),
      sourcesOfSupply: this.getSourcesOfSupply(data.data.current_version.purposes),
      returnFormats: this.formatsFormatter(data.data.current_version.formats)
    };

    return this.data;
  }

  fullNameFormatter (party) {
    const {
      SALUTATION: salutation,
      INITIALS: initials,
      FORENAME: firstName,
      NAME: lastName
    } = party;
    return NALDHelpers.getFullName(salutation, initials, firstName, lastName);
  }

  formatsFormatter (formats = []) {
    return formats.map(row => {
      return {
        siteDescription: row.SITE_DESCR,
        points: row.points.map(nald.formatting.formatAbstractionPoint),
        purposes: row.purposes.map(purpose => ({
          name: purpose.PURP_ALIAS
        }))
      };
    });
  }

  /**
   * Format licence purposes
   * @param {Array} purposes - from NALD data
   * @return {Array} - formatted unique list of licences
   */
  purposesFormatter (purposes) {
    purposes = purposes.map(item => ({
      name: item.purpose[0].purpose_tertiary.DESCR,
      periodStart: item.PERIOD_ST_DAY + '/' + item.PERIOD_ST_MONTH,
      periodEnd: item.PERIOD_END_DAY + '/' + item.PERIOD_END_MONTH,
      annualQty: item.ANNUAL_QTY,
      dailyQty: item.DAILY_QTY,
      hourlyQty: item.HOURLY_QTY,
      instantaneousQty: item.INST_QTY,
      points: item.purposePoints.map(item => nald.formatting.formatAbstractionPoint(item.point_detail))
    }));

    purposes = _dedupe(purposes);

    return purposes;
  }

  /**
   * Get a list of unique purpose names
   * @param {Array} purposes from NALD data
   * @return {Array} of purpose names
   */
  uniquePurposeNamesFormatter (purposes) {
    const names = purposes.map(item => item.purpose[0].purpose_tertiary.DESCR);
    return uniqBy(names, item => item);
  }

  /**
   * Contacts formatter
   * Creates a list of contacts from the roles/parties in the NALD data
   */
  contactsFormatter (currentVersion, roles) {
    const contacts = [];

    const licenceHolderParty = find(currentVersion.parties, (party) => {
      return party.ID === currentVersion.ACON_APAR_ID;
    });

    const licenceHolderAddress = find(licenceHolderParty.contacts, (contact) => {
      return contact.AADD_ID === currentVersion.ACON_AADD_ID;
    });

    contacts.push({
      type: 'Licence holder',
      ...nald.formatting.nameFormatter(licenceHolderParty),
      ...nald.formatting.addressFormatter(licenceHolderAddress.party_address)
    });

    const contactCodes = ['FM', 'LA', 'LC', 'MG', 'RT'];
    roles.filter(role => contactCodes.includes(role.role_type.CODE)).forEach((role) => {
      contacts.push({
        type: sentenceCase(role.role_type.DESCR),
        ...nald.formatting.nameFormatter(role.role_party),
        ...nald.formatting.addressFormatter(role.role_address)
      });
    });

    return contacts;
  }

  /**
   * Converts a string, e.g 12,456 CMH 12,345 CMA to an array of quantities
   * e.g. [{value : 12345, units : 'CMH'} ...]
   * @param {String} str - quantities string
   * @return {Array} - array of {value, units}
   */
  quantitiesStrToArray (str) {
    const unitNames = {
      CMA: 'cubic metres per year',
      'M3/A': 'cubic metres per year',
      CMD: 'cubic metres per day',
      'M3/D': 'cubic metres per day',
      CMH: 'cubic metres per hour',
      'L/S': 'litres per second'
    };

    const r = /([0-9,.]+) ?([a-z3/]+)/ig;
    let result;
    const results = [];
    while ((result = r.exec(str)) !== null) {
      results.push({
        value: parseFloat(result[1].replace(/[^0-9.]/g, '')),
        units: result[2],
        name: unitNames[result[2].toUpperCase()]
      });
    };
    return results;
  }

  /**
   * Max quantities formatter
   * If a licence has a single set of quantities across all periods, return
   * that, otherwise return empty array
   * @param {Array} purposes
   * @return {Array} array of quantities
   */
  aggregateQuantitiesFormatter (purposes) {
    const quantities = purposes.map(NALDHelpers.getAggregateQuantities);

    const unique = uniqBy(quantities, row => {
      return row.map(row => row.value).join(',');
    });

    return unique.length === 1 ? unique[0] : [];
  }

  /**
   * Create a unique list of abstraction periods
   * @param {Array} purposes
   * @return {Array} array of periods
   */
  periodsFormatter (purposes) {
    const periods = [];

    purposes.forEach((purpose) => {
      const periodStart = purpose.PERIOD_ST_DAY + '/' + purpose.PERIOD_ST_MONTH;
      const periodEnd = purpose.PERIOD_END_DAY + '/' + purpose.PERIOD_END_MONTH;
      // Find existing period
      let period = find(periods, (item) => item.periodStart === periodStart && item.periodEnd === periodEnd);
      if (period) {
        if (!period.purposes.includes(purpose.purpose[0].purpose_tertiary.DESCR)) {
          period.purposes.push(purpose.purpose[0].purpose_tertiary.DESCR);
        }
      } else {
        period = {
          periodStart,
          periodEnd,
          purposes: [purpose.purpose[0].purpose_tertiary.DESCR]
        };
        periods.push(period);
      }
    });

    return periods;
  }

  /**
   * Format purposes to provide an array of points
   * @param {Array} purposes
   * @return {Array} array of points
   */
  pointsFormatter (purposes) {
    const points = [];
    purposes.forEach((purpose) => {
      purpose.purposePoints.forEach((purposePoint) => {
        points.push({
          meansOfAbstraction: purposePoint.means_of_abstraction.DESCR,
          ...nald.formatting.formatAbstractionPoint(purposePoint.point_detail)
        });
      });
    });
    return uniqBy(points, item => Object.values(item).join(','));
  }

  /**
   * Formats conditions in the NALD data into a form that can be used
   * in the licence conditions screen
   * @param {Object} purposes - purposes array from NALD data
   * @return {Array} array of condition types / points / conditions
   */
  async conditionFormatter (purposes) {
    // Read condition titles from CSV
    const titleData = await licenceTitleLoader.load();

    /**
     * Match a condition within the condition array
     * @param {String} code - the condition code
     * @param {String} subCode - the sub-condition code
     * @param {String} purpose - the tertiary purpose description
     * @return {Function} returns a predicate that can be used in lodash/find
     */
    const conditionMatcher = (code, subCode, purpose) => {
      return (item) => (code === item.code) && (subCode === item.subCode) && (purpose === item.purpose);
    };

    /**
     * Match a title within the display titles array
     * @param {String} code - the condition code
     * @param {String} subCode - the sub-condition code
     * @return {Function} returns a predicate that can be used in lodash/find
     */
    const titleMatcher = (code, subCode) => {
      return (item) => (code === item.code) && (subCode === item.subCode);
    };

    /**
     * Match a point within the condition points array
     * @param {Object} point
     * @return {Function} returns a predicate that can be used in lodash/find
     */
    const pointMatcher = (points) => {
      return (item) => item.points.join(',') === points.join(',');
    };

    const conditionsArr = [];

    purposes.forEach((purpose) => {
      const points = purpose.purposePoints.map((purposePoint) => {
        return nald.formatting.formatAbstractionPoint(purposePoint.point_detail);
      });

      purpose.licenceConditions.forEach((condition) => {
        const {
          CODE: code,
          SUBCODE: subCode
        } = condition.condition_type;
        const {
          TEXT: text,
          PARAM1: parameter1,
          PARAM2: parameter2
        } = condition;
        const {
          DESCR: purposeText
        } = purpose.purpose[0].purpose_tertiary;

        // Condition wrapper
        let cWrapper = find(conditionsArr, conditionMatcher(code, subCode, purposeText));
        if (!cWrapper) {
          const titles = find(titleData, titleMatcher(code, subCode));
          cWrapper = {
            ...titles,
            code,
            subCode,
            points: [],
            purpose: purposeText
          };
          conditionsArr.push(cWrapper);
        }

        // Points wrapper
        let pWrapper = find(cWrapper.points, pointMatcher(points));
        if (!pWrapper) {
          pWrapper = {
            points,
            conditions: []
          };
          cWrapper.points.push(pWrapper);
        }

        // Add condition
        pWrapper.conditions.push({
          parameter1,
          parameter2,
          text
        });

        // De-dedupe
        // @TODO - remove duplication in original data
        pWrapper.conditions = uniqBy(pWrapper.conditions, item => Object.values(item).join(','));
      });
    });

    return conditionsArr;
  }

  /*
   * Get conditions from list matching code and subcode
   * @param {Array} conditions
   * @param {Array|String} code - the condition code
   * @param {Array|String} subCode - the condition subcode
   */
  filterConditions (conditions, code, subCode) {
    const arrCode = isArray(code) ? code : [code];
    const arrSubCode = isArray(subCode) ? subCode : [subCode];
    return conditions.filter(row => {
      return arrCode.includes(row.code) && arrSubCode.includes(row.subCode);
    });
  }

  /**
   * Gets HOF types in the licence
   * @param {Object} viewData
   * @return {Object} contains booleans for cesFlow and cesLev
   */
  getHofTypes (conditions) {
    return conditions.reduce((acc, condition) => {
      if (condition.code === 'CES' && condition.subCode === 'LEV') {
        acc.cesLev = true;
      }
      if (condition.code === 'CES' && condition.subCode === 'FLOW') {
        acc.cesFlow = true;
      }
      return acc;
    }, {
      cesFlow: false,
      cesLev: false
    });
  }

  /**
   * Gets point(s) of supply
   * @param {Array} purposes
   * @return {Array} of points of supply
   */
  getSourcesOfSupply (purposes) {
    const points = [];
    purposes.forEach((purpose) => {
      purpose.purposePoints.forEach((purposePoint) => {
        const { NAME } = purposePoint.point_source;
        points.push({
          name: NAME
        });
      });
    });
    return uniqBy(points, item => Object.values(item).join(','));
  }
}

function _dedupe (arrayData) {
  var deduped = [];
  var hashes = [];
  var crypto = require('crypto');
  for (var i in arrayData) {
    var hash = crypto.createHash('md5').update(JSON.stringify(arrayData[i])).digest('hex');
    if (hashes.indexOf(hash) === -1) {
      hashes.push(hash);
      deduped.push(arrayData[i]);
    }
  }
  return deduped;
}

module.exports = NALDTransformer;
