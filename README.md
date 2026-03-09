# kobiowu

Framework-agnostic, headless overlay orchestration engine.
Zero styling, full control. Works with React, Vue, Svelte, or plain HTML.

## Install

```bash
npm install kobiowu
```

## Quick start

```ts
import { kobiowu } from 'kobiowu'

// Modal
const ref = kobiowu.launchModal('<div>Hello world</div>')
await ref.close()

// Toast
kobiowu.launchToast('<span>Saved!</span>', { duration: 3000, position: 'top-right' })

// Drawer
kobiowu.launchDrawer('<nav>...</nav>', { side: 'left' })

// Alert
kobiowu.launchAlert('<p>Are you sure?</p>', {
  type: 'destructive',
  onConfirm: () => console.log('confirmed'),
  onCancel:  () => console.log('cancelled'),
})

// Generic
kobiowu.launch('sheet', '<div>Sheet content</div>')
```

## Global API

### `kobiowu.config(options)`

Configure global defaults. All per-launch options still override global defaults.

```ts
kobiowu.config({
  portalTarget: '#overlay-root',  // default: document.body
  ariaLive: 'polite',             // for toasts
  animationPreset: 'fade',        // 'fade' | 'scale' | 'slide' | 'none'
  animationDuration: 200,
  zIndexBase: { modal: 1000, toast: 1100, alert: 1200, drawer: 1000 },
  defaults: {
    modal:  { centered: true },
    toast:  { duration: 4000, pauseOnHover: true },
    drawer: { side: 'right' },
  },
})
```

### `kobiowu.launchModal(component, options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto | Unique overlay ID |
| `group` | `string` | — | Group tag for filtering |
| `centered` | `boolean` | `true` | Centre the content box |
| `scrollable` | `boolean` | `false` | Allow content scroll |
| `closeOnEscape` | `boolean` | `true` | Escape key closes modal |
| `width`, `height`, `maxWidth`, `maxHeight` | `string\|number` | — | Size constraints |
| `className`, `style` | — | — | Element styling |
| `zIndex` | `number` | — | Override z-index |

### `kobiowu.launchToast(component, options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `position` | `ToastPosition` | `'top-right'` | Placement on screen |
| `duration` | `number` | `4000` | ms before auto-close; `0` = persist |
| `pauseOnHover` | `boolean` | `true` | Pause timer on hover |
| `showProgress` | `boolean` | `false` | Show countdown bar |
| `limit` | `number` | — | Max toasts per position |
| `gap` | `number` | `8` | px gap between toasts |
| `swipeToDismiss` | `boolean\|'x'\|'y'` | — | Touch swipe to dismiss |
| `type` | `ToastType` | `'default'` | `success`, `error`, `warning`, `info`, `loading` |

### `kobiowu.launchDrawer(component, options?)`

| Option | Type | Default |
|---|---|---|
| `side` | `'left'\|'right'\|'top'\|'bottom'` | `'right'` |
| `size` | `string\|number` | `'320px'` (width) or `'50vh'` (height) |
| `pushContent` | `boolean` | `false` |
| `overlay` | `boolean` | `true` |
| `snapPoints` | `Array<string\|number>` | — |
| `defaultSnapPoint` | `string\|number` | — |

### `kobiowu.launchAlert(component, options?)`

| Option | Type | Description |
|---|---|---|
| `type` | `'confirm'\|'prompt'\|'info'\|'destructive'` | Alert style |
| `onConfirm` | `(value?: string) => void` | Fires on `[data-kb-confirm]` click |
| `onCancel` | `() => void` | Fires on `[data-kb-cancel]` click |

### `kobiowu.launchSheet(component, options?)`

| Option | Type | Default |
|---|---|---|
| `height` | `string\|number` | `'50vh'` |
| `defaultSnapPoint` | `string\|number` | — |

### OverlayRef

All launch methods return an `OverlayRef`:

```ts
const ref = kobiowu.launchModal(...)

// Control
await ref.close('reason')
await ref.open()
await ref.toggle()
ref.focus()

// State
ref.id      // string
ref.type    // OverlayType
ref.state   // 'opening' | 'open' | 'closing' | 'closed'

// Live patch
ref.patch({ className: 'updated' })

// Content swap
ref.update('<div>New content</div>')

// Data
ref.setData({ userId: 42 })
ref.getData() // { userId: 42 }

// Events
const unsub = ref.on('close', (ref, reason) => { ... })
ref.once('open', handler)
unsub()

// DOM access
ref.element        // wrapper HTMLElement | null
ref.contentElement // content HTMLElement | null
```

### Batch operations

```ts
await kobiowu.closeAll()                    // close everything
await kobiowu.closeAll({ type: 'toast' })   // close all toasts
await kobiowu.closeAll({ group: 'auth' })   // close by group

kobiowu.pauseAll()   // pause all toast timers
kobiowu.resumeAll()

kobiowu.patchAll({ className: 'dim' })
kobiowu.patchAll({ zIndex: 50 }, { type: 'modal' })
```

### Global events

```ts
const off = kobiowu.on('launch', (ref) => console.log('launched', ref.id))
kobiowu.on('close',  (ref) => console.log('closed', ref.id))
off() // unsubscribe
```

## Low-level API

The low-level mount functions are also exported for framework integrations:

```ts
import { mountModal, mountToast, mountDrawer, mountAlert, mountSheet } from 'kobiowu'

const { wrapper, content, destroy } = mountModal('<p>Hello</p>', document.body)
// later
destroy()
```

## Component types

The `component` argument accepts:

| Type | Description |
|---|---|
| `string` | HTML string — set as `innerHTML` |
| `HTMLElement` | Existing element — appended directly |
| `URL` | Loaded in an `<iframe>` |
| `(container: HTMLElement) => void \| (() => void)` | Render function (optionally returns cleanup) |

## Themes

Import a CSS theme alongside the library:

```ts
import 'kobiowu/themes/minimal.css'  // near-unstyled
import 'kobiowu/themes/clean.css'    // polished defaults
import 'kobiowu/themes/shadcn.css'   // shadcn/ui compatible
```

## Devtools

```ts
import { mountDevtools } from 'kobiowu'

const refs: OverlayRef[] = []
const dt = mountDevtools(() => refs, { position: 'bottom-right' })
dt.destroy()
```

## Lifecycle utilities (standalone)

```ts
import { watchEscape, trapFocus, lockScroll, AutoCloseTimer } from 'kobiowu'

const cleanup = watchEscape(() => console.log('escape pressed'))
const releaseFocus = trapFocus(containerEl)
const unlockScroll = lockScroll()

const timer = new AutoCloseTimer({ duration: 3000, onClose: () => {}, pauseOnHover: true, element: el })
timer.pause()
timer.resume()
timer.destroy()
```

## Extras (anchor-attached overlays)

```ts
import { mountTooltip, mountPopover } from 'kobiowu'

mountTooltip('<span>Helpful tip</span>', parent, { anchor: buttonEl, placement: 'top' })
mountPopover('<div>Rich content</div>', parent, { anchor: buttonEl, placement: 'bottom' })
```

## License

MIT
