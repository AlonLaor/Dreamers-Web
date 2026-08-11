# -*- coding: utf-8 -*-
"""
Builds a single self-contained HTML file holding the whole site, so it can be
handed to a reviewer as one attachment. Every image, video and script is
embedded, so the file needs no server, no unzip and no internet.

Each page is stored verbatim in a <script type="text/html"> block and rendered
into an iframe via srcdoc, which keeps the four stylesheets from colliding.
Cross-page links are intercepted and routed through the location hash, so the
browser Back button behaves normally.
"""
import base64, io, mimetypes, os, re, subprocess, sys

# resolve against the repo root so the script runs from anywhere
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".preview-cache")
PAGES = ["index", "business", "education", "about"]
OUT_NAME = "Dreamers-Site-Preview.html"

os.chdir(ROOT)
os.makedirs(CACHE, exist_ok=True)

from PIL import Image

MAX_EDGE = 1500          # px, long edge for photographic assets
JPEG_Q = 80
BIG = 350 * 1024         # bytes: anything above this gets re-encoded
KEEP_PNG = {             # logos / marks where transparency matters
    "assets/img/logo-beit-holmim-white.png",
    "assets/img/logo-beit-holmim.png",
    "assets/img/GALLUP logo.png",
    "assets/img/The Slogan.png",
    "assets/img/Bird.png",
    "assets/img/16 המעלות - 110826.png",
    "assets/img/Gradient blue.png",
}

log = []


def has_real_alpha(im):
    """True when the file actually relies on transparency."""
    if im.mode not in ("RGBA", "LA", "P"):
        return False
    a = im.convert("RGBA").getchannel("A")
    return a.getextrema()[0] < 255


def optimise_image(path):
    """Return (bytes, mime) for an image, shrinking the heavy ones."""
    raw = open(path, "rb").read()
    if len(raw) <= BIG or path in KEEP_PNG:
        return raw, mimetypes.guess_type(path)[0] or "image/png"

    src = Image.open(path)
    # An image that leans on transparency has to keep it: the page composites
    # it over a coloured backdrop, and flattening onto white here would show
    # the reviewer a different picture from the live site. WebP carries alpha
    # at a fraction of PNG's weight.
    keep_alpha = has_real_alpha(src)
    ext, fmt, mime = (".webp", "WEBP", "image/webp") if keep_alpha else (".jpg", "JPEG", "image/jpeg")

    key = re.sub(r"[^A-Za-z0-9]+", "_", path) + ext
    cached = os.path.join(CACHE, key)
    if not os.path.exists(cached):
        im = src.convert("RGBA") if keep_alpha else None
        if im is None:
            im = src.convert("RGBA") if src.mode in ("RGBA", "LA", "P") else src
            if im.mode in ("RGBA", "LA"):
                bg = Image.new("RGB", im.size, (255, 255, 255))
                bg.paste(im, mask=im.split()[-1])
                im = bg
            else:
                im = im.convert("RGB")
        w, h = im.size
        if max(w, h) > MAX_EDGE:
            scale = MAX_EDGE / float(max(w, h))
            im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        if fmt == "WEBP":
            im.save(cached, "WEBP", quality=JPEG_Q, method=5)
        else:
            im.save(cached, "JPEG", quality=JPEG_Q, optimize=True, progressive=True)
    out = open(cached, "rb").read()
    log.append("  image %-52s %7.2f MB -> %6.2f MB  %s"
               % (path[-52:], len(raw) / 1e6, len(out) / 1e6, "webp+alpha" if keep_alpha else "jpeg"))
    return out, mime


def optimise_video(path):
    key = re.sub(r"[^A-Za-z0-9]+", "_", path) + ".mp4"
    cached = os.path.join(CACHE, key)
    if not os.path.exists(cached):
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", path, "-an",
             "-vf", "scale=1280:-2", "-c:v", "libx264", "-preset", "slow",
             "-crf", "30", "-pix_fmt", "yuv420p", "-movflags", "+faststart", cached],
            check=True,
        )
    raw = open(path, "rb").read()
    out = open(cached, "rb").read()
    log.append("  video %-58s %7.2f MB -> %6.2f MB" % (path[-58:], len(raw) / 1e6, len(out) / 1e6))
    return out, "video/mp4"


_cache = {}


def data_uri(ref):
    path = ref.split("?")[0]
    if path in _cache:
        return _cache[path]
    if not os.path.exists(path):
        return None
    ext = os.path.splitext(path)[1].lower()
    if ext in (".mp4",):
        blob, mime = optimise_video(path)
    elif ext in (".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp"):
        blob, mime = optimise_image(path)
    else:
        blob = open(path, "rb").read()
        mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    uri = "data:%s;base64,%s" % (mime, base64.b64encode(blob).decode("ascii"))
    _cache[path] = uri
    return uri


NAV_HOOK = """
<script>
/* preview bundle: route cross-page links through the parent shell */
(function(){
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if(!a) return;
    var href = a.getAttribute('href') || '';
    var m = href.match(/^([A-Za-z0-9_-]+)\\.html(#.*)?$/);
    if(m && parent && parent.__nav){ e.preventDefault(); parent.__nav(m[1], m[2] || ''); }
  }, true);
})();
</script>
"""


def build_page(name):
    s = io.open(name + ".html", encoding="utf-8").read()

    # drop the webm source; the mp4 covers every current browser and halves the file
    s = re.sub(r'\s*<source src="[^"]+\.webm" type="video/webm" />\n?', "", s)

    # inline the two local scripts as real script blocks
    for js in ["assets/js/no-orphans.js", "assets/js/accessibility-widget.js"]:
        tag = '<script src="%s" defer></script>' % js
        if tag in s and os.path.exists(js):
            code = io.open(js, encoding="utf-8").read().replace("</script", "<\\/script")
            s = s.replace(tag, "<script>\n" + code + "\n</script>")

    # every remaining local reference becomes a data: URI
    def repl_src(m):
        uri = data_uri(m.group(1))
        return 'src="%s"' % uri if uri else m.group(0)

    def repl_url(m):
        uri = data_uri(m.group(1))
        return 'url("%s")' % uri if uri else m.group(0)

    s = re.sub(r'src="(?!https?:|data:|#)([^"]+)"', repl_src, s)
    s = re.sub(r'url\("(?!https?:|data:|#)([^"]+)"\)', repl_url, s)
    s = re.sub(r"url\('(?!https?:|data:|#)([^']+)'\)", lambda m: repl_url(m), s)

    s = s.replace("</body>", NAV_HOOK + "</body>")
    return s


SHELL = u"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>\u05d1\u05d9\u05ea \u05d7\u05d5\u05dc\u05de\u05d9\u05dd \u2014 \u05ea\u05e6\u05d5\u05d2\u05ea \u05d0\u05ea\u05e8</title>
<style>
  html, body { margin:0; padding:0; height:100%%; background:#002952; }
  #view { display:block; width:100%%; height:100%%; border:0; }
  #boot { position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
          font:600 1rem/1.6 system-ui, sans-serif; color:#fff; background:#002952; }
</style>
</head>
<body>
<div id="boot">Loading&nbsp;\u2026</div>
<iframe id="view" title="Dreamers Home preview"></iframe>
%(blocks)s
<script>
(function(){
  var frame = document.getElementById('view');
  var boot  = document.getElementById('boot');
  var PAGES = %(pages)s;

  function render(name, hash){
    if (PAGES.indexOf(name) < 0) name = PAGES[0];
    // the stored markup has its closing script tags escaped so the holder
    // block survives HTML parsing; put them back before handing it to srcdoc
    var html = document.getElementById('p-' + name).textContent
                 .split('<\\\\/script').join('<\\/script');
    if (hash) {
      html = html.replace('</head>',
        '<script>window.addEventListener("load",function(){var t=document.querySelector(' +
        JSON.stringify(hash) + ');if(t)t.scrollIntoView();});<\\/script></head>');
    }
    frame.srcdoc = html;
    if (boot) { boot.style.display = 'none'; }
  }

  window.__nav = function(name, hash){
    location.hash = '#' + name + (hash || '');
  };

  function fromHash(){
    var h = (location.hash || '').replace(/^#/, '');
    var i = h.indexOf('#');
    var name = i < 0 ? h : h.slice(0, i);
    var rest = i < 0 ? '' : h.slice(i);
    render(name || PAGES[0], rest);
  }

  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
</script>
</body>
</html>
"""

blocks = []
for name in PAGES:
    html = build_page(name)
    html = html.replace("</script", "<\\/script")
    blocks.append('<script type="text/html" id="p-%s">%s</script>' % (name, html))
    log.append("page %-14s %7.2f MB (embedded)" % (name, len(html) / 1e6))

out = SHELL % {
    "blocks": "\n".join(blocks),
    "pages": str(PAGES).replace("'", '"'),
}

dest = os.path.join(ROOT, OUT_NAME)
io.open(dest, "w", encoding="utf-8", newline="").write(out)

log.append("")
log.append("WROTE %s  (%.2f MB)" % (dest, os.path.getsize(dest) / 1e6))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
print("\n".join(log))
