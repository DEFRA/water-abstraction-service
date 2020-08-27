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
  chargeVersionWorkflowApprover: 'charge_version_workflow_approver'
};

exports.getRolesForPermissionKey = getRolesForPermissionKey;
exports.ROLES = ROLES;
