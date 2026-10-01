# Dreamers design baseline

This is a reference of the existing website, not a redesign or a corrected version.
The seven production HTML pages, shared scripts, and existing assets were not edited.

## Start here

Open `2026-09-22/gallery.html` in a browser for desktop and mobile reference images.
Read `DESIGN-CONVENTIONS.md` before changing the site's presentation.
The dated directory is a frozen baseline. Store future captures in a new dated directory.

## How to test

1. Open the gallery and choose the page and size you are changing.
2. Serve the repository root locally. With Python installed: `python -m http.server 8765 --bind 127.0.0.1`.
3. Open `http://127.0.0.1:8765/index.html` (or the relevant page) in Chrome or Edge.
4. In browser developer tools, enable the device toolbar. Choose Responsive, then set the exact CSS viewport to **1440 x 1000** or **390 x 844**. Keep browser zoom at 100%. Mobile captures use a narrow desktop browser viewport, not hardware/touch emulation.
5. Use default accessibility options. Wait for fonts and images. Slowly scroll through the entire page so reveal effects and lazy images load, return to the top, and let transitions finish.
6. Compare the screenshot with the current page: section order, Hebrew line breaks, logo and slogan size, colors, image crop, heading size, card geometry, gutters, button size, and footer alignment.
7. On mobile, open the menu and activities submenu. Check the reference menu image. On program/business/education, check a virtue tile by click and keyboard. Check carousels and empty form layout without submitting anything.
8. Test around 768px and 861px as well, especially the menu and program artwork. The saved screenshot matrix covers two sizes, not every breakpoint.

For a source integrity check run `python tools/check-design-baseline.py` from the repository root. PASS means the recorded source and referenced assets still have identical bytes. After an intentional edit, CHANGED is expected and requires visual review; it is not proof of a regression. New files are not checked.

On this Windows machine Python is also available at:
`C:/Users/laora/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`

PowerShell example:
```powershell
& 'C:/Users/laora/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' tools/check-design-baseline.py
```

## What the baseline proves

- Screenshots record the actual browser rendering at capture time.
- `capture-metadata.json` records viewport, page dimensions, font status, image status, and computed typography.
- `source-manifest.json` records SHA-256 hashes of production HTML, shared JS, and literal local asset references, including referenced untracked files.
- It is not a complete backup. Keep source and assets under version control too.
- No automatic pixel-diff pass/fail is claimed. Video, particles, hover effects, counters, and font rasterization can vary. Compare stable geometry and typography rather than animated pixels.
- Google Fonts requires a network connection. A fallback-font rendering is not a faithful typography comparison.
- Existing broken anchors, accessibility quirks, and deployment omissions remain unchanged. The default widget currently overrides the intended 17px desktop root font size. A later correction needs explicit visual review.
- Existing deleted preview files and untracked files were left untouched.

## Future update rule

Keep this baseline until a new appearance has been deliberately accepted. For later work, capture the same pages, dimensions, and UI states in a separate folder, review the differences, then document accepted changes. Do not regenerate old reference screenshots in place.
