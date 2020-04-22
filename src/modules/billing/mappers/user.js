const User = require('../../../lib/models/user');

/**
 * Maps json data from DB to User model
 * @param {Object} data user data from DB
 * @return {User}
 */
const mapToModel = data => {
  if (!data) return null;
  const user = new User();
  return user.fromHash({
    id: data.id,
    email: data.email
  });
};

exports.mapToModel = mapToModel;
