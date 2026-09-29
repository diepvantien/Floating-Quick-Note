# Floating Quick Note v3.6

## What changed

### Themes now apply reliably
The Settings popup writes its own synchronization identity and merges only the settings into the freshest stored state. This fixes the case where a tab ignored a theme change because the popup inherited that tab's previous `lastWriter` metadata. Theme changes now propagate to open tabs without overwriting notes edited while Settings is open.

Themes included:
- Paper
- Midnight
- Ocean
- Sakura
- Forest
- Graphite

The selected theme now affects the note window, header, editor, panels, icons, active note states, image selection accents, bubble, placeholders and shadows. The Settings popup also previews the selected theme immediately.

### Cleaner Settings popup
Settings is split into three compact sections:
- Appearance: language + themes
- Shortcuts: editable quick shortcuts + browser shortcut manager
- Data: local extension data + destructive reset

### Floating note header
The floating note now keeps these actions visible:
- Saved notes
- New note
- History
- Collapse
- Close

The keyboard-shortcut help panel and its button were removed from the floating note. Shortcut configuration lives only in the browser-action Settings popup.

### Copy button
The whole-note Copy button is smaller and sits in the top-right of the editor. It remains intentionally faint until the editor is hovered or the button itself is focused/hovered.

### Bubble animation
Bubble-to-window motion was rewritten as a short FLIP-style transition. The card translates from the bubble's actual center while scaling and fading into its final position, without the previous slow bounce/overshoot. Collapse runs the inverse motion.

## Install / update
1. Extract the ZIP.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable Developer mode.
4. Remove/disable the previous development copy to avoid duplicates.
5. Choose **Load unpacked** and select the `floating-quick-note-extension-v3.6` folder.

Existing data stored under `floatingQuickNoteV3` remains compatible.


## v3.6 UI refinements

- Language switch moved to the top header beside Quick Note.
- Global shortcut badges on Open/New actions are hidden when the browser reports them as unassigned.
- Open Note now uses a dedicated open-window icon.
- Bubble icon redesigned as a compact note/chat glyph and inherits every selected theme.
- Bubble close control is smaller, centered, theme-aware, and uses a CSS-drawn cross for pixel-perfect alignment.
