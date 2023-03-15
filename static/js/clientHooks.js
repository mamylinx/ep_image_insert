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

const iiT = {
  hide: () => {
    const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
    const inlineToolbar = padOuter.find('#inline_image_toolbar');   
    $(inlineToolbar).hide();
  },
  show: () => {
    const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
    const inlineToolbar = padOuter.find('#inline_image_toolbar');    
    $(inlineToolbar).css('display', 'inline-flex');
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

exports.aceInitialized = (hook, context) => {
  const editorInfo = context.editorInfo;
  editorInfo.ace_addImage = image.addImage.bind(context);
  editorInfo.ace_setImageSize = image.setImageSize.bind(context);
  editorInfo.ace_setImageAlign = image.setImageAlign.bind(context);
  editorInfo.ace_removeImage = image.removeImage.bind(context);
};

function activate(pad, control) {
  var currentCtrl = pad.find('.active');
  currentCtrl[0].className = currentCtrl[0].className.replace(' active', '');
  control.addClass(' active');
}
// Handle click events
exports.postAceInit = function (hook, context) {
  const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
  $('#inline_image_toolbar').detach().appendTo(padOuter[0]);

  context.ace.callWithAce((ace) => {
    const doc = ace.ace_getDocument();
    const $inner = $(doc).find('#innerdocbody');
    var currentImage;

    padOuter.on('mouseup', '#left', function (e) {
      const imageLine = currentImage.parents('div');
      const lineNumber = imageLine.prevAll().length;
      // Activate this element when clicked
      activate(padOuter, $(this));
      // Send align command to the server
      context.ace.callWithAce((ace) => {
        ace.ace_setImageAlign(e.currentTarget.id, lineNumber);
      }, 'img', true);
    });

    padOuter.on('mouseup', '#right', function (e) {
      const imageLine = currentImage.parents('div');
      const lineNumber = imageLine.prevAll().length;
      // Activate this element when clicked
      activate(padOuter, $(this));
      // Send align command to the server
      context.ace.callWithAce((ace) => {
        ace.ace_setImageAlign(e.currentTarget.id, lineNumber);
      }, 'img', true);
    });

    padOuter.on('mouseup', '#center', function (e) {
      const imageLine = currentImage.parents('div');
      const lineNumber = imageLine.prevAll().length;
      // Activate this element when clicked
      activate(padOuter, $(this));
      // Send align command to the server
      context.ace.callWithAce((ace) => {
        ace.ace_setImageAlign("none", lineNumber);
      }, 'img', true);
    });

    padOuter.on('mouseup', function (e) {
      iiT.hide();
    });

    // Display and handle control box when righ-click on an image
    $inner.on('contextmenu', '.image', function (e) {
      // Disable the browser default context menu
      e.preventDefault();

      const toolbar = padOuter.find('#inline_image_toolbar');
      // Get the current image
      currentImage = $(this).find('img');

      const imageWrapper = currentImage.parent('span');
      const imgWidthText = imageWrapper.width() / imageWrapper.parent().width() * 100;
      const widthValueText = padOuter.find('#widthValue');
      const widthValueInput = padOuter.find('#_width');

      // Set width text display in percent into the control box
      widthValueText.text(imgWidthText.toFixed() + ' %');
      // Set the default value of the range input to the actual size of the image
      widthValueInput.val(imgWidthText.toFixed());

      // Mark which alignement control is active for the selected image
      switch (imageWrapper.css('float')) {
        case 'left':
          activate(padOuter, padOuter.find('#left'));
          break;
        
        case 'right':
          activate(padOuter, padOuter.find('#right'));
          break;

        case 'none':
          activate(padOuter, padOuter.find('#center'));
          break;
      
        default:
          break;
      }
      
      // Show the control box at the position of right-click event
      iiT.show();
      toolbar.css({
        position: 'absolute',
        left: e.pageX + padOuter.find('iframe').offset().left,
        top: e.pageY
      });
    });

    // Resize the selected image to the size from input range
    padOuter.on('mouseup change', 'input[type="range"]', function (e) {
      const imageLine = currentImage.parents('div');
      const lineNumber = imageLine.prevAll().length;
      const w = e.currentTarget.value;
      const width_value = padOuter.find('#widthValue');
      width_value.text(w + ' %');

      context.ace.callWithAce((ace) => {
        ace.ace_setImageSize(w, lineNumber);
      }, 'img', true);
    });
  }, 'image', true);
};

exports.aceEditorCSS = () => [
  '/ep_image_insert/static/css/ace.css',
  '/ep_image_insert/static/css/ep_image_insert.css',
];

exports.aceRegisterBlockElements = () => ['img', 'imgWidth'];

exports.aceCreateDomLine = (name, args) => {
};

exports.acePostWriteDomLineHTML = (name, context) => {
};

exports.aceAttribClasses = (hook, attr) => {
};
