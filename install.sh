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
ICON_DIR="$DATA_HOME/icons/hicolor/512x512/apps"
APP_DIR="$DATA_HOME/applications"

rm -rf "$DEST"
mkdir -p "$DEST" "$ICON_DIR" "$APP_DIR"
cp -a "$SRC"/. "$DEST"/
cp -f assets/icon.png "$ICON_DIR/notefun.png"

cat > "$APP_DIR/notefun.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=NoteFun
Comment=Note Fun
Exec=$DEST/notefun
Icon=$ICON_DIR/notefun.png
Terminal=false
Categories=Office;
StartupWMClass=notefun
StartupNotify=true
EOF

rm -f "$APP_DIR/onenote.desktop"
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APP_DIR" || true
fi

echo "Installed $DEST/notefun"
echo "Launcher $APP_DIR/notefun.desktop"
