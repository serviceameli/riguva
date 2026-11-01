/* Draw navigation arrows as vectors so mobile emoji fonts cannot replace them. */
(() => {
  'use strict';
  if (window.RiArrowIcons) return;
  const paths = {
    '↗':'M5 19 19 5M5 5h14v14',
    '↘':'M5 5 19 19M5 19h14V5',
    '↙':'M19 5 5 19M5 5v14h14',
    '↖':'M19 19 5 5M5 19V5h14',
    '↑':'M12 20V4M5 11l7-7 7 7',
    '↓':'M12 4v16M5 13l7 7 7-7',
    '←':'M20 12H4m7-7-7 7 7 7',
    '→':'M4 12h16m-7-7 7 7-7 7',
    '↔':'M4 12h16M9 7l-5 5 5 5m6-10 5 5-5 5',
    '↕':'M12 4v16M7 9l5-5 5 5M7 15l5 5 5-5',
    '⤢':'M14 4h6v6m0-6-6 6M10 20H4v-6m0 6 6-6'
  };
  const arrows = /([↗↘↙↖↑↓←→↔↕⤢])[\uFE0E\uFE0F]?/gu;
  const skip = 'script,style,textarea,input,select,option,code,pre,svg,math,[contenteditable],[data-ri-arrows-skip]';
  const ns = 'http://www.w3.org/2000/svg';
  function create(character) {
    const svg = document.createElementNS(ns,'svg');
    svg.setAttribute('class','ri-arrow-icon-v109');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('width','1em');svg.setAttribute('height','1em');
    svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
    svg.setAttribute('stroke-width','1.5');
    svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
    const path = document.createElementNS(ns,'path');
    path.setAttribute('d',paths[character]);svg.append(path);
    return svg;
  }
  function repairText(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(skip)) return;
    const text = node.data;
    arrows.lastIndex = 0;
    if (!arrows.test(text)) return;
    arrows.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const match of text.matchAll(arrows)) {
      if (match.index > cursor) fragment.append(document.createTextNode(text.slice(cursor,match.index)));
      fragment.append(create(match[1]));cursor = match.index + match[0].length;
    }
    if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
  }
  function repair(root) {
    if (root.nodeType === Node.TEXT_NODE) {repairText(root);return;}
    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(skip)) return;
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(repairText);
  }
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') repairText(record.target);
      else record.addedNodes.forEach(repair);
    }
  });
  repair(document.body);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  window.RiArrowIcons = Object.freeze({refresh:repair});
})();
