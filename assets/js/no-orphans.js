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
    "dd",
    ".fact-label",
    ".fac-name",
    ".aud-tag",
    ".core-note",
    ".ph-sub",
  ].join(",");

  /* A hyphenated pair such as "רוסו-נצר" or "רגשי-חברתי" may legally break
     after the hyphen, which drops a fragment of a single word onto its own
     line. Short pairs are held together; long ones are left alone so a
     narrow column can still break them rather than overflow. */
  var HYPHEN_PAIR = /[^\s-]{1,9}-[^\s-]{1,9}/g;

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

  /* Wraps each short hyphenated pair in a nowrap span, so the hyphen stops
     being a break opportunity. Runs after glue(), so the non-breaking space
     it inserted is already in place and still counts as a word boundary. */
  function holdHyphens(el) {
    if (el.dataset.hyphenHold === "done") return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [],
      node;
    while ((node = walker.nextNode())) nodes.push(node);

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var v = n.nodeValue;
      HYPHEN_PAIR.lastIndex = 0;
      if (!HYPHEN_PAIR.test(v)) continue;

      var frag = document.createDocumentFragment();
      var cursor = 0,
        m;
      HYPHEN_PAIR.lastIndex = 0;
      while ((m = HYPHEN_PAIR.exec(v))) {
        if (m.index > cursor) {
          frag.appendChild(document.createTextNode(v.slice(cursor, m.index)));
        }
        var span = document.createElement("span");
        span.style.whiteSpace = "nowrap";
        span.textContent = m[0];
        frag.appendChild(span);
        cursor = m.index + m[0].length;
      }
      if (cursor < v.length) {
        frag.appendChild(document.createTextNode(v.slice(cursor)));
      }
      if (n.parentNode) n.parentNode.replaceChild(frag, n);
    }
    el.dataset.hyphenHold = "done";
  }

  function run() {
    var els = document.querySelectorAll(SELECTOR);
    var i;
    for (i = 0; i < els.length; i++) glue(els[i]);
    for (i = 0; i < els.length; i++) holdHyphens(els[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
