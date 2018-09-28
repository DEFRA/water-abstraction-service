const { getRenderNotification: render } = require('./index.js');

const getRenderNotification = async (request, h) => {
  const { notificationId } = request.params;
  return render(notificationId);
};

module.exports = {
  getRenderNotification
};
