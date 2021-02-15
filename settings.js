'use strict';

exports.loadSettings = (hookName, settings, cb) => {
  // Setting maxHttpBufferSize to 10 MiB :)
  settings.settings.socketio.maxHttpBufferSize = 100000000;
  cb();
};
