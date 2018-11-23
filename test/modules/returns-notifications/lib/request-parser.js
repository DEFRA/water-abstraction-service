const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');

const { parseRequest, getConfig } = require('../../../../src/modules/returns-notifications/lib/request-parser.js');

lab.experiment('Test getConfig', () => {
  lab.test('It should get a default config object', async () => {
    const result = getConfig();
    Code.expect(result).to.equal({
      rolePriority: ['licence_holder']
    });
  });

  lab.test('It should be possible to override default options', async () => {
    const result = getConfig({
      rolePriority: ['returns_to', 'licence_holder']
    });
    Code.expect(result).to.equal({
      rolePriority: ['returns_to', 'licence_holder']
    });
  });
});

lab.experiment('Test parseRequest', () => {
  const request = {
    params: {
      notificationId: 'pdf.return'
    },
    payload: {
      filter: {
        return_id: 'abc'
      },
      issuer: 'mail@example.com',
      name: 'Friendly name',
      config: {
        rolePriority: ['returns_to', 'licence_holder']
      }
    }
  };

  lab.test('parseRequest should parse the request into variables used by the controller', async () => {
    const result = parseRequest(request);
    Code.expect(result).to.equal({ messageRef: 'pdf.return',
      filter: { return_id: 'abc' },
      issuer: 'mail@example.com',
      name: 'Friendly name',
      columns: [ 'return_id', 'licence_ref' ],
      sort: {},
      config: request.payload.config
    });
  });
});

exports.lab = lab;
