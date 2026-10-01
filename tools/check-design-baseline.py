"""Read-only source integrity check. This does not perform visual comparison."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "design-baseline/2026-09-22/source-manifest.json"


def check(root, manifest):
    changed, missing = [], []
    for name, expected in manifest["sha256"].items():
        path = root / name
        if not path.is_file():
            missing.append(name)
        elif hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            changed.append(name)
    return changed, missing


if __name__ == "__main__":
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    changed, missing = check(ROOT, manifest)
    for name in missing:
        print("MISSING: " + name)
    for name in changed:
        print("CHANGED: " + name)
    if not changed and not missing:
        print(f"PASS: {len(manifest['sha256'])} baseline source/assets unchanged.")
    else:
        print("Review changes against screenshots. Do not replace the baseline automatically.")
    print("This checks recorded file bytes, not visual equivalence or newly added files.")
    raise SystemExit(1 if changed or missing else 0)
