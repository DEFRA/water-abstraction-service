// contains generic functions unrelated to a specific component
var rp = require('request-promise-native').defaults({
  strictSSL: false
});

function post (message) {
  return new Promise((resolve, reject) => {
    console.log(process.env.slackhook);
    console.log(process.env.slackhook);
    console.log(process.env.slackhook);

    var uri = 'https://hooks.slack.com/services/' + process.env.slackhook;
    console.log(uri);
    var options = { method: 'POST',
      url: uri,
      headers:
       { 'content-type': 'application/x-www-form-urlencoded'},
      form: { payload: '{"channel": "#beta-activity", "username": "Gerald The Water Buffalo", "text": "' + message + '", "icon_emoji": ":water_buffalo:"}' } };
    rp(options)
      .then(function (response) {
        resolve('yay');
      })
      .catch(function (err) {
        // console.log(responseData)
        reject(err);
      });
  });
}

module.exports = {
  post
};
