'use strict';

var ace2_inner = require('ep_etherpad-lite/static/js/ace2_inner');
var _ = require('ep_etherpad-lite/static/js/underscore');
var imageUpload = require('ep_image_upload/static/js/imageUpload');
var mime = require('ep_image_upload/static/js/lib/mime-type');

var image = {
    removeImage: function (lineNumber) {
        var documentAttributeManager = this.documentAttributeManager;
        documentAttributeManager.removeAttributeOnLine(lineNumber, 'img'); // make the line a task list
    },
    addImage: function (rep, src) {
        var documentAttributeManager = this.documentAttributeManager;
        var lineNumber = rep.selStart[0];   
        src = '<img src="' + src + '">';
        rep.alines.splice(lineNumber+1, 0, '');
        rep.lines.push(lineNumber);
        documentAttributeManager.setAttributeOnLine(lineNumber, 'img', src); // make the line a task list
    }
};

function checkFileType (type) {
    var allowedExt = null;
    if (clientVars.ep_image_upload) {
        if (clientVars.ep_image_upload.fileTypes) {
            allowedExt = clientVars.ep_image_upload.fileTypes;
        }
        if (clientVars.ep_image_upload.mimeDB) {
            mime.init(clientVars.ep_image_upload.mimeDB);
        }
    }
    var allowedTypes = [];
    if (allowedExt) {
        allowedExt.forEach(function (ext) {
            var fileType = mime.getType(ext);
            allowedTypes.push(fileType);
        });
        _.uniq(allowedTypes);

        return allowedTypes.indexOf(type) > -1;
    } else {
        return type.match('image.*')
    }
}

function checkFileSize(size) {
    if (clientVars.ep_image_upload && clientVars.ep_image_upload.maxFileSize) {
        return size <= clientVars.ep_image_upload.maxFileSize;
    }

    return true;
}

function checkFile (file) {
    if (!file) {
        return false;
    }
    if (checkFileSize(file.size)) {
        var fileTypeValid = checkFileType(file.type);
        if (!fileTypeValid) {
            alert('Allowed filetypes are ' + (clientVars.ep_image_upload.fileTypes || 'image.*'));
        }

        return fileTypeValid;
    } else {
        alert('Maximum allowed image size is ' + clientVars.ep_image_upload.maxFileSize);

        return false;
    }

    return false;
}

exports.postToolbarInit = function (hook_name, context) {
    if (!imageUpload.settings() && clientVars) {
        imageUpload.init(clientVars.ep_image_upload);
    }

    var editbar = context.toolbar; // toolbar is actually editbar - http://etherpad.org/doc/v1.5.7/#index_editbar

    editbar.registerCommand('addImage', function () {
        $(document).find('body').find('#imageInput').remove();
        var fileInputHtml = '<input style="width:1px;height:1px;z-index:-10000;" id="imageInput" type="file" />';
        $(document).find('body').append(fileInputHtml);
        $(document).find('body').find('#imageInput').on('change', function (e) {
            var files = e.target.files;
            if (!files.length) {
                return 'Please choose a file to upload first.';
            }
            var file = files[0];
            if (!checkFileSize(file.size)) {
                console.log(file.size);
            }
            if (checkFile(file)) {
                imageUpload.uploadImageToS3(file).on('complete', function (data) {
                    var path = data.request.params.Key;
                    var pathItems = path.split('/');
                    pathItems.shift();
                    var finalPath = imageUpload.getS3Path(pathItems.join('/'));
                    // Now to insert the base64 encoded image into the pad
                    context.ace.callWithAce(function (ace) {
                        var rep = ace.ace_getRep();
                        ace.ace_addImage(rep, finalPath);
                        var doc = ace.ace_getDocument();
                        var e = new KeyboardEvent('keydown', {
                            code: 'Enter',
                            keyCode: 13
                        });
                        doc.dispatchEvent(e);
                    }, 'img', true);
                });
            }

        });
        $(document).find('body').find('#imageInput').trigger('click');
    });
};

exports.aceAttribsToClasses = function (name, context) {
    if (context.key === 'img') {
        return ['img:' + context.value];
    }
};

// Rewrite the DOM contents when an IMG attribute is discovered
exports.aceDomLineProcessLineAttributes = function (name, context) {
    var cls = context.cls;
    var exp = /(?:^| )img:([^>]*)/;
    var imgType = exp.exec(cls);

    if (!imgType) return [];

    var randomId = Math.floor((Math.random() * 100000) + 1); 
    var template = '<span id="' + randomId + '" class="image">';
    if (imgType[1]) {
        var preHtml = template + imgType[1] + ' style="width:100%;">';
        var postHtml = '</span>';
        var modifier = {
            preHtml: preHtml,
            postHtml: postHtml,
            processedMarker: true
        };

        return [modifier];
    }
    
    return [];
};

exports.aceEditorCSS = function () {
    return ['/ep_image_upload/static/css/ace.css'];
};

exports.aceInitialized = function (hook, context) {
    var editorInfo = context.editorInfo;
    editorInfo.ace_addImage = _(image.addImage).bind(context);
    editorInfo.ace_removeImage = _(image.removeImage).bind(context);
};

exports.collectContentImage = function (name, context) {
    var tname = context.tname;
    var state = context.state;
    var lineAttributes = state.lineAttributes;
    if (tname === 'div' || tname === 'p') {
        delete lineAttributes.img;
    }
    if (tname === 'img') {
        lineAttributes.img = context.node.outerHTML;
    }
};

exports.aceRegisterBlockElements = function () {
    return ['img']; 
};
