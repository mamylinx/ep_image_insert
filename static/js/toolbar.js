'use strict';
const _handleNewLines = (ace) => {
  const rep = ace.ace_getRep();
  const lineNumber = rep.selStart[0];
  const curLine = rep.lines.atIndex(lineNumber);
  if (curLine.text) {
    // Handle image insertion in a table
    // let nPL = [];
    // let i = 0;
    // var tblJSONObj = JSON.parse(curLine.text);
    // let PL = tblJSONObj.payload[0];
    // while (i < PL.length) {
    //   nPL[i] = PL[i].trim().length + 4;
    //   i++;
    // }
    // i = 0;
    // let _rep_pos = 15;

    // while (_rep_pos < rep.selStart[1]) {
    //   _rep_pos = _rep_pos + nPL[i];
    //   i++;
    // }
    // tblJSONObj.payload[0][i] = `Image`
    // rep.lines.atIndex(lineNumber).text = JSON.stringify(tblJSONObj);
    // End of insertion image in table

    ace.ace_doReturnKey();
    return lineNumber + 1;
  }

  return lineNumber;
};

const _isValid = (file) => {
  const mimedb = clientVars.ep_image_insert.mimeTypes;
  const mimeType = mimedb[file.type];
  let validMime = null;
  const errorTitle = html10n.get('ep_image_insert.error.title');

  if (clientVars.ep_image_insert && clientVars.ep_image_insert.fileTypes) {
    validMime = false;
    if (mimeType && mimeType.extensions) {
      for (const fileType of clientVars.ep_image_insert.fileTypes) {
        const exists = mimeType.extensions.indexOf(fileType);
        if (exists > -1) {
          validMime = true;
        }
      }
    }
    if (validMime === false) {
      const errorMessage = html10n.get('ep_image_insert.error.fileType');
      $.gritter.add({ title: errorTitle, text: errorMessage, sticky: true, class_name: 'error' });

      return false;
    }
  }

  if (clientVars.ep_image_insert && file.size > clientVars.ep_image_insert.maxFileSize) {
    const allowedSize = (clientVars.ep_image_insert.maxFileSize / 1000000);
    const errorText = html10n.get('ep_image_insert.error.fileSize', { maxallowed: allowedSize });
    $.gritter.add({ title: errorTitle, text: errorText, sticky: true, class_name: 'error' });

    return false;
  }

  return true;
};


exports.postToolbarInit = (hook, context) => {
  const toolbar = context.toolbar;
  toolbar.registerCommand('imageUpload', () => {
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
      if (clientVars.ep_image_insert.storageType === 'base64') {
        $('#imageUploadModalLoader').removeClass('popup-show');
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
        $('#imageUploadModalLoader').addClass('popup-show');
        $.ajax({
          type: 'POST',
          url: `${clientVars.padId}/pluginfw/ep_image_insert/upload`,
          xhr: () => {
            const myXhr = $.ajaxSettings.xhr();

            return myXhr;
          },
          success: (data) => {
            $('#imageUploadModalLoader').removeClass('popup-show');
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
                errorResponse.message = `ep_image_insert.error.${errorResponse.type}`;
              }
            } catch (err) {
              errorResponse = { message: error.responseText };
            }
            const errorTitle = html10n.get('ep_image_insert.error.title');
            const errorText = html10n.get(errorResponse.message);

            $.gritter.add({ title: errorTitle, text: errorText, sticky: true, class_name: 'error' });
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
