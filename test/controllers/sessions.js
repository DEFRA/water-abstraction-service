const Lab = require('lab');

const lab = Lab.script();
const Code = require('code');
const server = require('../../index.js');

let sessionId;


lab.experiment('Test POST session creation', () => {


  // Create session
  lab.test('The API should create a new session with POST', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/sessions',
      payload: {
        ip : '127.0.0.1',
        session_data: '{"user_id" : 1234}'
      },
      headers: {
        Authorization : process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    // Check payload
    const payload = JSON.parse(res.payload);
    sessionId = payload.data.session_id;
  });

  // Create session
  lab.test('The API should GET a session by ID', async () => {
    const request = {
      method: 'GET',
      url: '/water/1.0/sessions/' + sessionId,
      headers: {
        Authorization : process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    // Check payload
    Code.expect(res.statusCode).to.equal(200);
  });


  // Delete session
  lab.test('The API should delete a session with DELETE', async () => {
    const request = {
      method: 'DELETE',
      url: '/water/1.0/sessions/' + sessionId,
      headers: {
        Authorization : process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200);

  });


});

exports.lab = lab;
