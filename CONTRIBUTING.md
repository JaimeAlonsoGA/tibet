# Contributing to Tibet

Contributions are welcome — new characters, bug fixes, translations, ideas. Issues and pull requests can be written in English or Spanish.

## Development

Requirements: GNOME Shell 48+, `gnome-extensions`, `make`.

```sh
make install          # pack and install into ~/.local/share/gnome-shell/extensions
```

On Wayland, GNOME Shell only loads new/changed extension code after logging out and back in. To iterate faster, run a nested shell:

```sh
dbus-run-session -- gnome-shell --nested --wayland
```

Logs: `journalctl -f -o cat /usr/bin/gnome-shell`.

The ▶ button in preferences triggers a break immediately.

## Adding a character

A character is a stack of 400×400 SVG layers animated by the extension. No code beyond a config entry is needed.

1. Create `assets/<id>/` with your layers, e.g. `body.svg`, `arm-left.svg`, `arm-right.svg`. All layers share the same 400×400 canvas so they line up.
2. Add an entry to `CHARACTERS` and its id to `ORDER` in [`characters.js`](characters.js):
   - `colors`: background gradient `[top, bottom]`.
   - `particle`: a file in `assets/particles/` that floats up in the background.
   - `layers`: drawn in order (first = back).
     - `{file, breathe: true}` — gently scales, for the body.
     - `{file, pivot: [x, y], from, to}` — rotates between `from` and `to` degrees around `pivot` (canvas coordinates). Positive is clockwise. Use it for arms, tails…
3. Add the id as a `<choice>` of the `character` key in [`schemas/org.gnome.shell.extensions.tibet.gschema.xml`](schemas/org.gnome.shell.extensions.tibet.gschema.xml).

Keep the style consistent: flat colors, soft outlines, closed happy eyes, no text.

## Guidelines

- Follow the [GNOME Shell extension review guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html): clean up everything in `disable()`, no work in the constructor.
- The break screen has no explanatory text — keep it visual.
- Match the existing code style (4-space indent, single quotes, ES modules).

By contributing you agree that your work is licensed under the [GPL-2.0-or-later](LICENSE).
