'use strict';

const image = {
  setImageSize(width, lineNumber) {
    const documentAttributeManager = this.documentAttributeManager;
    documentAttributeManager.setAttributeOnLine(lineNumber, 'imgWidth', width);
  },

  setImageAlign(position, lineNumber) {
    const documentAttributeManager = this.documentAttributeManager;
    documentAttributeManager.setAttributeOnLine(lineNumber, 'imgAlign', position);
  },

  removeImage(lineNumber) {
    const documentAttributeManager = this.documentAttributeManager;
    documentAttributeManager.removeAttributeOnLine(lineNumber, 'img');
    documentAttributeManager.removeAttributeOnLine(lineNumber, 'imgWidth');
    documentAttributeManager.removeAttributeOnLine(lineNumber, 'imgAlign');
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
  if (context.key === 'imgWidth') {
    return [`imgWidth:${context.value}`];
  }
  if (context.key === 'imgAlign') {
    return [`imgAlign:${context.value}`];
  }
};

// Rewrite the DOM contents when an IMG attribute is discovered
exports.aceDomLineProcessLineAttributes = (name, context) => {
  const imgType = (/(?:^| )img:([^> ]*)/).exec(context.cls);
  const expWidth = /(?:^| )imgWidth:((\S+))/;
  const imgWidth = expWidth.exec(context.cls);
  const expAlign = /(?:^| )imgAlign:((\S+))/;
  const imgAlign = expAlign.exec(context.cls);

  if (!imgType) return [];
  
  let width = '50';
  let height = '50';
  let imgPos = 'none';

  if (imgWidth) {
    width = imgWidth[1];
  }

  if (imgAlign) {
    imgPos = imgAlign[1];
  }

  const randomId = Math.floor((Math.random() * 100000) + 1);
  let template = `<span id="${randomId}" class="image" style="width:${width}%;float:${imgPos}">`;
  let pos = width > 45 ? 0 : -220;
  template += `<span class="control-container" style="right:${pos}px">`;
  template += `<span id="wValue" unselectable="on" contenteditable=false>${width}%</span>`;
  template += `<input type="range" unselectable="on" class="control ${randomId}" value=${width} id="_width" name="width" min=10 max=100 step=2>`;
  template += `<button class="control ${randomId} buttonicon buttonicon-align-left" id="left" title="Left" aria-label="Left"></button>`;
  template += `<button class="control ${randomId} buttonicon buttonicon-align-right" id="right" title="Right" aria-label="Right"></button>`;
  template += `<button class="control ${randomId} buttonicon buttonicon-align-center" id="center" title="Center" aria-label="Center"></button>`;
  template += `</span>`;
  if (imgType[1]) {
    const preHtml = `${template} <img src="${imgType[1]}" style="height:${height}%;width:100%;">`;
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

    $inner.on('mouseup', '#left', function (e) {
      const imageLine = $(this).parents('div');
      const lineNumber = imageLine.prevAll().length;
      context.ace.callWithAce((ace) => {
        ace.ace_setImageAlign(e.currentTarget.id, lineNumber);
      }, 'img', true);
    });

    $inner.on('mouseup', '#right', function (e) {
      const imageLine = $(this).parents('div');
      const lineNumber = imageLine.prevAll().length;
      context.ace.callWithAce((ace) => {
        ace.ace_setImageAlign(e.currentTarget.id, lineNumber);
      }, 'img', true);
    });

    $inner.on('mouseup', '#center', function (e) {
      const imageLine = $(this).parents('div');
      const lineNumber = imageLine.prevAll().length;
      context.ace.callWithAce((ace) => {
        ace.ace_setImageAlign("none", lineNumber);
      }, 'img', true);
    });

    $inner.on('mouseup change', '#_width', function (e) {
      const imageLine = $(this).parents('div');
      const lineNumber = imageLine.prevAll().length;
      context.ace.callWithAce((ace) => {
        ace.ace_setImageSize($(this).val(), lineNumber);
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
  editorInfo.ace_setImageAlign = image.setImageAlign.bind(context);
  editorInfo.ace_removeImage = image.removeImage.bind(context);
};

exports.aceRegisterBlockElements = () => ['img'];

exports.aceCreateDomLine = (name, args) => {
};

exports.acePostWriteDomLineHTML = (name, context) => {
};

exports.aceAttribClasses = (hook, attr) => {
};
