'use strict';

const server = require('../../../index');
const s3DownloadJob = require('../../modules/import/jobs/s3-download');

const run = async (data) => {
  try {
    await server.messageQueue.publish(s3DownloadJob.createMessage());
    return { error: null };
  } catch (error) {
    return { error };
  }
};

exports.run = run;
