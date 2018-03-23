var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;
var s3Script = require('ep_image_upload/static/js/lib/aws-sdk-2.205.0.min');
var randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;
var pluginSettings = clientVars.ep_image_upload;
var mime = require('ep_image_upload/static/js/lib/mime-type');

var s3;
var initS3 = function () {
  if (!pluginSettings || !pluginSettings.s3 || !pluginSettings) {
    return 'Missing settings params';
  }
  AWS.config.update({ accessKeyId: pluginSettings.s3.accessKeyId, secretAccessKey: pluginSettings.s3.secretAccessKey, region: pluginSettings.s3.accessKeyId });
  s3 = new AWS.S3({ params: { Bucket: pluginSettings.s3.bucket } });
};
initS3();

var closeModal = function () {
  $(document).find("#imageModal").parent().remove();
};

var getS3Path = function (filename) {
  return 'https://' + pluginSettings.s3.bucket + '.s3.amazonaws.com/' + pluginSettings.s3.baseFolder + '/' + filename;
};
exports.getS3Path = getS3Path;
function uploadImageToS3 (file, cb) {
  if(!file) {
    return;
  }
  var padId = clientVars.padId;
  var objKey = folder + '/' + padId + '/' + file.name;
   var params = {
      Key: objKey,
      ContentType: file.type,
      Body: file,
      ACL: 'public-read'
  };
  var defaultCB = function(err, data) {
    if (err) {
      console.log('ERR', err);
    } else {
      return getS3Path(padId + '/' + file.name);
    }
  }
  if (!cb) {
    cb = defaultCB;
  }
  return s3.putObject(params, cb);
};
exports.uploadImageToS3 = uploadImageToS3;


function isBase64Encoded (str) {
  var regex = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*)\s*$/i;
  return regex.test(str);
}

function checkPath (src) {
  return src.indexOf(getS3Path()) === 0;
}

exports.srcCheck  = function (path) {
  var isBase64 = isBase64Encoded(path);
  if (isBase64) {
    return true;
  }
  return checkPath(path);
}

exports.uploadFromURL = function (dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var filename = '';
  var isBase64 = isBase64Encoded(dataURI);
  console.log('BASE64');
  console.log(dataURI);
  console.log(isBase64);
  if (isBase64) {
    filename = randomString(10);
  } else {
    filename = dataURI.substring(dataURI.lastIndexOf('/')+1);
  }
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURI.split(',')[1]);
  }
  else {
    return ;
   // byteString = unescape(dataURI.split(',')[1]);
  }

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  console.log(mimeString);

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  var file = new Blob([ia], {type:mimeString});
  var extension = mime.extension(mimeString);
  var extension
  file.lastModifiedDate = new Date();
  file.name = filename + '.'+ extension ;
  return uploadImageToS3(file);
}
