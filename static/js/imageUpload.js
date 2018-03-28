'use strict';

require('ep_image_upload/static/js/lib/aws-sdk-2.205.0.min');
var randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;
var mime = require('ep_image_upload/static/js/lib/mime-type');

var settings = {};
var storage;

exports.settings = function () {
    return settings;
};

var isInit = function (key) {
    if (!settings || !Object.keys(settings).length || (key && !settings[key])) {
        return false;
    }

    return true;
};

var init = function (params) {
    settings = params;
    if (!settings || !Object.keys(settings).length) {

        return 'Missing settings params';
    }
    if (settings.mimeDB) {
        mime.init(settings.mimeDB);
    }
};

exports.init = init;

var getS3Path = function (filename) {
    if (!isInit('s3')) {
        init(clientVars.ep_image_upload);
    }
    if (settings.s3.baseFolder) {
        filename = settings.s3.baseFolder + '/' + filename;
    }
    var path = 'https://' + settings.s3.bucket + '.s3.amazonaws.com/' + filename;
    
    return path;
};

exports.getS3Path = getS3Path;

var uploadImageToS3 = function (file, cb) {
    if (!file) {
        return;
    }
    if (!isInit('s3')) {
        init(clientVars.ep_image_upload);
    }
    AWS.config.update({accessKeyId: settings.s3.accessKeyId, secretAccessKey: settings.s3.secretAccessKey, region: settings.s3.region});
    storage = new AWS.S3({params: {Bucket: settings.s3.bucket}});

    var padId = clientVars.padId;
    var objKey = padId + '/' + file.name;
    if (settings.s3.baseFolder) {
        objKey = settings.s3.baseFolder + '/' + objKey;
    }
  
    var params = {
        Key: objKey,
        ContentType: file.type,
        Body: file,
        ACL: 'public-read'
    };
    var defaultCB = function (err, data) {
        if (err) {
            return err;
        } else {
            return getS3Path(padId + '/' + file.name);
        }
    };
    if (!cb) {
        cb = defaultCB;
    }
    
    return storage.putObject(params, cb);
};

var removeImageFromS3 = function (path) {
    if (!isInit('s3')) {
        init(clientVars.ep_image_upload);
    }
    var padId = clientVars.padId;
    var filename = path.split('\\').pop().split('/').pop();
    AWS.config.update({accessKeyId: settings.s3.accessKeyId, secretAccessKey: settings.s3.secretAccessKey, region: settings.s3.region});
    storage = new AWS.S3({params: {Bucket: settings.s3.bucket}});
    var objKey = padId + '/' + file.name;
    if (settings.s3.baseFolder) {
        objKey = settings.s3.baseFolder + '/' + objKey;
    }
    var params = {
        Key: objKey
    };
    return s3.deleteObject(params);
};

exports.uploadImageToS3 = uploadImageToS3;
exports.removeImageFromS3 = removeImageFromS3;

var isBase64Encoded = function (str) {
    var regex = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*)\s*$/i;

    return regex.test(str);
};

var checkPath = function (src) {
    return src.indexOf(getS3Path()) === 0;
};

exports.srcCheck = function (path) {
    var isBase64 = isBase64Encoded(path);
    if (isBase64) {
        return true;
    }

    return checkPath(path);
};

exports.uploadFromURL = function (dataURI) {
    if (!isInit('s3') && clientVars) {
        init(clientVars.ep_image_upload);
    }
    // convert base64/URLEncoded data component to raw binary data held in a string
    var filename = '';
    var isBase64 = isBase64Encoded(dataURI);
    if (isBase64) {
        filename = randomString(10);
    } else {
        filename = dataURI.substring(dataURI.lastIndexOf('/')+1);
    }
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(dataURI.split(',')[1]);
    } else {
        return;
    // byteString = unescape(dataURI.split(',')[1]);
    }

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    var file = new Blob([ia], {type:mimeString});
    var extension = mime.extension(mimeString);
    file.lastModifiedDate = new Date();
    file.name = filename + '.'+ extension ;

    return uploadImageToS3(file);
};
