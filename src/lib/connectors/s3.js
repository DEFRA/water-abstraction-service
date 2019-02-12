const aws = require('aws-sdk');
const proxyAgent = require('proxy-agent');

const config = require('../../../config.js');
const { bucket, proxy, ...credentials } = config.s3;
aws.config.update(credentials);

if (proxy) {
  aws.config.update({
    httpOptions: { agent: proxyAgent(proxy) }
  });
}

const s3 = new aws.S3();

const upload = async (filename, buffer) => {
  const options = {
    Bucket: bucket,
    Key: filename,
    Body: buffer
  };

  return s3.upload(options).promise();
};

module.exports = {
  upload
};
