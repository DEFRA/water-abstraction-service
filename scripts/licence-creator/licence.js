const getNextId = require('./next-id.js');

const RepUnit = require('./rep-unit');

/**
 * NALD licence class for building dummy licences
 * @class Party
 */
class Licence {
  constructor (licenceNumber) {
    this.id = getNextId();
    this.licenceNumber = licenceNumber;
    this.startDate = '01/01/2018';
    this.expiryDate = '01/01/2220';

    this.versions = [];
    this.repUnit = new RepUnit();
    this.roles = [];

    this.returnVersions = [];
  }

  addVersion (version) {
    this.versions.push(version);
    version.setLicence(this);
    return this;
  }

  setStartDate (date) {
    this.startDate = date;
  }

  setExpiryDate (date) {
    this.expiryDate = date;
  }

  addRole (role) {
    this.roles.push(role);
    role.setLicence(this);
    return this;
  }

  addReturnVersion (returnVersion) {
    returnVersion.setLicence(this);
    this.returnVersions.push(returnVersion);
    return this;
  }

  exportAll () {
    const NALD_ABS_LIC_VERSIONS = this.versions.map(version => version.export());

    const NALD_WA_LIC_TYPES = this.versions.map(version => version.waLicenceType.export());

    // Parties
    const NALD_PARTIES = this.versions.map(version => version.party.export());

    // Contacts
    const NALD_CONTACTS = this.versions.reduce((memo, version) => {
      return [...memo, ...version.party.contacts.map(contact => contact.export())];
    }, []);

    // Addresses
    const NALD_ADDRESSES = this.versions.reduce((memo, version) => {
      memo = [...memo, ...version.party.contacts.map(contact => contact.address.export())];
      return memo;
    }, []);

    // Rep unit
    const NALD_REP_UNITS = [this.repUnit.export()];

    // Roles
    const NALD_LIC_ROLES = this.roles.map(role => role.export());

    // Role types
    const NALD_LIC_ROLE_TYPES = this.roles.map(role => role.roleType.export());

    // Contact Nos
    const NALD_CONT_NOS = this.roles.reduce((memo, role) => {
      return [...memo, ...role.contactNos.map(contactNo => contactNo.export())];
    }, []);

    // Contact no types
    const NALD_CONT_NO_TYPES = this.roles.reduce((memo, role) => {
      return [...memo, ...role.contactNos.map(contactNo => contactNo.contactNoType.export())];
    }, []);

    // Purposes
    const NALD_ABS_LIC_PURPOSES = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.map(purpose => purpose.export())];
    }, []);

    // Primary purposes
    const NALD_PURP_PRIMS = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.map(purpose => purpose.primary.export())];
    }, []);

    // Secondary purposes
    const NALD_PURP_SECS = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.map(purpose => purpose.secondary.export())];
    }, []);

    // Tertiary purposes
    const NALD_PURP_USES = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.map(purpose => purpose.tertiary.export())];
    }, []);

    // Conditions
    const NALD_LIC_CONDITIONS = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.reduce((memo2, purpose) => {
        return purpose.conditions.map(condition => condition.export());
      }, [])];
    }, []);

    // Condition type
    const NALD_LIC_COND_TYPES = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.reduce((memo2, purpose) => {
        return purpose.conditions.map(condition => condition.type.export());
      }, [])];
    }, []);

    // Agreements
    const NALD_LIC_AGRMNTS = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.reduce((memo2, purpose) => {
        return purpose.agreements.map(agreement => agreement.export());
      }, [])];
    }, []);

    // Purpose points
    const NALD_ABS_PURP_POINTS = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.reduce((memo2, purpose) => {
        return purpose.purposePoints.map(purposePoint => purposePoint.export());
      }, [])];
    }, []);

    // Means of abs
    const NALD_MEANS_OF_ABS = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.reduce((memo2, purpose) => {
        return purpose.purposePoints.map(purposePoint => purposePoint.means.export());
      }, [])];
    }, []);

    // Points
    const NALD_POINTS = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.reduce((memo2, purpose) => {
        return purpose.purposePoints.map(purposePoint => purposePoint.point.export());
      }, [])];
    }, []);

    // Sources
    const NALD_SOURCES = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.reduce((memo2, purpose) => {
        return purpose.purposePoints.map(purposePoint => purposePoint.point.source.export());
      }, [])];
    }, []);

    // Return version
    const NALD_RET_VERSIONS = this.returnVersions.map(returnVersion => returnVersion.export());

    // Return formats
    const NALD_RET_FORMATS = this.returnVersions.reduce((memo, rv) => {
      const formats = rv.formats.map(row => row.export());
      return [...memo, ...formats];
    }, []);

    // Format points
    const NALD_RET_FMT_POINTS = this.returnVersions.reduce((memo, rv) => {
      for (const format of rv.formats) {
        memo.push(...format.points.map(point => point.export()));
      }
      return memo;
    }, []);

    // Format purposes
    const NALD_RET_FMT_PURPOSES = this.returnVersions.reduce((memo, rv) => {
      for (const format of rv.formats) {
        memo.push(...format.purposes.map(purpose => purpose.export()));
      }
      return memo;
    }, []);

    return {
      NALD_ABS_LICENCES: [this.export()],
      NALD_ABS_LIC_VERSIONS,
      NALD_WA_LIC_TYPES,
      NALD_PARTIES,
      NALD_CONTACTS,
      NALD_ADDRESSES,
      NALD_REP_UNITS,
      NALD_LIC_ROLES,
      NALD_LIC_ROLE_TYPES,
      NALD_CONT_NOS,
      NALD_CONT_NO_TYPES,
      NALD_ABS_LIC_PURPOSES,
      NALD_PURP_PRIMS,
      NALD_PURP_SECS,
      NALD_PURP_USES,
      NALD_SOURCES,
      NALD_LIC_CONDITIONS,
      NALD_LIC_COND_TYPES,
      NALD_LIC_AGRMNTS,
      NALD_ABS_PURP_POINTS,
      NALD_MEANS_OF_ABS,
      NALD_POINTS,
      NALD_RET_VERSIONS,
      NALD_RET_FORMATS,
      NALD_RET_FMT_POINTS,
      NALD_RET_FMT_PURPOSES
    };
  }

  /**
   * Get data in NALD format
   */
  export () {
    return {
      ID: this.id,
      LIC_NO: this.licenceNumber,
      AREP_SUC_CODE: 'ARSUC',
      AREP_AREA_CODE: 'ARCA',
      SUSP_FROM_BILLING: 'N',
      AREP_LEAP_CODE: 'C4',
      EXPIRY_DATE: this.expiryDate,
      ORIG_EFF_DATE: this.startDate,
      ORIG_SIG_DATE: null,
      ORIG_APP_NO: null,
      ORIG_LIC_NO: null,
      NOTES: '',
      REV_DATE: null,
      LAPSED_DATE: null,
      SUSP_FROM_RETURNS: null,
      AREP_CAMS_CODE: this.repUnit.code,
      X_REG_IND: 'N',
      PREV_LIC_NO: null,
      FOLL_LIC_NO: null,
      AREP_EIUC_CODE: 'ANOTH',
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  };
}

module.exports = Licence;
