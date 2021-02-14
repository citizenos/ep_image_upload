'use strict';

exports.loadSettings = (hookName, settings, cb) => {
  // Setting maxHttpBufferSize to 10 MiB :)
  settings.settings.maxHttpBufferSize = 10000000;
  cb();
};
