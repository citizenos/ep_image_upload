'use strict'

/**
 * Module dependencies.
 * @private
 */

var db = {};

/*
var splitDeviceRe =
    /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

// Regex to split the tail part of the above into [*, dir, basename, ext]
var splitTailRe =
    /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;

var win32 = {};

// Function to split a filename into [root, dir, basename, ext]
function win32SplitPath(filename) {
  // Separate device+slash from tail
  var result = splitDeviceRe.exec(filename),
      device = (result[1] || '') + (result[2] || ''),
      tail = result[3] || '';
  // Split the tail into dir, basename and extension
  var result2 = splitTailRe.exec(tail),
      dir = result2[1],
      basename = result2[2],
      ext = result2[3];
  return [device, dir, basename, ext];
}

win32.extname = function(path) {
  return win32SplitPath(path)[3];
};
*/
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
  
    // TODO: use media-typer
    var match = EXTRACT_TYPE_REGEXP.exec(type)
    // get extensions
    var exts = match && exports.extensions[match[1].toLowerCase()]
    if (!exts || !exts.length) {
      return false
    }
  
    return exts[0]
  }


function populateMaps (extensions, types) {
    // source preference (least -> most)
    var preference = ['nginx', 'apache', undefined, 'iana']
  
    Object.keys(db).forEach(function forEachMimeType (type) {
      var mime = db[type]
      var exts = mime.extensions
  
      if (!exts || !exts.length) {
        return
      }
  
      // mime -> extensions
      extensions[type] = exts
  
      // extension -> mime
      for (var i = 0; i < exts.length; i++) {
        var extension = exts[i]
  
        if (types[extension]) {
          var from = preference.indexOf(db[types[extension]].source)
          var to = preference.indexOf(mime.source)
  
          if (types[extension] !== 'application/octet-stream' &&
            (from > to || (from === to && types[extension].substr(0, 12) === 'application/'))) {
            // skip the remapping
            continue
          }
        }
  
        // set the extension -> mime
        types[extension] = type
      }
    })
  }
  