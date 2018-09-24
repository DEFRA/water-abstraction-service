const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');

const { parseRequest } = require('../../../../src/modules/returns-notifications/lib/request-parser.js');

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
      name: 'Friendly name'
    }
  };

  lab.test('parseRequest should parse the request into variables used by the controller', async () => {
    const result = parseRequest(request);
    Code.expect(result).to.equal({ messageRef: 'pdf.return',
      filter: { return_id: 'abc' },
      issuer: 'mail@example.com',
      name: 'Friendly name',
      columns: [ 'return_id', 'licence_ref' ],
      sort: {} });
  });
});

exports.lab = lab;
