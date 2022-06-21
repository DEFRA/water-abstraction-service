const sinon = require('sinon');
const Lab = require('@hapi/lab');
const { set } = require('lodash');
const { experiment, test, afterEach, beforeEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');

const searchUsers = require('../../../../src/modules/internal-search/lib/search-users');
const idm = require('../../../../src/lib/connectors/idm');

const getUser = () => {
  return {
    user_id: 'id_1',
    user_name: 'info@example.com',
    role: {
      scopes: ['internal']
    }
  };
};

const getPagination = () => {
  return {
    page: 3,
    perPage: 50
  };
};

const getExternalUser = () => {
  const user = getUser();
  return set(user, 'role.scopes', ['external']);
};

experiment('getFilter', () => {
  test('It should get a filter for searching users', async () => {
    const filter = searchUsers.getFilter('info@example.com');
    expect(filter).to.equal({
      user_name: {
        $ilike: '%info@example.com%'
      }
    });
  });
});

experiment('mapRow', () => {
  let user;

  beforeEach(async () => {
    user = getUser();
  });

  test('It should include the user ID field', async () => {
    const mapped = searchUsers.mapRow(user);
    expect(mapped.userId).to.equal(user.user_id);
  });

  test('It should include the email address field', async () => {
    const mapped = searchUsers.mapRow(user);
    expect(mapped.email).to.equal(user.user_name);
  });

  test('The isInternal flag should be true if internal user', async () => {
    const mapped = searchUsers.mapRow(user);
    expect(mapped.isInternal).to.equal(true);
  });

  test('The isInternal flag should be false if external user', async () => {
    user = getExternalUser();
    const mapped = searchUsers.mapRow(user);
    expect(mapped.isInternal).to.equal(false);
  });
});

experiment('searchUsers', () => {
  let stub;
  let user;
  let pagination;

  beforeEach(async () => {
    user = getUser();
    pagination = getPagination();
  });

  afterEach(async () => {
    stub.restore();
  });

  test('It should throw an error if error returned from IDM API call', async () => {
    stub = sinon.stub(idm.usersClient, 'findMany').resolves({ error: 'Some error' });
    expect(searchUsers.searchUsers('mail@example.com', 2)).to.reject();
  });

  test('It should return mapped data from IDM API call', async () => {
    stub = sinon.stub(idm.usersClient, 'findMany').resolves({ data: [user], pagination });
    const result = await searchUsers.searchUsers('mail@example.com', 2);
    expect(result.pagination).to.equal(getPagination());
    expect(result.data).to.be.an.array();
    expect(result.data[0]).to.only.include(['userId', 'email', 'isInternal', 'isExternal']);
  });
});
