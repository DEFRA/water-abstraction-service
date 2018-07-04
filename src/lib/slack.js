const os = require('os');
const hostname = os.hostname();

// contains generic functions unrelated to a specific component
const rp = require('request-promise-native').defaults({
  strictSSL: false
});

function post (message) {
  const msg = message + ' - ' + hostname + ' - ' + process.env.environment;
  console.log(`Slack: ${msg}`);
  const uri = 'https://hooks.slack.com/services/' + process.env.slackhook;
  const options = {
    method: 'POST',
    url: uri,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    form: { payload: '{"channel": "#beta-activity", "username": "Gerald The Water Buffalo", "text": "' + msg + '", "icon_emoji": ":water_buffalo:"}' }
  };

  return rp(options)
    .catch((err) => {
      console.error(`Slack error`, err.statusCode, err.message);
    });
}

module.exports = {
  post
};
