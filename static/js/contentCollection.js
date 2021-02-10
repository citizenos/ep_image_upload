'use strict';

// When an image is detected give it a lineAttribute
// of Image with the URL to the iamge
exports.collectContentImage = (name, context) => {
  const tname = context.tname;
  const state = context.state;
  const lineAttributes = state.lineAttributes;
  if (tname === 'div' || tname === 'p') {
    delete lineAttributes.img;
  }
  if (tname === 'img') {
    // client
    if (context.node.currentSrc) lineAttributes.img = context.node.currentSrc;
    // server
    if (context.node.attribs) lineAttributes.img = context.node.attribs.src;
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
