const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');

const { findOne } = require('../../src/lib/repository-helpers');
const { repository: taskConfigRepo } = require('../../src/controllers/task-config');

lab.experiment('Test loading task config', () => {
  const taskConfig = {
    task_config_id: 123
  };

  const callFindOne = () => {
    return findOne(taskConfigRepo, 123);
  };

  lab.afterEach(() => {
    taskConfigRepo.find.restore();
  });

  lab.test('Loads one record', async () => {
    sinon.stub(taskConfigRepo, 'find').resolves({
      error: null,
      rows: [taskConfig]
    });
    const result = await callFindOne();
    expect(result).to.equal(taskConfig);
  });

  lab.test('Throws 404 error if error not found', async () => {
    sinon.stub(taskConfigRepo, 'find').resolves({
      error: null,
      rows: []
    });

    expect(callFindOne()).to.reject();
  });

  lab.test('Throws error if DB error', async () => {
    sinon.stub(taskConfigRepo, 'find').resolves({
      error: 'Some DB error',
      rows: null
    });

    expect(callFindOne()).to.reject();
  });
});

exports.lab = lab;
