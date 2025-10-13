var exec = require('cordova/exec');
exports.vibrate = function (pattern, success, error) {
  exec(success, error, 'AdvVibration', 'vibrate', [pattern]);
};
