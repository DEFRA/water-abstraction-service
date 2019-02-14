const jobs = {
  start: require('./start-xml-upload'),
  xmlToJson: require('./xml-to-json')
};

const registerSubscribers = async messageQueue => {
  await messageQueue.subscribe(jobs.start.jobName, jobs.start.handler);
  await messageQueue.subscribe(jobs.xmlToJson.jobName, jobs.xmlToJson.handler);

  await messageQueue.onComplete(jobs.start.jobName, async job => {
    // XML document has been validated against XSD schema.
    //
    // Publish a new job which will convert the valid XML into
    // a JSON blob which will be uploaded back to S3.
    const { eventId } = job.data.request.data;
    await jobs.xmlToJson.publish(eventId);
  });
};

module.exports = {
  registerSubscribers
};
