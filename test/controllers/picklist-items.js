const Lab = require('lab');

const lab = Lab.script();
const server = require('../../index.js');
const { expect } = require('code');

const listEndpoint = '/water/1.0/picklists';
const endpoint = '/water/1.0/picklist-items';
const listId = 'picklist_items_test';
let itemId;

lab.experiment('Test picklist items endpoint', () => {
  lab.before(async () => {
    const request = {
      method: 'POST',
      url: listEndpoint,
      payload: {
        picklist_id: listId,
        name: 'Picklist item test list',
        id_required: false
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };
    const res = await server.inject(request);
    expect(res.statusCode).to.equal(201);
  });

  lab.after(async () => {
    // Delete
    const request = {
      method: 'DELETE',
      url: `${listEndpoint}/picklist_items_test`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);
    expect(res.statusCode).to.equal(200);
  });

  // Create
  lab.test('The API should create a new picklist item', async () => {
    const request = {
      method: 'POST',
      url: endpoint,
      payload: {
        picklist_id: listId,
        value: 'Test item'
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);
    expect(res.statusCode).to.equal(201);

    const payload = JSON.parse(res.payload);
    itemId = payload.data.picklist_item_id;
  });

  // Retrieve
  lab.test('The API should get a saved picklist item', async () => {
    const request = {
      method: 'GET',
      url: `${endpoint}/${itemId}`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);
    expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);

    expect(payload.data.picklist_item_id).to.equal(itemId);
    expect(payload.data.picklist_id).to.equal(listId);
    expect(payload.data.value).to.equal('Test item');
  });

  // Update
  lab.test('The API should update a picklist item', async () => {
    const request = {
      method: 'PATCH',
      url: `${endpoint}/${itemId}`,
      payload: {
        value: 'Test item - updated'
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);
    expect(payload.data.value).to.equal('Test item - updated');
  });

  // Delete
  lab.test('The API should delete a picklist item', async () => {
    const request = {
      method: 'DELETE',
      url: `${endpoint}/${itemId}`,
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
