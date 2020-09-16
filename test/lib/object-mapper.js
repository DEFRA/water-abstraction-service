const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { createMapper } = require('../../src/lib/object-mapper');

experiment('lib/object-mapper', () => {
  let mapper;

  experiment('for a basic mapping', () => {
    beforeEach(async () => {
      mapper = createMapper()
        .map('foo').to('foo');
    });

    test('maps a string to the output', async () => {
      const data = {
        foo: 'bar'
      };
      expect(mapper.execute(data)).to.equal({ foo: 'bar' });
    });

    test('maps null to the output', async () => {
      const data = {
        foo: null
      };
      expect(mapper.execute(data)).to.equal({ foo: null });
    });

    test('skips undefined values', async () => {
      const data = {
        foo: undefined
      };
      expect(mapper.execute(data)).to.equal({ });
    });
  });

  experiment('can rename a property', () => {
    beforeEach(async () => {
      mapper = createMapper()
        .map('foo').to('foo2');
    });

    test('maps a string to the output', async () => {
      const data = {
        foo: 'bar'
      };
      expect(mapper.execute(data)).to.equal({ foo2: 'bar' });
    });
  });

  experiment('can map nested properties', () => {
    beforeEach(async () => {
      mapper = createMapper()
        .map('foo.bar').to('baz.boo');
    });

    test('maps a string to the output', async () => {
      const data = {
        foo: {
          bar: 'hello'
        }
      };
      expect(mapper.execute(data)).to.equal({ baz: { boo: 'hello' } });
    });
  });

  experiment('can supply a mapping function', () => {
    beforeEach(async () => {
      mapper = createMapper()
        .map('foo').to('foo', x => x * 2);
    });

    test('maps a string to the output', async () => {
      const data = {
        foo: 5
      };
      expect(mapper.execute(data)).to.equal({ foo: 10 });
    });
  });

  experiment('can prevent mapping nulls with option', () => {
    beforeEach(async () => {
      mapper = createMapper()
        .map('foo').to('foo', { mapNull: false });
    });

    test('maps a string to the output', async () => {
      const data = {
        foo: null
      };
      expect(mapper.execute(data)).to.equal({ });
    });
  });

  experiment('can specify mapping nulls as global option', () => {
    beforeEach(async () => {
      mapper = createMapper({ mapNull: false })
        .map('foo').to('foo')
        .map('bar').to('bar', { mapNull: true })
        .map('baz').to('baz', { mapNull: false });
    });

    test('maps a string to the output', async () => {
      const data = {
        foo: null,
        bar: null,
        baz: null
      };
      expect(mapper.execute(data)).to.equal({ bar: null });
    });
  });

  experiment('can map multiple fields', () => {
    beforeEach(async () => {
      mapper = createMapper()
        .map(['a', 'b']).to('c', (a, b) => a + b);
    });

    test('maps a string to the output', async () => {
      const data = {
        a: 3,
        b: 5
      };
      expect(mapper.execute(data)).to.equal({ c: 8 });
    });

    test('throws an error if a mapper not provided', async () => {
      const func = () => createMapper().map(['a', 'b']).to('c');
      const err = expect(func).to.throw();
      expect(err.message).to.equal('error mapping to .c: when >1 source key, a mapper is required');
    });
  });

  experiment('when a source key is omitted', () => {
    beforeEach(async () => {
      mapper = createMapper()
        .map().to('baz');
    });

    test('the entire object is supplied to the mapper', async () => {
      const data = {
        foo: 'bar'
      };
      expect(mapper.execute(data)).to.equal({ baz: { foo: 'bar' } });
    });
  });

  experiment('can copy multiple properties', () => {
    beforeEach(async () => {
      mapper = createMapper()
        .copy('foo', 'bar');
    });

    test('the entire object is supplied to the mapper', async () => {
      const data = {
        foo: 'a',
        bar: 'b',
        baz: 'c'
      };
      expect(mapper.execute(data)).to.equal({ foo: 'a', bar: 'b' });
    });
  });
});
