# Kobiowu v1 — Todo List

## Project Setup
- [x] Initialize TypeScript project with `core` package structure
- [x] Configure build tooling (tsup or similar)
- [x] Set up linting and formatting (ESLint, Prettier)
- [x] Set up testing framework (Vitest)
- [x] Commit and push (see `docs/push-command.md`)

---

## Core Engine

### Registry
- [x] Implement `OverlayRegistry` — live map of active overlay instances
- [x] Auto-generate unique IDs for overlays when no custom ID is provided
- [x] Support group tagging on registry entries
- [x] Expose `getRef(id)`, `getAll(filter?)`, `isOpen(id)` on the registry
- [x] Commit and push (see `docs/push-command.md`)

### Portal & Container Management
- [x] Create portal container system (mount to `document.body` by default)
- [x] Support configurable `portalTarget` (element or CSS selector)
- [x] Create per-type container layers for predictable stacking
- [x] Support configurable `containerPrefix` for CSS class namespacing
- [x] Commit and push (see `docs/push-command.md`)

### OverlayRef
- [x] Implement `OverlayRef` interface with identity fields (`id`, `type`, `state`)
- [x] Implement `close(reason?)`, `open()`, `toggle()`, `focus()` control methods
- [x] Implement `patch(options)` — live option patching with immediate DOM effect
- [x] Implement `moveTo(x, y)`, `resetPosition()`, `getPosition()` for draggable overlays
- [x] Implement `update(component)` — swap rendered content in place
- [x] Implement `getData()` / `setData(data)` — arbitrary data access
- [x] Implement `setType(type)` and `setProgress(value)` for toast refs
- [x] Implement `sendToBack()`, `bringToFront()`, `setPriority(priority)` — stack control
- [x] Implement `on(event, handler)`, `once(event, handler)`, `off(event, handler)` — event subscription; `on()` returns unsubscribe fn
- [x] Expose `element` and `contentElement` readonly DOM references
- [x] Commit and push (see `docs/push-command.md`)

### Z-Index / Stacking System
- [x] Auto-assign z-index based on insertion order
- [x] Respect `priority` option to override insertion order
- [x] Implement `stackGroup` — group overlays in the same visual tower
- [x] Implement `isolate` — block pointer events to overlays beneath
- [x] Support `sharedBackdrop` global config (one backdrop for bottom overlay vs. per-overlay)
- [x] Set z-index base values per type: modal=1000, toast=1100, drawer=1000, alert=1200
- [x] Commit and push (see `docs/push-command.md`)

### Backdrop System
- [x] Implement backdrop types: `blur`, `dim`, `fade`, `frosted`, `none`, `custom`
- [x] Support `backdropColor`, `backdropBlur`, `backdropOpacity` options
- [x] Implement `backdropClickClosable` behavior (default true for modal, false for alert)
- [x] Handle backdrop per-overlay vs. shared backdrop modes
- [x] Commit and push (see `docs/push-command.md`)

### Animation System
- [x] Implement string preset animations: `fade`, `scale`, `slide`, `none`
- [x] Implement `AnimationConfig` object support for custom animations
- [x] Implement CSS class pair support for enter/exit animations
- [x] Respect `animationDuration` option (per-instance and global default)
- [x] Handle `keepMounted` — keep DOM alive when hidden for animation continuity
- [x] Commit and push (see `docs/push-command.md`)

### Drag & Drop
- [x] Implement draggable overlay behavior
- [x] Support `dragHandle` — CSS selector or element as drag handle
- [x] Support `dragBounds`: `viewport`, `parent`, or custom `DOMRect`
- [x] Support `dragAxis`: `both`, `x`, `y`
- [x] Support `initialPosition` — set starting x/y coordinates
- [x] Fire `onDragStart` and `onDragEnd` lifecycle hooks
- [x] Commit and push (see `docs/push-command.md`)

### Resize
- [x] Implement resizable overlay behavior
- [x] Support `resizeHandles` — configurable set of handles: `n s e w ne nw se sw`
- [x] Commit and push (see `docs/push-command.md`)

### Lifecycle & Behavior
- [x] Implement `onOpen`, `onClose`, `onFocus`, `onBlur` lifecycle callbacks
- [x] Implement `onBeforeClose` — async cancellable close guard (return `false` to cancel)
- [x] Implement `closeOnEscape` (default: true)
- [x] Implement `trapFocus` — required for `modal` and `alert`, optional for others (WCAG)
- [x] Implement `lockScroll` (default: true for modal/drawer, false for toast)
- [x] Implement `autoCloseAfter` — auto-dismiss after N ms
- [x] Implement `singleton` — replace existing overlay of same type+id on re-launch
- [x] Commit and push (see `docs/push-command.md`)

### Sizing & Positioning
- [x] Support `fullscreen` flag
- [x] Support `width`, `height`, `maxWidth`, `maxHeight` options
- [x] Implement position presets: `center`, `top`, `bottom`, `left`, `right`, `top-left`, `top-right`, `bottom-left`, `bottom-right`
- [x] Support custom position: `{ x: number | string, y: number | string }`
- [x] Support `offset`: `{ x?, y? }` fine-tuning
- [x] Commit and push (see `docs/push-command.md`)

---

## Overlay Types

### Modal
- [x] Implement modal renderer (headless/zero-style in core)
- [x] Support `centered` option (default: true)
- [x] Support `scrollable` option for content scroll within modal
- [x] Commit and push (see `docs/push-command.md`)

### Toast
- [x] Implement toast renderer (headless/zero-style in core)
- [x] Support toast positions: `top-right`, `top-left`, `top-center`, `bottom-right`, `bottom-left`, `bottom-center`
- [x] Implement `duration` with auto-close (0 = persist)
- [x] Implement `pauseOnHover` (default: true)
- [x] Implement `showProgress` — progress bar for auto-close timer
- [x] Implement `limit` — max visible toasts per position
- [x] Implement `gap` — px spacing between stacked toasts
- [x] Implement `swipeToDismiss` — swipe gesture support (`true`, `'x'`, `'y'`)
- [x] Implement `type`: `default`, `success`, `error`, `warning`, `info`, `loading`
- [x] Support `aria-live` region for accessibility (`polite` / `assertive`)
- [x] Commit and push (see `docs/push-command.md`)

### Drawer
- [x] Implement drawer renderer (headless/zero-style in core)
- [x] Support `side`: `left`, `right` (default), `top`, `bottom`
- [x] Support `size` — width (left/right) or height (top/bottom)
- [x] Implement `pushContent` — push page content instead of overlaying
- [x] Implement `overlay` — backdrop behind drawer
- [x] Implement `snapPoints` and `defaultSnapPoint`
- [x] Commit and push (see `docs/push-command.md`)

### Alert
- [x] Implement alert renderer (headless/zero-style in core)
- [x] Support `type`: `confirm`, `prompt`, `info`, `destructive`
- [x] Implement `onConfirm` and `onCancel` callbacks
- [x] Support `confirmLabel` and `cancelLabel` text options
- [x] Commit and push (see `docs/push-command.md`)

### Tooltip, Popover, Sheet, Spotlight
- [x] Implement `tooltip` type — lightweight anchor-attached overlay
- [x] Implement `popover` type — richer anchor-attached overlay
- [x] Implement `sheet` type — bottom sheet (mobile-style)
- [x] Implement `spotlight` type — full-screen focus overlay
- [x] Commit and push (see `docs/push-command.md`)

---

## Global API (`kobiowu.*`)

- [x] Implement `launchModal()`, `launchToast()`, `launchDrawer()`, `launchAlert()`, `launchSheet()`
- [x] Implement generic `launch()` escape hatch
- [x] Implement `closeAll(filter?)` — close by type and/or group
- [x] Implement `pauseAll()` / `resumeAll()` — pause/resume auto-close timers
- [x] Implement `patchAll(options, filter?)` — batch update options
- [x] Implement global events: `kobiowu.on('launch' | 'close' | 'focus', handler)`
- [x] Implement `kobiowu.config(options)` — global configuration
- [x] Commit and push (see `docs/push-command.md`)

---

## Configuration (`kobiowu.config`)

- [x] `portalTarget` — custom mount element or selector
- [x] `defaults` — per-type default options (modal, toast, drawer, alert)
- [x] `ariaLive` — global aria-live setting for toasts
- [x] `sharedBackdrop` — global backdrop sharing mode (via KobiowuConfig)
- [x] `containerPrefix` — supported via PortalManager.configure()
- [x] `zIndexBase` — per-type z-index base values
- [x] `animationPreset` and `animationDuration` — global animation defaults
- [x] `renderers` — custom renderer via render-function component pattern
- [x] Commit and push (see `docs/push-command.md`)

---

## Themes

- [x] `themes/minimal` — near-unstyled base styles
- [x] `themes/clean` — polished default UI
- [x] `themes/shadcn` — shadcn/ui-compatible design tokens
- [x] Commit and push (see `docs/push-command.md`)

---

## Devtools

- [x] Build debug overlay showing live registry/stack state
- [x] Commit and push (see `docs/push-command.md`)

---

## Quality & Docs

- [x] Write unit tests for registry, OverlayRef, stacking, lifecycle hooks
- [x] Write integration tests for each overlay type
- [x] Write accessibility tests (focus trap, aria attributes, keyboard nav)
- [x] Write API documentation / README for `core`
- [x] Set up CI (lint, test, build)
- [x] Commit and push (see `docs/push-command.md`)
