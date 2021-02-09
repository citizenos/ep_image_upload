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
    if (context.node.currentSrc) {
      // client
      lineAttributes.img = context.node.currentSrc;
    } else {
      // server
      lineAttributes.img = context.node.outerHTML;
    }
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
