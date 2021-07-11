'use strict';

// When an image is detected give it a lineAttribute
// of Image with the URL to the iamge
exports.collectContentImage = (hookName, {node, state: {lineAttributes}, tname}) => {
  if (tname === 'div' || tname === 'p') delete lineAttributes.img;
  if (tname !== 'img') return;
  lineAttributes.img =
      // Client-side. This will also be used for server-side HTML imports once jsdom adds support
      // for HTMLImageElement.currentSrc.
      node.currentSrc ||
      // Server-side HTML imports using jsdom v16.6.0 (Etherpad v1.8.15).
      node.src ||
      // Server-side HTML imports using cheerio (Etherpad <= v1.8.14).
      (node.attribs && node.attribs.src);
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
