'use strict';

/**
 * Server-side hooks
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_server_side_hooks}
 */

var eejs = require('ep_etherpad-lite/node/eejs/');
var settings = require('ep_etherpad-lite/node/utils/Settings');
var mimeDB = require('mime-db');

/**
 * ClientVars hook
 *
 * Exposes plugin settings from settings.json to client code inside clientVars variable to be accessed from client side hooks
 *
 * @param {string} hook_name Hook name ("clientVars").
 * @param {object} args Object containing the arguments passed to hook. {pad: {object}}
 * @param {function} cb Callback
 *
 * @returns {*} callback
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_clientvars}
 */
exports.clientVars = function (hook_name, args, cb) {
    var pluginSettings = settings.ep_image_upload;
    if (!pluginSettings) {
        console.warn(hook_name, 'ep_image_upload settings not found. The settings can be specified in EP settings.json.');

        return cb();
    }
    pluginSettings.mimeDB = mimeDB;

    return cb({ep_image_upload: pluginSettings});
};

exports.eejsBlock_editbarMenuRight = function (hook_name, args, cb) {
    args.content = args.content + eejs.require("ep_image_upload/templates/editBarButtons.ejs");
    return cb();
}

exports.padInitToolbar = function (hook_name, args) {
    var toolbar = args.toolbar;
    var addImageButton = toolbar.button({
        command: 'addImage',
        class: 'buttonicon ep_image_upload image_upload'
    });

    toolbar.registerButton('addImage', addImageButton);
};
