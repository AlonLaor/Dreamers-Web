/* Bait Cholmim — custom accessibility widget. Vanilla JS/CSS, no external dependency. */
(function () {
  "use strict";

  var STORAGE_KEY = "bc_a11y_state";
  var FONT_STEP_MIN = -3;
  var FONT_STEP_MAX = 5;

  var defaultState = {
    fontStep: 0,
    contrast: "none", // 'none' | 'high' | 'invert'
    grayscale: false,
    linksHighlight: false,
    readableFont: false,
    cursorLarge: false,
    stopAnim: false,
  };

  var state = loadState();

  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        var merged = {};
        for (var k in defaultState) {
          merged[k] = k in saved ? saved[k] : defaultState[k];
        }
        return merged;
      }
    } catch (e) {}
    var copy = {};
    for (var k2 in defaultState) copy[k2] = defaultState[k2];
    return copy;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  var cursorSvg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 24 24'>" +
    "<path d='M3 2 L3 21 L8.3 16.6 L11.3 22 L14.6 20.3 L11.5 15 L18 15 Z' fill='#111111' stroke='#ffffff' stroke-width='1.3'/>" +
    "</svg>";
  var cursorUrl = "data:image/svg+xml," + encodeURIComponent(cursorSvg);

  var style = document.createElement("style");
  style.id = "bc-a11y-style";
  style.textContent =
    "" +
    "#bc-a11y-btn{position:fixed;bottom:24px;inset-inline-start:24px;width:56px;height:56px;border-radius:50%;background:#004378;color:#fff;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:99998;box-shadow:0 10px 30px rgba(0,67,120,.45);transition:transform .3s,background .3s;padding:0;}" +
    "#bc-a11y-btn:hover{background:#0c6080;transform:translateY(-3px) scale(1.05);}" +
    "#bc-a11y-btn svg{width:30px;height:30px;fill:#fff;}" +
    "#bc-a11y-panel{position:fixed;bottom:90px;inset-inline-start:24px;width:300px;max-width:calc(100vw - 32px);max-height:75vh;overflow-y:auto;background:#ffffff;border-radius:18px;box-shadow:0 25px 60px rgba(0,0,0,.28);z-index:99999;font-family:Heebo,Arial,sans-serif;direction:rtl;padding:1.1rem;transform:translateY(12px) scale(.97);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;}" +
    "#bc-a11y-panel.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}" +
    "#bc-a11y-panel h2{font-size:1.05rem;color:#004378;font-weight:800;margin:0 0 .9rem;display:flex;justify-content:space-between;align-items:center;}" +
    "#bc-a11y-close{background:none;border:none;font-size:1.2rem;line-height:1;cursor:pointer;color:#4a637c;padding:.2rem .4rem;}" +
    "#bc-a11y-close:hover{color:#004378;}" +
    ".bc-a11y-row{display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.55rem 0;border-bottom:1px solid #eef2f6;}" +
    ".bc-a11y-row:last-of-type{border-bottom:none;}" +
    ".bc-a11y-label{font-size:.86rem;color:#1a2d3e;font-weight:600;}" +
    ".bc-a11y-toggle{flex-shrink:0;border:1.5px solid #004378;background:#fff;color:#004378;font-size:.78rem;font-weight:700;border-radius:20px;padding:.32rem 1rem;cursor:pointer;transition:all .2s;}" +
    ".bc-a11y-toggle[aria-pressed='true']{background:#004378;color:#fff;}" +
    ".bc-a11y-fontctl{display:flex;gap:.4rem;}" +
    ".bc-a11y-fontbtn{width:32px;height:32px;border-radius:50%;border:1.5px solid #004378;background:#fff;color:#004378;font-weight:800;cursor:pointer;font-size:1rem;line-height:1;}" +
    ".bc-a11y-fontbtn:hover{background:#e8f1fa;}" +
    "#bc-a11y-reset{width:100%;margin-top:.9rem;background:#f5a623;border:none;color:#4a2800;font-weight:800;font-size:.86rem;border-radius:12px;padding:.65rem;cursor:pointer;transition:transform .2s;}" +
    "#bc-a11y-reset:hover{transform:translateY(-2px);}" +
    "body.bc-a11y-links a{outline:2px solid #f5a623 !important;background:rgba(255,210,80,.28) !important;text-decoration:underline !important;}" +
    "body.bc-a11y-readable, body.bc-a11y-readable p, body.bc-a11y-readable span, body.bc-a11y-readable li, body.bc-a11y-readable div{font-family:Arial,Helvetica,sans-serif !important;line-height:1.9 !important;letter-spacing:.01em !important;}" +
    "body.bc-a11y-stopanim, body.bc-a11y-stopanim *{animation-play-state:paused !important;animation-duration:0s !important;transition:none !important;}" +
    "body.bc-a11y-cursor, body.bc-a11y-cursor *{cursor:url('" +
    cursorUrl +
    "') 4 4, auto !important;}";
  document.head.appendChild(style);

  var btn = document.createElement("button");
  btn.id = "bc-a11y-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "פתח תפריט נגישות");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML =
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><path d="M12 7c-1.1 0-2 .9-2 2v3.5L6.5 14l1 2 3.5-1.4V22h2v-6l2 1v-2l-2-1v-2.6l3.4 1.4 1-2L14 9V9c0-1.1-.9-2-2-2z"/></svg>';

  var panel = document.createElement("div");
  panel.id = "bc-a11y-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "אפשרויות נגישות");
  panel.innerHTML =
    '<h2>נגישות <button id="bc-a11y-close" type="button" aria-label="סגור תפריט נגישות">✕</button></h2>' +
    '<div class="bc-a11y-row"><span class="bc-a11y-label">גודל טקסט</span>' +
    '<div class="bc-a11y-fontctl">' +
    '<button type="button" class="bc-a11y-fontbtn" data-act="font-dec" aria-label="הקטן טקסט">−</button>' +
    '<button type="button" class="bc-a11y-fontbtn" data-act="font-inc" aria-label="הגדל טקסט">+</button>' +
    "</div></div>" +
    '<div class="bc-a11y-row"><span class="bc-a11y-label">ניגודיות גבוהה</span><button type="button" class="bc-a11y-toggle" data-act="contrast-high" aria-pressed="false">הפעל</button></div>' +
    '<div class="bc-a11y-row"><span class="bc-a11y-label">ניגודיות הפוכה</span><button type="button" class="bc-a11y-toggle" data-act="contrast-invert" aria-pressed="false">הפעל</button></div>' +
    '<div class="bc-a11y-row"><span class="bc-a11y-label">גווני אפור</span><button type="button" class="bc-a11y-toggle" data-act="grayscale" aria-pressed="false">הפעל</button></div>' +
    '<div class="bc-a11y-row"><span class="bc-a11y-label">הדגשת קישורים</span><button type="button" class="bc-a11y-toggle" data-act="links" aria-pressed="false">הפעל</button></div>' +
    '<div class="bc-a11y-row"><span class="bc-a11y-label">פונט קריא / מרווח שורות</span><button type="button" class="bc-a11y-toggle" data-act="readable" aria-pressed="false">הפעל</button></div>' +
    '<div class="bc-a11y-row"><span class="bc-a11y-label">סמן גדול</span><button type="button" class="bc-a11y-toggle" data-act="cursor" aria-pressed="false">הפעל</button></div>' +
    '<div class="bc-a11y-row"><span class="bc-a11y-label">עצירת אנימציות</span><button type="button" class="bc-a11y-toggle" data-act="stopanim" aria-pressed="false">הפעל</button></div>' +
    '<button id="bc-a11y-reset" type="button">איפוס הגדרות נגישות</button>';

  function mount() {
    document.body.appendChild(btn);
    document.body.appendChild(panel);
    btn.addEventListener("click", togglePanel);
    panel
      .querySelector("#bc-a11y-close")
      .addEventListener("click", function () {
        setPanelOpen(false);
      });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setPanelOpen(false);
    });
    document.addEventListener("click", function (e) {
      if (
        panel.classList.contains("open") &&
        !panel.contains(e.target) &&
        e.target !== btn &&
        !btn.contains(e.target)
      ) {
        setPanelOpen(false);
      }
    });
    panel.addEventListener("click", function (e) {
      var act = e.target.getAttribute("data-act");
      if (!act) return;
      handleAction(act);
    });
    apply();
  }

  function setPanelOpen(open) {
    panel.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function togglePanel() {
    setPanelOpen(!panel.classList.contains("open"));
  }

  function handleAction(act) {
    switch (act) {
      case "font-inc":
        state.fontStep = Math.min(FONT_STEP_MAX, state.fontStep + 1);
        break;
      case "font-dec":
        state.fontStep = Math.max(FONT_STEP_MIN, state.fontStep - 1);
        break;
      case "contrast-high":
        state.contrast = state.contrast === "high" ? "none" : "high";
        break;
      case "contrast-invert":
        state.contrast = state.contrast === "invert" ? "none" : "invert";
        break;
      case "grayscale":
        state.grayscale = !state.grayscale;
        break;
      case "links":
        state.linksHighlight = !state.linksHighlight;
        break;
      case "readable":
        state.readableFont = !state.readableFont;
        break;
      case "cursor":
        state.cursorLarge = !state.cursorLarge;
        break;
      case "stopanim":
        state.stopAnim = !state.stopAnim;
        break;
    }
    apply();
    saveState();
  }

  function apply() {
    document.documentElement.style.fontSize = 100 + state.fontStep * 10 + "%";

    var filters = [];
    if (state.grayscale) filters.push("grayscale(1)");
    if (state.contrast === "high") filters.push("contrast(1.6) saturate(1.15)");
    if (state.contrast === "invert")
      filters.push("invert(1) hue-rotate(180deg)");
    document.documentElement.style.filter = filters.join(" ");

    document.body.classList.toggle("bc-a11y-links", state.linksHighlight);
    document.body.classList.toggle("bc-a11y-readable", state.readableFont);
    document.body.classList.toggle("bc-a11y-cursor", state.cursorLarge);
    document.body.classList.toggle("bc-a11y-stopanim", state.stopAnim);

    setPressed("contrast-high", state.contrast === "high");
    setPressed("contrast-invert", state.contrast === "invert");
    setPressed("grayscale", state.grayscale);
    setPressed("links", state.linksHighlight);
    setPressed("readable", state.readableFont);
    setPressed("cursor", state.cursorLarge);
    setPressed("stopanim", state.stopAnim);
  }

  function setPressed(act, on) {
    var el = panel.querySelector('[data-act="' + act + '"]');
    if (!el) return;
    el.setAttribute("aria-pressed", on ? "true" : "false");
    el.textContent = on ? "כבה" : "הפעל";
  }

  panel.addEventListener("click", function (e) {
    if (e.target.id === "bc-a11y-reset") {
      var copy = {};
      for (var k in defaultState) copy[k] = defaultState[k];
      state = copy;
      apply();
      saveState();
    }
  });

  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount);
  }
})();
