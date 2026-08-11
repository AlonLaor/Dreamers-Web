/* ═══════════════════════════════════════════════════════════════════
   no-orphans.js
   Stops any text block from ending in a line that holds a single word.

   Two layers, because neither one alone covers every browser:

   1. CSS `text-wrap: pretty` (added in each page's stylesheet) lets the
      browser re-balance the last few lines. Chrome, Edge and Safari
      honour it; older Firefox ignores it.
   2. This script glues the final two words of every text block together
      with a non-breaking space, so the last line can never carry fewer
      than two words. Works everywhere, including browsers from (1).

   It only ever rewrites the last text node of a block, so inline markup
   (<strong>, <cite>, <br>, links) is left untouched.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  var SELECTOR = [
    "p",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "figcaption",
    ".sub",
    ".ab-body",
    ".bh-sub",
    ".bh-headline",
    ".qf-text",
    ".tc-text",
    ".persona-result",
    ".footer-desc",
    ".footer-motto",
    ".form-note",
  ].join(",");

  var NBSP = " ";

  function lastTextNode(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var node,
      last = null;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.trim()) last = node;
    }
    return last;
  }

  function glue(el) {
    if (el.dataset.noOrphans === "done") return;
    var node = lastTextNode(el);
    if (!node) return;
    // capture "<everything> <finalWord>" and bind the gap
    var m = node.nodeValue.match(/^([\s\S]*\S)[ \t\r\n]+(\S+)[ \t\r\n]*$/);
    if (m) {
      node.nodeValue = m[1] + NBSP + m[2];
      el.dataset.noOrphans = "done";
    }
  }

  function run() {
    var els = document.querySelectorAll(SELECTOR);
    for (var i = 0; i < els.length; i++) glue(els[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
