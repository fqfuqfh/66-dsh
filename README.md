# dsh-mobile-shell

A phone-friendly shell for the **DSH web GUI**: one column of conversation, no
right panel, no 56 px sidebar rail — and the session list still one tap away.

The whole plugin is **CSS only**. It injects a single `<style>` element and
nothing else: no DOM nodes, no event listeners, no network requests, no host-side
code. That is deliberate — on this build a browser plugin that creates DOM or
touches the layout service can blank the page on a phone.

```
before            after
┌──┬────────┬──┐  ┌───────────────┐
│▐ │ chat   │▐ │  │ 🐳        …   │  ← full-width top bar
│▐ │        │▐ │  ├───────────────┤
│▐ │        │▐ │  │ chat          │
└──┴────────┴──┘  │               │
                  │ [composer]    │
                  └───────────────┘
```

## What it changes

Everything is scoped to `@media (max-width: 900px)`, so desktop stays untouched.

| Area | Before | After |
|---|---|---|
| Right panel | shown, steals the width | hidden |
| Sidebar rail | 56 px, always on screen | removed in the collapsed state |
| Session list | the rail button | 🐳 button, top-left |
| Session header | full-width row, 76 px + tab row | floating `…`, top-right |
| Stats under the composer | three rows | one row (cache hit + balance) |
| Sidebar panel rows | 插件 / 自动化任务 / 更多 | hidden — sessions only |

## Install

The plugin is loaded through a profile bundle, so it has to live where DSH can
resolve it. From your profile directory (`$DSH_HOME/profiles/<name>`):

```bash
# local checkout
npm install /path/to/dsh-mobile-shell

# or from a git remote
npm install git+https://github.com/fqfuqfh/66-dsh.git
```

Then add it to the profile's `package.json`:

```json
{
  "dependencies": { "dsh-mobile-shell": "^1.0.0" },
  "dsh": { "profile": { "bundles": ["dsh-mobile-shell"] } }
}
```

Restart DSH once so the loader picks up the new bundle entry. After that, edits
to `lib/client.js` are picked up on the next page load — the plugin URL carries a
content hash, so you only have to reload the tab (on mobile, close the tab and
reopen the link: a pull-to-refresh can keep the old styles).

## Configuration

There is none. If 900 px is the wrong breakpoint for your device, edit the
`@media` line at the top of the `CSS` array in `lib/client.js`.

## Compatibility

Written against DSH **0.2.1-rc.3**. The rules target stable structural signals
(`data-sidebar-collapsed`, `[data-composer-stat="…"]`, the `grid-template-columns`
inline style on the frame) and stable class *suffixes* (`frame`, `sidebarCol`,
`rightbarCol`), because the CSS-module hash in front of them changes between
builds. Two selectors do use build-specific names — `hHd-Xa_*` (sidebar) and
`wSkVaW_*` (session header) — so a DSH upgrade may require adjusting them.

If a future build drops those class names, the failure is cosmetic: the affected
rule stops matching, and the rest of the shell still applies.

## Why the whale is a `body::after`

The real session-list button lives inside the collapsed sidebar shell. That shell
sets `opacity` (or `transform`) on an ancestor, and no amount of `opacity: 1`,
`visibility: visible` or `position: fixed` on the button brings it back — a fixed
element still can't escape a transparent ancestor. So the visible mark is drawn
by a pseudo-element on `body`, which is outside that chain entirely.

The pseudo-element has `pointer-events: none`; taps fall through to the real (but
invisible) button underneath, so behaviour is the stock toggle. The `🐳` sits on
a faint blue chip on purpose: even on a device without emoji glyphs, the chip
marks where the target is.

## Notes for plugin authors

Things that cost real debugging time on this build:

- **Grid items must stay in flow.** `sidebarCol` is the frame's first grid cell.
  Making it `position: fixed` hands that cell to the next child, and the
  conversation gets laid out inside the 56 px rail. Force the track width instead.
- **No click-blocking overlays.** A `body:has(… )::after` dimmer that stays on
  when its trigger attribute is missing leaves the whole page grey and dead.
- **A full-width bar can't be a layout child.** The session header lives inside
  the centre column, so a bar built from it never spans the width. Draw it with a
  body-level pseudo-element and push the frame down by exactly its height.
- **`shell.leading` is macOS-only.** `leadingMounted = darwin && sidebarCollapsed`
  — selectors over that seat can never match on Windows or the web.
- **Class names are hashed.** Use `[class*="suffix"]` or `[class~="exact"]`;
  `[class~="x"]` is the safer one where both `x` and `xSomething` exist.

## License

MIT — see [LICENSE](LICENSE).
