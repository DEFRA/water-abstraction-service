'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const notesService = require('../../../src/lib/services/notes-service');
const noteRepo = require('../../../src/lib/connectors/repos/notes');
const Note = require('../../../src/lib/models/note');
const sandbox = require('sinon').createSandbox();

experiment('lib/services/charge-versions', () => {
  beforeEach(async () => {

  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.decorateWithInvoiceAccount', () => {
    let model, note, result;

    beforeEach(async () => {
      model = {
        id: 'test-model-id',
        foo: 'bar'
      };
      note = {
        id: 'test-note-id'
      };
      sandbox.stub(noteRepo, 'findByChargeVersionId').resolves(note);
    });

    experiment('when the note is not null', () => {
      beforeEach(async () => {
        result = await notesService.decorateWithNote(model);
      });

      test('gets note by charge version id', () => {
        const [id] = noteRepo.findByChargeVersionId.lastCall.args;
        expect(id).to.equal('test-model-id');
      });

      test('decorates the model with the mapped note', () => {
        expect(result.note).to.be.instanceOf(Note);
        expect(result.note.id).to.equal(model.note.id);
      });

      test('the rest of the model remains unchanged', () => {
        expect(result.id).to.equal(model.id);
        expect(result.foo).to.equal(model.foo);
      });
    });
  });
});
