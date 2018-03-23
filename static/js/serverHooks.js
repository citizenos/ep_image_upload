'use strict';

/**
 * Server-side hooks
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_server_side_hooks}
 */

var settings = require('ep_etherpad-lite/node/utils/Settings');

/**
 * ClientVars hook
 *
 * Exposes plugin settings from settings.json to client code inside clientVars variable to be accessed from client side hooks
 *
 * @param {string} hook_name Hook name ("clientVars").
 * @param {object} args Object containing the arguments passed to hook. {pad: {object}}
 * @param {function} cb Callback
 *
 * @returns {*}
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_clientvars}
 */
exports.clientVars = function (hook_name, args, cb) {
    var plugin_settings = settings.ep_image_upload;
    if (!plugin_settings) {
        console.warn('ep_image_upload settings not found. The settings can be specified in EP settings.json.');
        return cb();
    }
    return cb({ep_image_upload: plugin_settings});
};