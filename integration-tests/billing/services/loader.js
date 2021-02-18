class SharedData {
  constructor () {
    this._sharedData = new Map();
  }

  set (key, value) {
    console.log('setting ' + key);
    return this._sharedData.set(key, value);
  }

  getAll () {
    return this._sharedData;
  }

  get (key) {
    return this._sharedData.get(key);
  }
}

const sharedData = new SharedData();

const load = async (service, file) => {
  const loaders = {
    crm: require('../services/crm-loader')(sharedData),
    idm: require('../services/idm-loader')(sharedData),
    water: require('../services/water-loader')(sharedData),
    permits: require('../services/permits-loader')(sharedData),
    returns: require('../services/returns-loader')(sharedData)
  };

  console.log(`Loading ${file} from ${service}`);
  await loaders[service].load(file);
};

exports.load = load;
