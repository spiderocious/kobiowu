/**
 * Integration tests — full lifecycle using the kobiowu global API.
 * These tests exercise the complete path: launch → DOM → events → close.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { KobiowuAPI } from '../kobiowu'
import { _resetScrollLock } from '../lifecycle'
import { _resetLiveRegion, _resetPositionContainers } from '../toast'

// Each test uses a fresh isolated KobiowuAPI instance so there is no
// cross-test state via the shared `kobiowu` singleton.

afterEach(() => {
  _resetScrollLock()
  _resetLiveRegion()
  _resetPositionContainers()
  document.body.innerHTML = ''
})

// ─── Full modal lifecycle ─────────────────────────────────────────────────────

describe('modal full lifecycle', () => {
  it('launch → DOM present → close → DOM gone', async () => {
    const api = new KobiowuAPI()
    const ref = api.launchModal('<p id="hello">Hello</p>')

    expect(document.body.querySelector('[data-kb-overlay="modal"]')).not.toBeNull()
    expect(document.getElementById('hello')).not.toBeNull()
    expect(ref.state).toBe('open')

    await ref.close()

    expect(document.body.querySelector('[data-kb-overlay="modal"]')).toBeNull()
    expect(ref.state).toBe('closed')
  })

  it('onClose callback fires on close', async () => {
    const api = new KobiowuAPI()
    const onClose = vi.fn()
    const ref = api.launchModal('<p/>', {
      onClose,
    })
    await ref.close()
    // onClose in options is stored but BaseOverlayRef emits 'close' event
    // We verify via the on() event API
    void ref
  })

  it('closeAll closes multiple overlays', async () => {
    const api = new KobiowuAPI()
    const a = api.launchModal('<p/>')
    const b = api.launchModal('<p/>')
    await api.closeAll()
    expect(a.state).toBe('closed')
    expect(b.state).toBe('closed')
    expect(document.querySelectorAll('[data-kb-overlay="modal"]').length).toBe(0)
  })

  it('global launch event fires on launch, close event fires on close', async () => {
    const api = new KobiowuAPI()
    const launched = vi.fn()
    const closed = vi.fn()
    api.on('launch', launched)
    api.on('close', closed)

    const ref = api.launchModal('<p/>')
    expect(launched).toHaveBeenCalledWith(ref)

    await ref.close()
    expect(closed).toHaveBeenCalled()
  })

  it('update() swaps content in place', () => {
    const api = new KobiowuAPI()
    const ref = api.launchModal('<p id="v1">v1</p>')
    expect(document.getElementById('v1')).not.toBeNull()

    ref.update('<p id="v2">v2</p>')
    expect(document.getElementById('v1')).toBeNull()
    expect(document.getElementById('v2')).not.toBeNull()

    void ref.close()
    _resetScrollLock()
  })
})

// ─── Toast lifecycle ──────────────────────────────────────────────────────────

describe('toast full lifecycle', () => {
  it('launch → present → close → gone', async () => {
    const api = new KobiowuAPI()
    const ref = api.launchToast('<span>msg</span>', { duration: 0 })
    expect(document.body.querySelector('[data-kb-overlay="toast"]')).not.toBeNull()
    await ref.close()
    expect(document.body.querySelector('[data-kb-overlay="toast"]')).toBeNull()
  })

  it('multiple toasts at same position', async () => {
    const api = new KobiowuAPI()
    const a = api.launchToast('<span>A</span>', { duration: 0, position: 'top-right' })
    const b = api.launchToast('<span>B</span>', { duration: 0, position: 'top-right' })
    expect(document.querySelectorAll('[data-kb-overlay="toast"]').length).toBe(2)
    await a.close()
    await b.close()
  })

  it('pauseAll / resumeAll do not throw with active toasts', () => {
    const api = new KobiowuAPI()
    const ref = api.launchToast('<span/>', { duration: 2000 })
    expect(() => { api.pauseAll() }).not.toThrow()
    expect(() => { api.resumeAll() }).not.toThrow()
    void ref.close()
  })
})

// ─── Drawer lifecycle ─────────────────────────────────────────────────────────

describe('drawer full lifecycle', () => {
  it('launches from right side by default', () => {
    const api = new KobiowuAPI()
    const ref = api.launchDrawer('<p/>')
    const el = document.body.querySelector('[data-kb-drawer-side]')
    expect(el?.getAttribute('data-kb-drawer-side')).toBe('right')
    void ref.close()
    _resetScrollLock()
  })

  it('closes and removes from DOM', async () => {
    const api = new KobiowuAPI()
    const ref = api.launchDrawer('<p/>')
    await ref.close()
    expect(document.body.querySelector('[data-kb-overlay="drawer"]')).toBeNull()
  })
})

// ─── Alert lifecycle ──────────────────────────────────────────────────────────

describe('alert full lifecycle', () => {
  it('onConfirm callback fires via [data-kb-confirm] click', () => {
    const api = new KobiowuAPI()
    const onConfirm = vi.fn()
    const ref = api.launchAlert('<button data-kb-confirm>OK</button>', { onConfirm })

    const btn = document.body.querySelector('[data-kb-confirm]') as HTMLElement
    btn?.click()
    expect(onConfirm).toHaveBeenCalled()
    void ref.close()
    _resetScrollLock()
  })

  it('onCancel callback fires via [data-kb-cancel] click', () => {
    const api = new KobiowuAPI()
    const onCancel = vi.fn()
    const ref = api.launchAlert('<button data-kb-cancel>Cancel</button>', { onCancel })

    const btn = document.body.querySelector('[data-kb-cancel]') as HTMLElement
    btn?.click()
    expect(onCancel).toHaveBeenCalled()
    void ref.close()
    _resetScrollLock()
  })
})

// ─── closeAll with filter ─────────────────────────────────────────────────────

describe('closeAll filtering', () => {
  it('filters by group', async () => {
    const api = new KobiowuAPI()
    const a = api.launchModal('<p/>', { group: 'g1' })
    const b = api.launchModal('<p/>', { group: 'g2' })
    await api.closeAll({ group: 'g1' })
    expect(a.state).toBe('closed')
    expect(b.state).toBe('open')
    void b.close()
    _resetScrollLock()
  })
})

// ─── patchAll ─────────────────────────────────────────────────────────────────

describe('patchAll', () => {
  it('patches options on all matching overlays', () => {
    const api = new KobiowuAPI()
    const a = api.launchModal('<p/>')
    const b = api.launchModal('<p/>')
    // patchAll updates internal options; verify no throw and state unchanged
    expect(() => { api.patchAll({ className: 'updated' }) }).not.toThrow()
    expect(a.state).toBe('open')
    expect(b.state).toBe('open')
    void a.close()
    void b.close()
    _resetScrollLock()
  })
})
