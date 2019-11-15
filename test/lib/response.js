const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const response = require('../../src/lib/response');

experiment('lib/response', () => {
  experiment('.envelope', () => {
    test('returns the wrapped data', async () => {
      const data = {
        camelCase: 'humps',
        'kebab-case': 'pitta',
        snake_case: 'hiss'
      };

      const output = response.envelope(data);

      expect(output).to.equal({
        data: {
          camelCase: 'humps',
          'kebab-case': 'pitta',
          snake_case: 'hiss'
        },
        error: null
      });
    });

    test('camel cases keys on demand', async () => {
      const data = {
        camelCase: 'humps',
        'kebab-case': 'pitta',
        snake_case: 'hiss'
      };

      const output = response.envelope(data, true);

      expect(output).to.equal({
        data: {
          camelCase: 'humps',
          kebabCase: 'pitta',
          snakeCase: 'hiss'
        },
        error: null
      });
    });

    test('includes the error is passed', async () => {
      const data = { camelCase: 'humps' };
      const err = { result: 'bad' };

      const output = response.envelope(data, false, err);

      expect(output).to.equal({
        data: { camelCase: 'humps' },
        error: { result: 'bad' }
      });
    });
  });

  experiment('.errorEnvelope', () => {
    test('returns the wrapped data', async () => {
      const err = {
        code: 2,
        reason: 'problem'
      };

      const output = response.errorEnvelope(err);

      expect(output).to.equal({
        data: null,
        error: err
      });
    });
  });
});
