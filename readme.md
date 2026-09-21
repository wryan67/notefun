# Note Fun

Electron wrapper for OneNote on the web.

## Build (Debian/Ubuntu, no root)

```bash
./build.sh
./install.sh
```

Installs to `~/.local/share/notefun` and a `NoteFun` desktop launcher.

Config is `~/.config/notefun/config.json` (`baseUrl`, `lastUrl`).

- First launch asks for a base URL (default `https://onenote.cloud.microsoft/notebooks`).
- `Ctrl+Shift+H` changes the base URL.
- House icon in the title bar goes to the base URL.
- Cold start restores the last notebook page URL.
