'use strict'

/**
 * Module dependencies.
 * @private
 */

var db = {};


var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/
exports.extensions = Object.create(null);
exports.types = Object.create(null);

// Populate the extensions/types maps
populateMaps(exports.extensions, exports.types);

exports.init = function (newdb) {
  db = newdb;
};

exports.extension = function (type) {
    populateMaps(exports.extensions, exports.types);

    if (!type || typeof type !== 'string') {
      return false
    }

    var match = EXTRACT_TYPE_REGEXP.exec(type)

    var exts = match && exports.extensions[match[1].toLowerCase()]
    if (!exts || !exts.length) {
      return false
    }

    return exts[0];
}


function populateMaps (extensions, types) {
    var preference = ['nginx', 'apache', undefined, 'iana']
  
    Object.keys(db).forEach(function forEachMimeType (type) {
      var mime = db[type]
      var exts = mime.extensions
  
      if (!exts || !exts.length) {
        return
      }

      extensions[type] = exts

      for (var i = 0; i < exts.length; i++) {
        var extension = exts[i]
  
        if (types[extension]) {
          var from = preference.indexOf(db[types[extension]].source)
          var to = preference.indexOf(mime.source)
  
          if (types[extension] !== 'application/octet-stream' &&
            (from > to || (from === to && types[extension].substr(0, 12) === 'application/'))) {
            continue
          }
        }
  
        types[extension] = type
      }
    })
}

exports.getType = function (path) {
  populateMaps(exports.extensions, exports.types);

  path = String(path);
  var last = path.replace(/^.*[/\\]/, '').toLowerCase();
  var ext = last.replace(/^.*\./, '').toLowerCase();

  var hasPath = last.length < path.length;
  var hasDot = ext.length < last.length - 1;

  return (hasDot || !hasPath) && exports.types[ext] || null;
};
