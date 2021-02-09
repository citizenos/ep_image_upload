'use strict';

exports.collectContentImage = (name, context) => {
  const tname = context.tname;
  const lineAttributes = context.state.lineAttributes;
  if (tname === 'div' || tname === 'p') {
    delete lineAttributes.img;
  }
  if (tname === 'img') {
    lineAttributes.img = context.node.outerHTML;
  }
};
