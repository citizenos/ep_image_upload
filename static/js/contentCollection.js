'use strict';

const {_isValid, uploadFile} = require('ep_image_upload/static/js/toolbar');

// When an image is detected give it a lineAttribute
// of Image with the URL to the iamge
exports.collectContentImage = (hookName, {node, state: {lineAttributes}, tname}) => {
  if (tname === 'div' || tname === 'p') delete lineAttributes.img;
  if (tname !== 'img') return;
  const imageData =
      // Client-side. This will also be used for server-side HTML imports once jsdom adds support
      // for HTMLImageElement.currentSrc.
      node.currentSrc ||
      // Server-side HTML imports using jsdom v16.6.0 (Etherpad v1.8.15).
      node.src ||
      // Server-side HTML imports using cheerio (Etherpad <= v1.8.14).
      (node.attribs && node.attribs.src);

  if (typeof window !== 'undefined' && clientVars.ep_image_upload.storageType === 'local') {
    if (/^http/.test(imageData)) {
      // an uploaded image is copied, place a copy in the desired line
      lineAttributes.img = imageData;
      return;
    }

    const padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;

    const match = imageData.match(/data:([^;]+);base64,(.*)/);
    if (!match || !match[1] || !match[2]) return;

    // decode from internal base64 rep
    const decodedData = Uint8Array.from(window.atob(match[2]), (c) => c.charCodeAt(0));

    // check if size is within limits and mime type is supported
    const extension = _isValid({size: decodedData.length, type: match[1]});
    if (!extension) return;

    const blob = new Blob([decodedData], {type: match[1]});

    // image.* is a temporary name not used on the server
    uploadFile(padeditor, blob, `image.${extension}`);
  } else {
    lineAttributes.img = imageData;
  }
};

exports.collectContentPre = (name, context) => {
};

exports.collectContentPost = (name, context) => {
  const tname = context.tname;
  const state = context.state;
  const lineAttributes = state.lineAttributes;
  if (tname === 'img') {
    delete lineAttributes.img;
  }
};

exports.ccRegisterBlockElements = (name, context) => ['img'];
