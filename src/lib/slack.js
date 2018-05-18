// contains generic functions unrelated to a specific component
var rp = require('request-promise-native').defaults({
  strictSSL: false
});

function post (message) {
  console.log(`Slack: ${message}`);
  const uri = 'https://hooks.slack.com/services/' + process.env.slackhook;
  const options = {
    method: 'POST',
    url: uri,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    form: { payload: '{"channel": "#beta-activity", "username": "Gerald The Water Buffalo", "text": "' + message + '", "icon_emoji": ":water_buffalo:"}' }
  };

  return rp(options)
    .catch((err) => {
      console.error(`Slack error`, err.statusCode, err.message);
    });
}

module.exports = {
  post
};
