'use strict';

const image = {
  setImageSize(size, lineNumber) {
    const documentAttributeManager = this.documentAttributeManager;
    documentAttributeManager.setAttributeOnLine(lineNumber, 'imgSize', size);
  },

  removeImage(lineNumber) {
    const documentAttributeManager = this.documentAttributeManager;
    documentAttributeManager.removeAttributeOnLine(lineNumber, 'img');
    documentAttributeManager.removeAttributeOnLine(lineNumber, 'imgSize');
  },

  addImage(lineNumber, src) {
    const documentAttributeManager = this.documentAttributeManager;
    documentAttributeManager.setAttributeOnLine(lineNumber, 'img', src);
  }
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
  if (context.key === 'imgSize') {
    return [`imgSize:${context.value}`];
  }
};

// Rewrite the DOM contents when an IMG attribute is discovered
exports.aceDomLineProcessLineAttributes = (name, context) => {
  const imgType = (/(?:^| )img:([^> ]*)/).exec(context.cls);
  const expSize = /(?:^| )imgSize:((\S+))/;
  const imgSize = expSize.exec(context.cls);

  if (!imgType) return [];
  
  let width = 'width:50%';
  let height = 'height:50%;';

  if (imgSize) {
    if (imgSize[1] === 'small') {
      width = 'width:25%';
      height = 'height:25%;';
    }
    if (imgSize[1] === 'medium') {
      width = 'width:50%';
      height = 'height:50%;';
    }
    if (imgSize[1] === 'large') {
      width = 'width:100%';
      height = 'height:100%;';
    }
  }

  const randomId = Math.floor((Math.random() * 100000) + 1);
  let template = `<span id="${randomId}" class="image" style="${width}">`;
  template += `<span class="control-container">`;
  template += `<span class="control ${randomId}" id="small" unselectable="on" contentEditable=false></span>`;
  template += `<span class="control ${randomId}" id="medium" unselectable="on" contentEditable=false></span>`;
  template += `<span class="control ${randomId}" id="large" unselectable="on" contentEditable=false></span>`;
  template += `</span>`;
  if (imgType[1]) {
    const preHtml = `${template} <img src="${imgType[1]}" style="${height}width:100%;">`;
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

// Handle click events
exports.postAceInit = function (hook, context) {
  context.ace.callWithAce((ace) => {
    const doc = ace.ace_getDocument();
    const $inner = $(doc).find('#innerdocbody');

    $inner.on('drop', (e) => {
      e = e.originalEvent;
      const file = e.dataTransfer.files[0];
      if (!file) return;
      // don't try to mess with non-image files
      if (file.type.match('image.*')) {
        const reader = new FileReader();
        reader.onload = ((theFile) => {
          // get the data uri
          const dataURI = theFile.target.result;
          // make a new image element with the dataURI as the source
          const img = document.createElement('img');
          img.src = dataURI;
          context.ace.callWithAce((ace) => {
            const rep = ace.ace_getRep();
            ace.ace_addImage(rep, img.src);
          }, 'img', true);
        });
        reader.readAsDataURL(file);
      }
    }); 

    // Don't allow resize handles to be shown
    doc.execCommand('enableObjectResizing', false, false);
    $inner.on('oncontrolselect', '.control', () => {
    });

    // On drag end remove the attribute on the line
    // Note we check the line number has actually changed, if not a drag start/end
    // to the same location would cause the image to be deleted!
    $inner.on('dragend', '.image', (e) => {
      const id = e.currentTarget.id;
      const imageContainer = $inner.find(`#${id}`);
      const imageLine = $inner.find(`.${id}`).parents('div');
      const oldLineNumber = imageLine.prevAll().length;
      context.ace.callWithAce((ace) => {
        const rep = ace.ace_getRep();
        const newLineNumber = rep.selStart[0];
        if (oldLineNumber !== newLineNumber) {
          $(imageContainer).remove();
          ace.ace_removeImage(oldLineNumber);
        }
      }, 'img', true);
    });

    $inner.on('click', '.control', function (e) {
      const newSize = e.currentTarget.id;
      const imageLine = $(this).parents('div');
      const lineNumber = imageLine.prevAll().length;
      context.ace.callWithAce((ace) => {
        ace.ace_setImageSize(newSize, lineNumber);
      }, 'img', true);
    });
  }, 'image', true);
};

exports.aceEditorCSS = () => [
  '/ep_image_insert/static/css/ace.css',
  '/ep_image_insert/static/css/ep_image_insert.css',
];

exports.aceInitialized = (hook, context) => {
  const editorInfo = context.editorInfo;
  editorInfo.ace_addImage = image.addImage.bind(context);
  editorInfo.ace_setImageSize = image.setImageSize.bind(context);
  editorInfo.ace_removeImage = image.removeImage.bind(context);
};

exports.aceRegisterBlockElements = () => ['img'];

exports.aceCreateDomLine = (name, args) => {
};

exports.acePostWriteDomLineHTML = (name, context) => {
};

exports.aceAttribClasses = (hook, attr) => {
};
