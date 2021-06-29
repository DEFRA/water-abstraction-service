const permissionsMap = {
  basic: {
    roles: [],
    groups: []
  },

  billing_and_data: {
    roles: [],
    groups: ['billing_and_data']
  },

  environment_officer: {
    roles: [],
    groups: ['environment_officer']
  },

  nps: {
    roles: [],
    groups: ['nps']
  },

  nps_ar_user: {
    roles: ['ar_user'],
    groups: ['nps']
  },

  nps_ar_approver: {
    roles: ['ar_approver'],
    groups: ['nps']
  },

  psc: {
    roles: [],
    groups: ['psc']
  },

  wirs: {
    roles: [],
    groups: ['wirs']
  }

};

const getRolesForPermissionKey = key => permissionsMap[key];

/**
 * IDM roles
 * @type {Object}
 */
const ROLES = {
  chargeVersionWorkflowEditor: 'charge_version_workflow_editor',
  chargeVersionWorkflowReviewer: 'charge_version_workflow_reviewer',
  manageAgreements: 'manage_agreements',
  deleteAgreements: 'delete_agreements',
  billing: 'billing',
  abstractionAlertsNotifications: 'hof_notifications',
  manageGaugingStationLicenceLinks: 'manage_gauging_station_licence_links',
  viewChargeVersions: 'view_charge_versions',
  manageBillingAccounts: 'manage_billing_accounts'
};

exports.getRolesForPermissionKey = getRolesForPermissionKey;
exports.ROLES = ROLES;
