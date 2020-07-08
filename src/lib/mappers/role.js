'use strict';

const Role = require('../models/role-v2');

const crmToModel = entity => {
  const role = new Role(entity.roleId);
  return role.pickFrom(entity, ['name', 'dateCreated', 'dateUpdated']);
};

exports.crmToModel = crmToModel;
