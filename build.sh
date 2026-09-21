#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

npm install

npx electron-forge package --platform linux --arch x64
echo "Built: $(pwd)/out/notefun-linux-x64/notefun"
