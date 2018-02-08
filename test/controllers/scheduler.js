const Lab = require('lab');

const lab = Lab.script();
const Code = require('code');
const server = require('../../index.js');

let taskId;
const endpoint = '/water/1.0/scheduler';


lab.experiment('Test POST session creation', () => {


  // Create session
  lab.test('The API should create a new scheduler with POST', async () => {
    const request = {
      method: 'POST',
      url: endpoint,
      payload: {
        task_type : 'test',
        licence_ref : '00/00/00/00/T0001',
        task_config : '{}',
      },
      headers: {
        Authorization : process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    // Check payload
    const payload = JSON.parse(res.payload);
    taskId = payload.data.task_id;
  });

  // Create session
  lab.test('The API should GET a scheulder by ID', async () => {
    const request = {
      method: 'GET',
      url: `${ endpoint }/${ taskId }`,
      headers: {
        Authorization : process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    // Check payload
    Code.expect(res.statusCode).to.equal(200);
  });


  // Delete session
  lab.test('The API should delete a scheulder with DELETE', async () => {
    const request = {
      method: 'DELETE',
      url: `${ endpoint }/${ taskId }`,
      headers: {
        Authorization : process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200);

  });


});

exports.lab = lab;
