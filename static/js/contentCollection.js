'use strict';

// When an image is detected give it a lineAttribute
// of Image with the URL to the iamge
exports.collectContentImage = (hookName, {node, state: {lineAttributes}, tname}) => {
  if (tname === 'div' || tname === 'p') {
    delete lineAttributes.img;
    delete lineAttributes.imgWidth;
    delete lineAttributes.imgAlign;
  }
  if (tname === 'img') {
    lineAttributes.img = node.outerHTML;
  }
  lineAttributes.imgAlign = 'none';
  
  if (node.parentNode && node.parentNode.style.width) {
    if (node.parentNode.style.width === '50%') {
      lineAttributes.imgWidth = '50';
    }
  }
  lineAttributes.img =
      // Client-side. This will also be used for server-side HTML imports once jsdom adds support
      // for HTMLImageElement.currentSrc.
      node.currentSrc ||
      // Server-side HTML imports using jsdom v16.6.0 (Etherpad v1.8.15).
      node.src ||
      // Server-side HTML imports using cheerio (Etherpad <= v1.8.14).
      (node.attribs && node.attribs.src);
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
  if (tname === 'imgWidth') {
    delete lineAttributes.imgWidth;
  }
  if (tname === 'imgAlign') {
    delete lineAttributes.imgAlign;
  }
};

exports.ccRegisterBlockElements = (name, context) => ['img'];
