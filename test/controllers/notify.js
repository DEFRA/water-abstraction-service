const Lab = require('lab');

const lab = Lab.script();
const Code = require('code');
const server = require('../../index.js');

let taskId;

lab.experiment('Test sending a email notification', () => {
  lab.test('The API should throw an error when personalisation is not supplied', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notify/unit_test_email',
      payload: {
        recipient: 'test@test.com'
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };
    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(400);
  });

  // Send email notification
  lab.test('The API should throw an error when an invalid template id is supplied', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notify/template_doesnt_exist',
      payload: {
        recipient: 'test@test.com',
        personalisation: {
          'test_value': '00/00/00/00'
        }
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(400);
  });

  // Send email notification
  lab.test('The API should throw an error when a template id that is missing in notify is supplied', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notify/unit_test_missing_in_notify',
      payload: {
        recipient: 'test@test.com',
        personalisation: {
          'test_value': '00/00/00/00'
        }
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(400);
  });

  // Send email notification
  lab.test('The API should throw an error when personalisation params are missing', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notify/unit_test_email',
      payload: {
        recipient: 'test@test.com'
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    Code.expect(res.statusCode).to.equal(400);
  });

  // Send email notification
  lab.test('The API should not throw an error when valid email address specified for message of type email', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notify/unit_test_email',
      payload: {
        recipient: 'test@test.com',
        personalisation: {
          'test_value': '00/00/00/00'
        }
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    Code.expect(res.statusCode).to.equal(200);
  });
});
lab.experiment('Test sending a SMS notification', () => {
  // Send email notification
  lab.test('The API should not throw an error when valid number specified for message of type sms', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notify/unit_test_sms',
      payload: {
        recipient: '+447446880860',
        personalisation: {
          'test_value': '00/00/00/00'
        }
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200);
  });
});

lab.experiment('Test sending a Postal notification', () => {
  // Send letter notification
  lab.test('The API should not throw an error when valid address specified for message of type letter', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notify/unit_test_letter',
      payload: {
        recipient: 'insert name',
        personalisation: {
          address_line_1: 'The Occupier', // required
          address_line_2: '123 High Street', // required
          address_line_3: 'London',
          postcode: 'SW14 6BH', // required
          test_value: '00/00/00/00'
        }
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    Code.expect(res.statusCode).to.equal(200);
  });
});

// futureSend
lab.experiment('Scheduled notifications', () => {
  // Send email notification
  lab.test('The API should not throw an error when scheduling a message', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notifyLater/unit_test_email',
      payload: {
        id: 'unit-test-notification',
        recipient: 'test@test.com',
        personalisation: {
          'test_value': '00/00/00/00'
        },
        sendafter: '2018-01-01'
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    Code.expect(res.statusCode).to.equal(200);
  });

  lab.test('The API should throw an error when invalid date is supplied when scheduling a message', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notifyLater/unit_test_email',
      payload: {
        id: 'unit-test-notification',
        personalisation: {
          'test_value': '00/00/00/00'
        },
        sendafter: 'x2018-01-01'
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);

    Code.expect(res.statusCode).to.equal(400);
  });

  lab.test('The API should throw an error when database throws an error', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notifyLater/unit_test_email',
      payload: {
        id: 'unit-test-notification-b',
        recipient: 'test@test.com',
        personalisation: {
          'test_value': '00/00/00/00'
        },
        sendafter: '2018x-01-01'
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };
    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(400);
  });
});
exports.lab = lab;
