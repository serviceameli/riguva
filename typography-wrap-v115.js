/* Russian short-word binding. Keep the author's words and inline markup intact. */
(() => {
  'use strict';
  const forward = new Set(('а в во и к ко о об обо с со у без для до за из изо из-за из-под на над не ни но от ото по под при про или что как ибо чтобы я').split(' '));
  const backward = new Set(['бы', 'б', 'же', 'ж', 'ли', 'ль']);
  const word = /[A-Za-zА-Яа-яЁё0-9]+(?:[-’'][A-Za-zА-Яа-яЁё0-9]+)*/gu;
  const space = /^[\t\n\r \u00a0]+$/u;
  // Opening quotes may sit between a preposition and its noun. Punctuation at
  // the end of a phrase is always a boundary, including the font's inline spans.
  const forwardGap = /^[\t\n\r \u00a0]+[«„“"(]*$/u;
  function gaps(text) {
    const tokens = [...text.matchAll(word)];
    const edits = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      const left = tokens[i], right = tokens[i + 1];
      const start = left.index + left[0].length;
      const gap = text.slice(start, right.index);
      if ((forward.has(left[0].toLowerCase()) && forwardGap.test(gap)) ||
          (backward.has(right[0].toLowerCase()) && space.test(gap))) {
        const whitespace = /^[\t\n\r \u00a0]+/u.exec(gap)[0];
        if (whitespace !== '\u00a0') edits.push({start, end: start + whitespace.length});
      }
    }
    return edits;
  }
  function bindText(text) {
    const edits = gaps(text);
    for (let i = edits.length - 1; i >= 0; i--) {
      const {start, end} = edits[i];
      text = text.slice(0, start) + '\u00a0' + text.slice(end);
    }
    return text;
  }
  if (typeof document === 'undefined') {
    if (typeof module !== 'undefined') module.exports = {bindText};
    return;
  }
  const skip = 'script,style,textarea,input,select,code,pre,svg,canvas,math,[contenteditable]:not([contenteditable="false"]),[data-ri-no-typography]';
  const blocks = new Set('ADDRESS ARTICLE ASIDE BLOCKQUOTE DD DETAILS DIALOG DIV DL DT FIELDSET FIGCAPTION FIGURE FOOTER FORM H1 H2 H3 H4 H5 H6 HEADER HR LI MAIN NAV OL P SECTION TABLE TBODY TD TH THEAD TR UL'.split(' '));
  const prose = 'p,li,dd,dt,figcaption,blockquote';
  function isBoundary(el) {
    return blocks.has(el.tagName) || el.tagName === 'BUTTON' ||
      el.tagName === 'SUMMARY' || (el.tagName === 'A' && !el.closest(prose));
  }
  function repairRun(nodes) {
    if (!nodes.length) return;
    let text = '';
    const offsets = nodes.map(node => {
      const start = text.length;
      text += node.data;
      return {node, start, end: text.length};
    });
    const edits = gaps(text);
    for (let i = edits.length - 1; i >= 0; i--) {
      const edit = edits[i];
      // Edit the existing text nodes. Never flatten links, emphasis or glyph
      // fallback spans, and never rewrite an attribute or a form value.
      for (const item of offsets) {
        if (item.end <= edit.start || item.start >= edit.end) continue;
        const from = Math.max(edit.start, item.start) - item.start;
        const to = Math.min(edit.end, item.end) - item.start;
        const replacement = item.start <= edit.start ? '\u00a0' : '';
        item.node.replaceData(from, to - from, replacement);
      }
    }
  }
  function refresh(root = document.body) {
    if (!root || (root.nodeType === 1 && root.closest(skip))) return;
    let run = [];
    const flush = () => {repairRun(run); run = [];};
    function visit(node) {
      if (node.nodeType === 3) {run.push(node); return;}
      if (node.nodeType !== 1) return;
      if (node.matches(skip) || node.tagName === 'BR' || node.tagName === 'WBR') {flush(); return;}
      const boundary = isBoundary(node);
      if (boundary) flush();
      for (const child of node.childNodes) visit(child);
      if (boundary) flush();
    }
    visit(root); flush();
  }
  const pending = new Set();
  let scheduled = false;
  const observer = new MutationObserver(records => {
    for (const record of records) {
      let el = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (!el || el.closest(skip)) continue;
      while (el.parentElement && !isBoundary(el)) el = el.parentElement;
      pending.add(el);
    }
    if (scheduled || !pending.size) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      const roots = [...pending]; pending.clear();
      for (const root of roots) if (root.isConnected && !roots.some(other => other !== root && other.contains(root))) refresh(root);
    });
  });
  window.RiTypography = Object.freeze({refresh, bindText});
  refresh();
  observer.observe(document.body, {subtree: true, childList: true, characterData: true});
})();
