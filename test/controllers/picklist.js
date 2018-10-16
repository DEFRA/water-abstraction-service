const Lab = require('lab');

const lab = Lab.script();
const server = require('../../index.js');
const { expect } = require('code');

const endpoint = '/water/1.0/picklists';

lab.experiment('Test picklists endpoint', () => {
  // Create
  lab.test('The API should create a new picklist', async () => {
    const request = {
      method: 'POST',
      url: endpoint,
      payload: {
        picklist_id: 'test_list',
        name: 'Test list',
        id_required: false
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    expect(res.statusCode).to.equal(201);
  });

  // Retrieve
  lab.test('The API should get a saved picklist', async () => {
    const request = {
      method: 'GET',
      url: `${endpoint}/test_list`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);
    expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);
    expect(payload.data.picklist_id).to.equal('test_list');
    expect(payload.data.name).to.equal('Test list');
    expect(payload.data.id_required).to.equal(false);
  });

  // Update
  lab.test('The API should update a picklist', async () => {
    const request = {
      method: 'PATCH',
      url: `${endpoint}/test_list`,
      payload: {
        name: 'Test list - updated',
        id_required: true
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);
    expect(payload.data.picklist_id).to.equal('test_list');
    expect(payload.data.name).to.equal('Test list - updated');
    expect(payload.data.id_required).to.equal(true);
  });

  // Delete
  lab.test('The API should delete a picklist', async () => {
    const request = {
      method: 'DELETE',
      url: `${endpoint}/test_list`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    // Check payload
    expect(res.statusCode).to.equal(200);
  });
});

exports.lab = lab;
