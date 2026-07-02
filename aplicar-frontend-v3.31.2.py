from pathlib import Path
import re
import shutil
import sys

ROOT = Path.cwd()
PATCH_ROOT = Path(__file__).resolve().parent / "files"

required = [
    ROOT / "index.html",
    ROOT / "js" / "site-settings.js",
    ROOT / "js" / "mc-commerce-tools-v3311.js",
    ROOT / "admin" / "apariencia.html",
]

missing = [str(path) for path in required if not path.exists()]
if missing:
    print("ERROR: Ejecuta este script desde la raíz de mommy-crafts-frontend.")
    print("No se encontraron:")
    for item in missing:
        print(f"  - {item}")
    sys.exit(1)

for source in PATCH_ROOT.rglob("*"):
    if not source.is_file():
        continue
    relative = source.relative_to(PATCH_ROOT)
    destination = ROOT / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    print(f"Copiado: {relative.as_posix()}")

updated_html = 0
for path in ROOT.glob("*.html"):
    if path.name == "googlec321375894d8c5db.html":
        continue
    text = path.read_text(encoding="utf-8")
    original = text
    text = re.sub(
        r'css/mc-commerce-tools-v3311\.css\?v=[^"\']+',
        'css/mc-commerce-tools-v3311.css?v=3.31.2',
        text
    )
    text = re.sub(
        r'js/mc-commerce-tools-v3311\.js\?v=[^"\']+',
        'js/mc-commerce-tools-v3311.js?v=3.31.2',
        text
    )
    text = re.sub(
        r'js/site-settings\.js\?v=[^"\']+',
        'js/site-settings.js?v=3.31.2',
        text
    )
    if text != original:
        path.write_text(text, encoding="utf-8")
        updated_html += 1

print(f"Referencias de caché actualizadas en {updated_html} páginas públicas.")
print("Parche Frontend V3.31.2 aplicado correctamente.")
