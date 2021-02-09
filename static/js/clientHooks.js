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

const _handleNewLines = (ace) => {
  const rep = ace.ace_getRep();
  const lineNumber = rep.selStart[0];
  const curLine = rep.lines.atIndex(lineNumber);
  if (curLine.text) {
    ace.ace_doReturnKey();

    return lineNumber + 1;
  }

  return lineNumber;
};

const _isValid = (file) => {
  const mimedb = clientVars.ep_image_upload.mimeTypes;
  const mimeType = mimedb[file.type];
  let validMime = null;
  if (clientVars.ep_image_upload && clientVars.ep_image_upload.fileTypes) {
    validMime = false;
    if (mimeType && mimeType.extensions) {
      for (const fileType of clientVars.ep_image_upload.fileTypes) {
        const exists = mimeType.extensions.indexOf(fileType);
        if (exists > -1) {
          validMime = true;
        }
      }
    }
    if (validMime === false) {
      const errorMessage = window._('ep_image_upload.error.fileType');
      $('#imageUploadModalError .error').html(errorMessage);
      $('#imageUploadModalError').show();

      return false;
    }
  }

  if (clientVars.ep_image_upload && file.size > clientVars.ep_image_upload.maxFileSize) {
    const errorMessage = window._('ep_image_upload.error.fileSize');
    $('#imageUploadModalError .error').html(errorMessage);
    $('#imageUploadModalError').show();

    return false;
  }

  return true;
};
exports.postToolbarInit = (hook, context) => {
  const toolbar = context.toolbar;
  $('#closeErrorModalButton').on('click', () => {
    $('#imageUploadModalError').hide();
  });
  toolbar.registerCommand('addImage', () => {
    $(document).find('body').find('#imageInput').remove();
    const fileInputHtml = `<input
    style="width:1px;height:1px;z-index:-10000;"
    id="imageInput" type="file" />`;
    $(document).find('body').append(fileInputHtml);

    $(document).find('body').find('#imageInput').on('change', (e) => {
      const files = e.target.files;
      if (!files.length) {
        return 'Please choose a file to upload first.';
      }
      const file = files[0];

      if (!_isValid(file)) {
        return;
      }
      if (clientVars.ep_image_upload.storageType === 'base64') {
        $('#imageUploadModalLoader').hide();
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const data = reader.result;
          context.ace.callWithAce((ace) => {
            const imageLineNr = _handleNewLines(ace);
            ace.ace_addImage(imageLineNr, data);
            ace.ace_doReturnKey();
          }, 'img', true);
        };
      } else {
        const formData = new FormData();

        // add assoc key values, this will be posts values
        formData.append('file', file, file.name);
        $('#imageUploadModalLoader').show();
        $.ajax({
          type: 'POST',
          url: `/p/${clientVars.padId}/pluginfw/ep_image_upload/upload`,
          xhr: () => {
            const myXhr = $.ajaxSettings.xhr();

            return myXhr;
          },
          success: (data) => {
            $('#imageUploadModalLoader').hide();
            context.ace.callWithAce((ace) => {
              const imageLineNr = _handleNewLines(ace);
              ace.ace_addImage(imageLineNr, data);
              ace.ace_doReturnKey();
            }, 'img', true);
          },
          error: (error) => {
            let errorResponse;
            try {
              errorResponse = JSON.parse(error.responseText.trim());
              if (errorResponse.type) {
                errorResponse.message = window._(`ep_image_upload.error.${errorResponse.type}`);
              }
            } catch (err) {
              errorResponse = {message: error.responseText};
            }

            $('#imageUploadModalLoader').hide();
            $('#imageUploadModalError .error').html(errorResponse.message);
            $('#imageUploadModalError').show();
          },
          async: true,
          data: formData,
          cache: false,
          contentType: false,
          processData: false,
          timeout: 60000,
        });
      }
    });
    $(document).find('body').find('#imageInput').trigger('click');
  });
};

exports.aceAttribsToClasses = (name, context) => {
  if (context.key === 'img') {
    return [`img:${context.value}`];
  }
};

// Rewrite the DOM contents when an IMG attribute is discovered
exports.aceDomLineProcessLineAttributes = (name, context) => {
  const imgType = (/(?:^| )img:([^> ]*)/).exec(context.cls);

  if (!imgType) return [];
  const randomId = Math.floor((Math.random() * 100000) + 1);
  if (imgType[1]) {
    const preHtml = `<span id="${randomId}" class="image"><img src="${imgType[1]}">`;
    const postHtml = '</span>';
    const modifier = {
      preHtml,
      postHtml,
      processedMarker: true,
    };

    return [modifier];
  }

  return [];
};

exports.aceEditorCSS = () => ['/ep_image_upload/static/css/ace.css'];

exports.aceInitialized = (hook, context) => {
  const editorInfo = context.editorInfo;
  editorInfo.ace_addImage = image.addImage.bind(context);
  editorInfo.ace_removeImage = image.removeImage.bind(context);
};

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

exports.aceRegisterBlockElements = () => ['img'];
