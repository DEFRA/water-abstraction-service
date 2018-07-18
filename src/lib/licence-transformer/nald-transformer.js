/**
 * Transforms NALD data into VML native format
 * @module lib/licence-transformer/nald-transformer
 */
const {
  find,
  uniqBy
} = require('lodash');
const BaseTransformer = require('./base-transformer');
const LicenceTitleLoader = require('./licence-title-loader');
const licenceTitleLoader = new LicenceTitleLoader();
const NALDHelpers = require('./nald-helpers');
const sentenceCase = require('sentence-case');
const { addressFormatter, findCurrent, nameFormatter, transformNull } = require('./nald-functional');

class NALDTransformer extends BaseTransformer {
  /**
   * Transform string 'null' values to real null
   * @param {Object} data
   * @return {Object}
   */
  transformNull (data) {
    return transformNull(data);
  }

  /**
   * Load data into the transformer
   * @param {Object} data - data loaded from NALD
   */
  async load (data) {
    data = this.transformNull(data);

    const currentVersion = findCurrent(data.data.versions);

    const licenceHolderParty = find(currentVersion.parties, (party) => {
      return party.ID === currentVersion.ACON_APAR_ID;
    });

    this.data = {
      licenceNumber: data.LIC_NO,
      licenceHolderTitle: licenceHolderParty.SALUTATION,
      licenceHolderInitials: licenceHolderParty.INITIALS,
      licenceHolderName: licenceHolderParty.NAME,
      effectiveDate: data.ORIG_EFF_DATE,
      expiryDate: data.EXPIRY_DATE,
      versionCount: data.data.versions.length,
      conditions: await this.conditionFormatter(data.data.current_version.purposes),
      points: this.pointsFormatter(data.data.current_version.purposes),
      abstractionPeriods: this.periodsFormatter(data.data.current_version.purposes),
      aggregateQuantity: this.aggregateQuantitiesFormatter(data.data.current_version.purposes),
      contacts: this.contactsFormatter(currentVersion, data.data.roles),
      purposes: this.purposesFormatter(data.data.current_version.purposes),
      uniquePurposeNames: this.uniquePurposeNamesFormatter(data.data.current_version.purposes)
    };

    return this.data;
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
      points: item.purposePoints.map(item => NALDHelpers.formatAbstractionPoint(item.point_detail))
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
   * Formats contact address
   * @param {Object} contactAddress - party/role address
   * @return {Object} reformatted address
   */
  addressFormatter (contactAddress) {
    return addressFormatter(contactAddress);
  }

  /**
   * Formats a party name - whether person or organisation
   * @param {Object} party - NALD party / role party
   * @return {Object} contact name
   */
  nameFormatter (party) {
    return nameFormatter(party);
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
      ...this.nameFormatter(licenceHolderParty),
      ...this.addressFormatter(licenceHolderAddress.party_address)
    });

    roles.forEach((role) => {
      contacts.push({
        type: sentenceCase(role.role_type.DESCR),
        ...this.nameFormatter(role.role_party),
        ...this.addressFormatter(role.role_address)
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
    let results = [];
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
   * If a licence has a single AGG PP condition, i.e. purposes to purpose within
   * a licence, this extracts the data
   * @param {Array} purposes
   * @return {Array} array of quantities
   */
  aggregateQuantitiesFormatter (purposes) {
    const quantities = purposes.map(purpose => ({
      annualQty: purpose.ANNUAL_QTY,
      dailyQty: purpose.DAILY_QTY,
      hourlyQty: purpose.HOURLY_QTY,
      instantQty: purpose.INST_QTY
    }));

    const uniqQuantities = uniqBy(quantities, item => Object.values(item).join(','));

    if (uniqQuantities.length === 1) {
      return [{
        value: uniqQuantities[0].annualQty,
        name: 'cubic metres per year'
      },
      {
        value: uniqQuantities[0].dailyQty,
        name: 'cubic metres per day'
      },
      {
        value: uniqQuantities[0].hourlyQty,
        name: 'cubic metres per hour'
      },
      {
        value: uniqQuantities[0].instantQty,
        name: 'litres per second'
      }
      ];
    }

    return [];
    // // Get all conditions as array
    // const conditions = purposes.reduce((memo, item) => {
    //   return [...memo, ...item.licenceConditions];
    // }, []);
    //
    // // Get AGG PP conditions
    // const agg = filter(conditions, (item) => {
    //   return (item.condition_type.CODE === 'AGG') && (item.condition_type.SUBCODE === 'PP');
    // });
    //
    // // Format
    // const formatted = agg.map(item => ({
    //   code: item.condition_type.CODE,
    //   subCode: item.condition_type.SUBCODE,
    //   text: item.TEXT,
    //   parameter1: item.PARAM1,
    //   parameter2: item.PARAM2
    // }));
    //
    // // Get unique
    // const unique = uniqBy(formatted, item => Object.values(item).join(','));
    //
    // return unique.length === 1 ? this.quantitiesStrToArray(unique[0].parameter2) : null;
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
          ...NALDHelpers.formatAbstractionPoint(purposePoint.point_detail)
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
        return NALDHelpers.formatAbstractionPoint(purposePoint.point_detail);
        // console.log(purposePoint);
        // return NALDHelpers.abstractionPointToString(NALDHelpers.formatAbstractionPoint(purposePoint.point_detail));
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
          cWrapper = { ...titles,
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
