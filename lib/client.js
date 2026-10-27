window.__ModuleLoader__.load({
	id: "dsh-mobile-shell",
	factory: (require) => {
		const module = { exports: {} };

		/* Narrow-screen shell for the web client — CSS only.
		 *
		 * Hard-won constraints on this build (0.2.1-rc.3):
		 *   - creating DOM nodes or touching the layout service blanks the
		 *     mobile page, so this plugin injects styles and nothing else;
		 *   - never put a click-blocking overlay on top of the app: an earlier
		 *     `body:has(...)::after` dimmer stayed on when the frame attribute
		 *     was absent, which left the page grey and unclickable;
		 *   - NEVER take a grid item out of flow. `sidebarCol` is the frame's
		 *     first grid cell: making it `position:fixed`/`absolute` hands that
		 *     cell to the next child (the conversation column), which then gets
		 *     laid out inside the 56px rail — the "everything squeezed to the
		 *     left" symptom. The drawer idea died here.
		 *
		 * Geometry facts that decided the layout below:
		 *   - a collapsed sidebar is NOT gone: AppFrame keeps a 56px rail and
		 *     the sidebar shell moves its upper controls into it. The rail's
		 *     first control (.hHd-Xa_toggle) is the session-list toggle, so the
		 *     rail must stay on screen and in flow — it is the only way back to
		 *     the session list on a phone;
		 *   - `shell.leading` only mounts on darwin with a collapsed sidebar
		 *     (`leadingMounted = darwin && sidebarCollapsed`), so no selector
		 *     over that seat can ever match on Windows/web.
		 *
		 * Scope: right column and the rail toggle. Message actions (read-aloud)
		 * and the input dock are untouched. */
		const STYLE_ID = "dsh-mobile-shell-css";

		const CSS = [
			"@media (max-width: 900px) {",
			/* 1. Right column gone; the two remaining cells keep their order. */
			'  [class*="rightbarCol"] { display: none !important; }',
			'  div[class*="frame"][style*="grid-template-columns"] {',
			"    grid-template-columns: auto minmax(0, 1fr) 0px !important;",
			"  }",
			/* 2. The whale now floats in the top bar (top-left, mirroring the
			 *    "…" at top-right) instead of sitting inside the 56px rail.
			 *    This is what lets the rail disappear completely (rule 2b): the
			 *    island costs horizontal room on a phone and there is nothing
			 *    in it worth that.
			 *    The button is a grandchild of the sidebar column, NOT a grid
			 *    item, so `position: fixed` here does not repeat the earlier
			 *    disaster of fixing `sidebarCol` itself. It is fixed in both
			 *    states so it does not jump when the list opens. */
			'  [class*="hHd-Xa_toggle"] {',
			"    position: fixed !important;",
			"    top: 6px !important;",
			"    left: 8px !important;",
			"    z-index: 60 !important;",
			"    width: 40px !important;",
			"    height: 40px !important;",
			"    margin: 0 !important;",
			"    padding: 0 !important;",
			"    border: 0 !important;",
			"    border-radius: 10px !important;",
			"    background: transparent !important;",
			"    box-shadow: none !important;",
			"    display: grid !important;",
			"    place-items: center !important;",
			"    overflow: visible !important;",
			"    opacity: 1 !important;",
			"    visibility: visible !important;",
			"  }",
			/* the whale is the emoji mark; the stock svg is hidden */
			'  [class*="hHd-Xa_toggle"] > svg { display: none !important; }',
			'  [class*="hHd-Xa_toggle"]::before {',
			'    content: "🐳";',
			"    font-size: 26px;",
			"    line-height: 1;",
			"  }",
			/* 5. The top bar itself: a full-width white strip drawn by the body
			 *    pseudo-element, and the frame is pushed down by exactly its
			 *    height so nothing sits underneath it. A strip made from the
			 *    session header could never span the whole width (that header
			 *    lives inside the centre column, and its box starts below the
			 *    sidebar's own top edge) — which is why the whale ended up
			 *    ABOVE the white area instead of inside it. */
			"  body::before {",
			'    content: "";',
			"    position: fixed !important;",
			"    top: 0 !important;",
			"    left: 0 !important;",
			"    right: 0 !important;",
			"    height: 54px !important;",
			"    background: var(--dsw-alias-bg-base, #ffffff) !important;",
			"    border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.07)) !important;",
			"    z-index: 35 !important;",
			"    pointer-events: none !important;",
			"  }",
			/* 6. The visible mark for the session-list toggle.
			 *    The real <button> cannot paint here: it lives inside the
			 *    collapsed sidebar shell, and something in that ancestor chain
			 *    (opacity or transform) swallows it no matter what opacity,
			 *    visibility or position it is given. A body-level pseudo
			 *    element is outside that chain entirely, so it always paints.
			 *    It never receives the tap — pointer-events stays off and the
			 *    invisible button above it keeps the click target. */
			"  body::after {",
			'    content: "🐳";',
			"    position: fixed !important;",
			"    top: 7px !important;",
			"    left: 8px !important;",
			"    width: 40px !important;",
			"    height: 40px !important;",
			"    display: grid !important;",
			"    place-items: center !important;",
			"    font-size: 22px !important;",
			"    line-height: 1 !important;",
			"    border-radius: 10px !important;",
			"    background: rgba(77, 107, 254, .12) !important;",
			"    border: 1px solid rgba(77, 107, 254, .35) !important;",
			"    z-index: 58 !important;",
			"    pointer-events: none !important;",
			"  }",
			'  div[class*="frame"][style*="grid-template-columns"] {',
			"    padding-top: 54px !important;",
			"    box-sizing: border-box !important;",
			"  }",
			/* 2b. Kill the rail: in the collapsed state the sidebar column gets
			 *     zero width and the conversation reclaims it all. Only the
			 *     collapsed state is forced — the expanded state keeps the
			 *     inline track width AppFrame computed, so tapping the whale
			 *     still opens the list normally. */
			'  div[class*="frame"][data-sidebar-collapsed] {',
			"    grid-template-columns: 0 minmax(0, 1fr) 0px !important;",
			"  }",
			/* A zero-width column clips its own content, so the sidebar has to
			 * clip too — otherwise the collapsed shell spills over the chat.
			 * The whale escapes that clip because it is position:fixed, but a
			 * transparent/hidden ancestor would take it with it, hence the
			 * forced opacity/visibility below. */
			'  [class*="sidebarCol"] { overflow: hidden !important; }',
			'  [class*="hHd-Xa_root"],',
			'  [class*="hHd-Xa_collapsed"] {',
			"    opacity: 1 !important;",
			"    visibility: visible !important;",
			"  }",
			/* 2c. Inside the opened list, keep only the sessions: the "插件 /
			 *     自动化任务 / 更多" panel rows are of no use on a phone. The
			 *     footer (settings) is left alone. */
			'  [class*="hHd-Xa_panelList"],',
			'  [class*="hHd-Xa_panelRow"] { display: none !important; }',
			/* 3. One status row instead of three. The dock stacks
			 *    `[data-composer-stat="activity"]` (turn/step counts + tok/s),
			 *    `[data-composer-stat="usage"]` (whole-log tokens + cache hit)
			 *    and the api-dashboard balance pill. Dropping the activity pill
			 *    keeps the cache-hit reading and the balance, and saves a row
			 *    on a phone. Both attributes come from PlainPill/DialogPill in
			 *    dsh-client-ui-chat (client.js:7501 / :7521). */
			'  [data-composer-stat="activity"] { display: none !important; }',
			/* 4. The session header collapses to one floating "…" in the top-right
			 *    corner. The header itself is a full-width grid row (min-height
			 *    76px plus the View tab row); here it leaves the flow and keeps
			 *    only the utilities/corner seats, so the conversation starts at
			 *    the top of the screen. Every child is hidden first and only
			 *    those two seats are brought back — the title cluster, the
			 *    actions and the "对话/轨迹" tab row all go away.
			 *    `pointer-events: none` on the header keeps the transparent
			 *    strip from eating taps on the message underneath. */
			'  [class~="wSkVaW_header"] {',
			"    position: fixed !important;",
			"    top: 3px !important;",
			"    right: 6px !important;",
			"    left: auto !important;",
			"    bottom: auto !important;",
			"    width: auto !important;",
			"    min-height: 0 !important;",
			"    padding: 0 !important;",
			"    border: 0 !important;",
			"    background: transparent !important;",
			"    display: flex !important;",
			"    align-items: center !important;",
			"    gap: 4px !important;",
			"    z-index: 45 !important;",
			"    pointer-events: none !important;",
			"  }",
			'  [class~="wSkVaW_header"] > * { display: none !important; }',
			'  [class~="wSkVaW_header"] > [class~="wSkVaW_titleRow"] {',
			"    display: flex !important;",
			"    justify-content: flex-end !important;",
			"    align-items: center !important;",
			"    min-height: 0 !important;",
			"    padding: 0 !important;",
			"    gap: 4px !important;",
			"  }",
			'  [class~="wSkVaW_header"] [class~="wSkVaW_titleCluster"],',
			'  [class~="wSkVaW_header"] [class~="wSkVaW_headerActions"],',
			'  [class~="wSkVaW_header"] [class~="wSkVaW_tabs"] { display: none !important; }',
			'  [class~="wSkVaW_header"] [class~="wSkVaW_headerUtilities"],',
			'  [class~="wSkVaW_header"] [class~="wSkVaW_headerCorner"] {',
			"    display: flex !important;",
			"    align-items: center !important;",
			"    pointer-events: auto !important;",
			"  }",
			/* a faint chip so the lone button stays readable over chat text */
			'  [class~="wSkVaW_header"] [class~="wSkVaW_headerUtilities"] > *,',
			'  [class~="wSkVaW_header"] [class~="wSkVaW_headerCorner"] > * {',
			"    background: var(--dsw-alias-bg-base, #fff) !important;",
			"    border-radius: 9px !important;",
			"  }",
			"}",
		].join("\n");

		function injectCss() {
			try {
				if (document.getElementById(STYLE_ID)) return;
				const style = document.createElement("style");
				style.id = STYLE_ID;
				style.textContent = CSS;
				const host = document.head || document.documentElement;
				if (host) host.appendChild(style);
			} catch (e) {
				/* a CSS-only plugin must never be able to break the app */
			}
		}

		module.exports.apply = () => {
			try {
				if (document.head) injectCss();
				else document.addEventListener("DOMContentLoaded", injectCss, { once: true });
			} catch (e) {
				/* never break boot */
			}
		};
		module.exports.inject = [];
		return module.exports;
	},
});
