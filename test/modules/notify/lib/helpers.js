const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');

const { isPdf, parseSentResponse } = require('../../../../src/modules/notify/lib/helpers.js');

lab.experiment('Test isPdf', () => {
  lab.test('Should return true for PDF message ref', async () => {
    Code.expect(isPdf('pdf.return_form')).to.equal(true);
  });

  lab.test('Should not be case-sensitive', async () => {
    Code.expect(isPdf('PDF.RETURN_FORM')).to.equal(true);
  });

  lab.test('Should return false for other message ref', async () => {
    Code.expect(isPdf('security_code_letter')).to.equal(false);
  });
});

lab.experiment('Test parseSentResponse', () => {
  const notifyResponse = {
    body: {
      id: 'abc123',
      content: {
        body: 'body here'
      }
    }
  };

  lab.test('Should parse Notify response correctly', async () => {
    Code.expect(parseSentResponse(notifyResponse)).to.equal({
      status: 'sent',
      notify_id: 'abc123',
      plaintext: 'body here'
    });
  });
});

exports.lab = lab;
