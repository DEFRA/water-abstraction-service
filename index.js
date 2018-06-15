// provides all API services consumed by VML and VML Admin front ends
require('dotenv').config();

const Hapi = require('hapi');

const serverOptions = { connections: { router: { stripTrailingSlash: true } } };
const server = new Hapi.Server(serverOptions);
const messageQueue = require('./src/lib/message-queue');

server.connection({ port: process.env.PORT || 8001 });

if (process.env.DATABASE_URL) {
  // get heroku db params from env vars

  var workingVariable = process.env.DATABASE_URL.replace('postgres://', '');
  console.log(workingVariable);
  process.env.PGUSER = workingVariable.split('@')[0].split(':')[0];
  process.env.PGPASSWORD = workingVariable.split('@')[0].split(':')[1];
  process.env.PGHOST = workingVariable.split('@')[1].split(':')[0];
  process.env.PSPORT = workingVariable.split('@')[1].split(':')[1].split('/')[0];
  process.env.PGDATABASE = workingVariable.split('@')[1].split(':')[1].split('/')[1];
}

const cacheKey = process.env.cacheKey || 'super-secret-cookie-encryption-key';
console.log('Cache key' + cacheKey);

// isSecure = true for live...
var yarOptions = {
  storeBlank: false,
  cookieOptions: {
    password: 'the-password-must-be-at-least-32-characters-long',
    isSecure: false
  }
};

server.register([
  {
    register: require('yar'),
    options: yarOptions
  },
  {
    register: require('node-hapi-airbrake-js'),
    options: {
      key: process.env.errbit_key,
      host: process.env.errbit_server
    }
  },
  {
    // Plugin to display the routes table to console at startup
    // See https://www.npmjs.com/package/blipp
    register: require('blipp'),
    options: {
      showAuth: true
    }
  },
  require('hapi-auth-basic'),
  require('hapi-auth-jwt2'),
  require('inert'),
  require('vision')
], (err) => {
  if (err) {
    throw err;
  }

  function validateBasic (request, userName, password, callback) {
    // basic login for admin function UI
    var data = {};
    data.user_name = userName;
    data.password = password;
    const httpRequest = require('request');

    var method = 'post';
    var URI = process.env.IDM_URI + '/user/login';
    console.log(URI);
    httpRequest({
      method: method,
      url: URI + '?token=' + process.env.JWT_TOKEN,
      form: data
    },
    function (err, httpResponse, body) {
      if (err) {
        console.error(err);
      }
      console.log('got http ' + method + ' response');
      console.log(body);
      var responseData = JSON.parse(body);
      if (responseData.err) {
        return callback(null, false);
      } else {
        callback(null, true, { id: responseData.user_id, name: data.user_name });
      }
    });
  }

  function validateJWT (decoded, request, callback) {
    // bring your own validation function
    // console.log(request.url.path)
    // console.log(request.payload)
    //  console.log('CALL WITH TOKEN')
    //  console.log(decoded)
    // TODO: JWT tokens to DB...
    // do your checks to see if the person is valid
    if (!decoded.id) {
      console.log('boo... JWT failed');
      return callback(null, false);
    } else {
      console.log('huzah... JWT OK');
      return callback(null, true);
    }
  }

  server.auth.strategy('simple', 'basic', { validateFunc: validateBasic });

  server.auth.strategy('jwt', 'jwt', {
    key: process.env.JWT_SECRET, // Never Share your secret key
    validateFunc: validateJWT, // validate function defined above
    verifyOptions: {}, // pick a strong algorithm
    verifyFunc: validateJWT
  });

  server.auth.default('jwt');

  // load views

  // load routes
  //  server.route(require('./src/routes/API'))
  server.route(require('./src/routes/water'));
});

async function start () {
  await messageQueue.start();

  const { registerSubscribers } = require('./src/modules/notify')(messageQueue);
  registerSubscribers();

  server.log('info', 'Message queue started');

  // Register subscribers
  // require('./src/subscribers')(messageQueue);

  server.start((err) => {
    if (err) {
      throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
  });
}

// Start the server if not testing with Lab
if (!module.parent) {
  start();
}

module.exports = server;
