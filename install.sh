#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

SRC="out/notefun-linux-x64"
if [[ ! -x "$SRC/notefun" ]]; then
  echo "Build first: ./build.sh" >&2
  exit 1
fi

DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
DEST="$DATA_HOME/notefun"
ICON_SRC="assets/icon.png"
ICON_HICOLOR="$DATA_HOME/icons/hicolor/512x512/apps/notefun.png"
ICON_PIXMAPS="$DATA_HOME/pixmaps/notefun.png"
APP_DIR="$DATA_HOME/applications"

if [[ ! -f "$ICON_SRC" ]]; then
  echo "Missing $ICON_SRC" >&2
  exit 1
fi

if [[ -e "$DEST/chrome-sandbox" ]]; then
  sudo rm -f "$DEST/chrome-sandbox"
fi
rm -rf "$DEST"
mkdir -p "$DEST" "$(dirname "$ICON_HICOLOR")" "$(dirname "$ICON_PIXMAPS")" "$APP_DIR"
cp -a "$SRC"/. "$DEST"/
install -m 644 "$ICON_SRC" "$ICON_HICOLOR"
install -m 644 "$ICON_SRC" "$ICON_PIXMAPS"
install -m 644 "$ICON_SRC" "$DEST/icon.png"
echo "Copied icon:"
echo "  $ICON_HICOLOR"
echo "  $ICON_PIXMAPS"
echo "  $DEST/icon.png"

sudo chown root:root "$DEST/chrome-sandbox"
sudo chmod 4755 "$DEST/chrome-sandbox"
echo "Sandbox: $(ls -l "$DEST/chrome-sandbox")"

cat > "$APP_DIR/notefun.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=NoteFun
Comment=Note Fun
Exec=$DEST/notefun
Icon=$ICON_HICOLOR
Terminal=false
Categories=Office;
StartupWMClass=notefun
StartupNotify=true
EOF
echo "Launcher $APP_DIR/notefun.desktop"

rm -f "$APP_DIR/onenote.desktop"
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APP_DIR" || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f "$DATA_HOME/icons/hicolor" 2>/dev/null || true
fi

echo "Installed $DEST/notefun"
