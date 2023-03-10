'use strict';

const Changeset = require('ep_etherpad-lite/static/js/Changeset');

const _analyzeLine = (alineAttrs, apool) => {
  let image = null;
  if (alineAttrs) {
    const opIter = Changeset.opIterator(alineAttrs);
    if (opIter.hasNext()) {
      const op = opIter.next();
      image = Changeset.opAttributeValue(op, 'img', apool);
      if (image.indexOf('<img') === 0) {
        const urlMatch = (/src\s*=\s*"([^\s]+\/\/[^/]+.\/[^\s]+\.\w*)/gi).exec(image);
        image = urlMatch[1];
      }
    }
  }

  return image;
};

exports.getLineHTMLForExport = async (hook, context) => {
  const image = _analyzeLine(context.attribLine, context.apool);
  if (image) {
    context.lineContent = `<img src="${image}">`;
  }
};

exports.stylesForExport = (hook, padId, cb) => {
  cb('img{max-width:100%}');
};
