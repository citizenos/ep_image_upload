'use strict';

/**
 * Server-side hooks
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_server_side_hooks}
 */

var eejs = require('ep_etherpad-lite/node/eejs/');
var Changeset = require('ep_etherpad-lite/static/js/Changeset');
var settings = require('ep_etherpad-lite/node/utils/Settings');
var Busboy = require('busboy');
var StreamUpload = require('stream_upload');
var uuid = require('uuid');
var path = require('path');
var mimetypes = require('mime-db');
var url = require('url');

/**
 * ClientVars hook
 *
 * Exposes plugin settings from settings.json to client code inside clientVars variable to be accessed from client side hooks
 *
 * @param {string} hookName Hook name ("clientVars").
 * @param {object} args Object containing the arguments passed to hook. {pad: {object}}
 * @param {function} cb Callback
 *
 * @returns {*} callback
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_clientvars}
 */
exports.clientVars = function (hookName, args, cb) {
    var pluginSettings = {};
    var keys = Object.keys(settings.ep_image_upload);
    keys.forEach(function (key) {
        if (key !== 'storage') {
            pluginSettings[key] = settings.ep_image_upload[key];
        }
    });

    if (!pluginSettings) {
        console.warn(hookName, 'ep_image_upload settings not found. The settings can be specified in EP settings.json.');

        return cb();
    }
    pluginSettings.mimeTypes = mimetypes;
    return cb({ep_image_upload: pluginSettings});
};

exports.eejsBlock_editbarMenuRight = function (hookName, args, cb) {
    var eejsContent = eejs.require('ep_image_upload/templates/editBarButtons.ejs');
    args.content += eejsContent;

    return cb();
};

exports.eejsBlock_body = function (hookName, args, cb) {
    var modal = eejs.require('ep_image_upload/templates/modal.ejs', {}, module);
    args.content += modal;

    return cb();
};

exports.eejsBlock_styles = function (hookName, args, cb) {
    var style = eejs.require('ep_image_upload/templates/styles.ejs', {}, module);
    args.content += style;

    return cb();
};

exports.padInitToolbar = function (hookName, args) {
    var toolbar = args.toolbar;
    var addImageButton = toolbar.button({
        command: 'addImage',
        class: 'buttonicon ep_image_upload image_upload'
    });

    toolbar.registerButton('addImage', addImageButton);
};

var _analyzeLine = function (alineAttrs, apool) {
    var image = null;
    if (alineAttrs) {
        var opIter = Changeset.opIterator(alineAttrs);
        if (opIter.hasNext()) {
            var op = opIter.next();
            image = Changeset.opAttributeValue(op, 'img', apool);
        }
    }

    return image;
};

exports.getLineHTMLForExport = function (hook, context) {
    var image = _analyzeLine(context.attribLine, context.apool);
    if (image) {
        context.lineContent = image;
    }
};

var drainStream = function (stream) {
    stream.on('readable', stream.read.bind(stream));
};

exports.expressConfigure = function (hookName, context) {
    console.debug('EP_IMAGE_UPLOAD PARAMS', settings.ep_image_upload);

    context.app.post('/p/:padId/pluginfw/ep_image_upload/upload', function (req, res, next) {
        console.debug('EP_IMAGE_UPLOAD POST', req.params);
        
        var padId = req.params.padId;
        var imageUpload = new StreamUpload({
            extensions: settings.ep_image_upload.fileTypes,
            maxSize: settings.ep_image_upload.maxFileSize,
            baseFolder: settings.ep_image_upload.storage.baseFolder,
            storage: settings.ep_image_upload.storage
        });
        var storageConfig = settings.ep_image_upload.storage;
        if (storageConfig) {
            try {
                var busboy = new Busboy({
                    headers: req.headers,
                    limits: {
                        fileSize: settings.ep_image_upload.maxFileSize
                    }
                });
            } catch (error) {
                console.error('EP_IMAGE_UPLOAD ERROR', error);

                return next(error);
            }
            
            var isDone;
            var done = function (error) {
                console.debug('EP_IMAGE_UPLOAD UPLOAD ERROR', error);

                if (isDone) return;
                isDone = true;
                
                res.status(error.statusCode || 500).json(error);
                req.unpipe(busboy);
                drainStream(req);
                busboy.removeAllListeners();

                return;
            };
            var uploadResult;
            var newFileName = uuid.v4();
            var accessPath  = '';
            busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
                var savedFilename = path.join(padId, newFileName + path.extname(filename));
                
                if (!settings.ep_image_upload.storage.type || settings.ep_image_upload.storage.type === 'local') {
                    accessPath = url.resolve(settings.ep_image_upload.storage.baseURL, savedFilename);
                    savedFilename = path.join(settings.ep_image_upload.storage.baseFolder, savedFilename);                    
                }
                file.on('limit', function () {
                    var error = new Error('File is too large');
                    error.type = 'fileSize';
                    error.statusCode = 403;
                    busboy.emit('error', error);
                    imageUpload.deletePartials();
                });
                file.on('error', function (error) {
                    busboy.emit('error', error);
                });

                uploadResult = imageUpload
                    .upload(file, {type: mimetype, filename: savedFilename});
                
            });

            busboy.on('error', done);
            busboy.on('finish', function () {
                if (uploadResult) {
                    uploadResult
                        .then(function (data) {
                            
                            if (accessPath) {
                                data = accessPath;
                            }

                            return res.status(201).json(data);
                        })
                        .catch(function (err) {
                            return res.status(500).json(err);
                        });
                }
                
            });
            req.pipe(busboy);
        }

        
    });
};

