'use strict';

const image = {
  removeImage(lineNumber) {
    const documentAttributeManager = this.documentAttributeManager;
    documentAttributeManager.removeAttributeOnLine(lineNumber, 'img');
  },
  addImage(lineNumber, src) {
    const documentAttributeManager = this.documentAttributeManager;
    documentAttributeManager.setAttributeOnLine(lineNumber, 'img', src);
  },
};

exports.aceAttribsToClasses = (name, context) => {
  if (context.key === 'img') {
    let imgUrl = context.value;
    if (context.value.indexOf('<img') === 0) {
      const urlMatch = (/src\s*=\s*"([^\s]+\/\/[^/]+.\/[^\s]+\.\w*)/gi).exec(context.value);
      imgUrl = urlMatch[1];
    }
    return [`img:${imgUrl}`];
  }
};

// Rewrite the DOM contents when an IMG attribute is discovered
exports.aceDomLineProcessLineAttributes = (name, context) => {
  const imgType = (/(?:^| )img:([^> ]*)/).exec(context.cls);

  if (!imgType) return [];
  // const randomId = Math.floor((Math.random() * 100000) + 1);
  if (imgType[1]) {
    const preHtml = `<img src="${imgType[1]}">`;
    const postHtml = '';
    const modifier = {
      preHtml,
      postHtml,
      processedMarker: true,
    };

    return [modifier];
  }

  return [];
};

exports.aceEditorCSS = () => [
  '/ep_image_upload/static/css/ace.css',
  '/ep_image_upload/static/css/ep_image_upload.css',
];

exports.aceInitialized = (hook, context) => {
  const editorInfo = context.editorInfo;
  editorInfo.ace_addImage = image.addImage.bind(context);
  editorInfo.ace_removeImage = image.removeImage.bind(context);
};

exports.aceRegisterBlockElements = () => ['img'];
