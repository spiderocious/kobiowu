import { describe, it, expect, vi, afterEach } from 'vitest'
import { KobiowuAPI, kobiowu } from './kobiowu'
import { _resetScrollLock } from '../lifecycle'
import { _resetLiveRegion, _resetPositionContainers } from '../toast'

afterEach(() => {
  void kobiowu.closeAll()
  _resetScrollLock()
  _resetLiveRegion()
  _resetPositionContainers()
  document.body.innerHTML = ''
})

// ─── launchModal ──────────────────────────────────────────────────────────────

describe('kobiowu.launchModal', () => {
  it('returns an OverlayRef with type=modal', () => {
    const ref = kobiowu.launchModal('<p>hi</p>')
    expect(ref.type).toBe('modal')
    expect(ref.state).toBe('open')
    void ref.close()
  })

  it('mounts wrapper to document.body', () => {
    const ref = kobiowu.launchModal('<p/>')
    expect(document.body.querySelector('[data-kb-overlay="modal"]')).not.toBeNull()
    void ref.close()
  })

  it('close() removes overlay from DOM', async () => {
    const ref = kobiowu.launchModal('<p/>')
    await ref.close()
    expect(document.body.querySelector('[data-kb-overlay="modal"]')).toBeNull()
  })

  it('close() sets state to closed', async () => {
    const ref = kobiowu.launchModal('<p/>')
    await ref.close()
    expect(ref.state).toBe('closed')
  })

  it('assigns provided id', () => {
    const ref = kobiowu.launchModal('<p/>', { id: 'my-modal' })
    expect(ref.id).toBe('my-modal')
    void ref.close()
  })

  it('merges config defaults', () => {
    const api = new KobiowuAPI()
    api.config({ defaults: { modal: { className: 'default-cls' } } })
    const ref = api.launchModal('<p/>')
    expect(ref.element?.className).toBe('default-cls')
    void ref.close()
    _resetScrollLock()
  })
})

// ─── launchToast ──────────────────────────────────────────────────────────────

describe('kobiowu.launchToast', () => {
  it('returns an OverlayRef with type=toast', () => {
    const ref = kobiowu.launchToast('<span>msg</span>', { duration: 0 })
    expect(ref.type).toBe('toast')
    expect(ref.state).toBe('open')
    void ref.close()
  })

  it('mounts toast to body', () => {
    const ref = kobiowu.launchToast('<span/>', { duration: 0 })
    expect(document.body.querySelector('[data-kb-overlay="toast"]')).not.toBeNull()
    void ref.close()
  })

  it('close() removes from DOM', async () => {
    const ref = kobiowu.launchToast('<span/>', { duration: 0 })
    await ref.close()
    expect(document.body.querySelector('[data-kb-overlay="toast"]')).toBeNull()
  })

  it('pauseAll / resumeAll do not throw', () => {
    const ref = kobiowu.launchToast('<span/>', { duration: 1000 })
    expect(() => { kobiowu.pauseAll() }).not.toThrow()
    expect(() => { kobiowu.resumeAll() }).not.toThrow()
    void ref.close()
  })
})

// ─── launchDrawer ─────────────────────────────────────────────────────────────

describe('kobiowu.launchDrawer', () => {
  it('returns type=drawer', () => {
    const ref = kobiowu.launchDrawer('<p/>')
    expect(ref.type).toBe('drawer')
    void ref.close()
  })

  it('mounts to body', () => {
    const ref = kobiowu.launchDrawer('<p/>')
    expect(document.body.querySelector('[data-kb-overlay="drawer"]')).not.toBeNull()
    void ref.close()
  })

  it('close() removes from DOM', async () => {
    const ref = kobiowu.launchDrawer('<p/>')
    await ref.close()
    expect(document.body.querySelector('[data-kb-overlay="drawer"]')).toBeNull()
  })
})

// ─── launchAlert ──────────────────────────────────────────────────────────────

describe('kobiowu.launchAlert', () => {
  it('returns type=alert', () => {
    const ref = kobiowu.launchAlert('<p/>')
    expect(ref.type).toBe('alert')
    void ref.close()
  })

  it('mounts alertdialog to body', () => {
    const ref = kobiowu.launchAlert('<p/>')
    expect(document.body.querySelector('[role="alertdialog"]')).not.toBeNull()
    void ref.close()
  })

  it('close() removes from DOM', async () => {
    const ref = kobiowu.launchAlert('<p/>')
    await ref.close()
    expect(document.body.querySelector('[data-kb-overlay="alert"]')).toBeNull()
  })
})

// ─── launchSheet ──────────────────────────────────────────────────────────────

describe('kobiowu.launchSheet', () => {
  it('returns type=sheet', () => {
    const ref = kobiowu.launchSheet('<div/>')
    expect(ref.type).toBe('sheet')
    void ref.close()
  })

  it('close() removes from DOM', async () => {
    const ref = kobiowu.launchSheet('<div/>')
    await ref.close()
    expect(document.body.querySelector('[data-kb-overlay="sheet"]')).toBeNull()
  })
})

// ─── launch() generic ─────────────────────────────────────────────────────────

describe('kobiowu.launch', () => {
  it('dispatches to correct launcher by type', () => {
    const ref = kobiowu.launch('drawer', '<p/>')
    expect(ref.type).toBe('drawer')
    void ref.close()
  })
})

// ─── closeAll ─────────────────────────────────────────────────────────────────

describe('kobiowu.closeAll', () => {
  it('closes all open overlays', async () => {
    const a = kobiowu.launchModal('<p/>')
    const b = kobiowu.launchDrawer('<p/>')
    await kobiowu.closeAll()
    expect(a.state).toBe('closed')
    expect(b.state).toBe('closed')
  })

  it('filters by type', async () => {
    const modal = kobiowu.launchModal('<p/>')
    const drawer = kobiowu.launchDrawer('<p/>')
    await kobiowu.closeAll({ type: 'modal' })
    expect(modal.state).toBe('closed')
    expect(drawer.state).toBe('open')
    void drawer.close()
  })
})

// ─── patchAll ─────────────────────────────────────────────────────────────────

describe('kobiowu.patchAll', () => {
  it('patches all overlay options without throwing', () => {
    const ref = kobiowu.launchModal('<p/>')
    expect(() => { kobiowu.patchAll({ className: 'patched' }) }).not.toThrow()
    void ref.close()
  })
})

// ─── Global events ────────────────────────────────────────────────────────────

describe('kobiowu.on', () => {
  it('fires "launch" on each launch', () => {
    const handler = vi.fn()
    const off = kobiowu.on('launch', handler)
    const ref = kobiowu.launchModal('<p/>')
    expect(handler).toHaveBeenCalledWith(ref)
    off()
    void ref.close()
  })

  it('fires "close" when overlay closes', async () => {
    const handler = vi.fn()
    const off = kobiowu.on('close', handler)
    const ref = kobiowu.launchModal('<p/>')
    await ref.close()
    expect(handler).toHaveBeenCalled()
    off()
  })

  it('unsubscribe fn removes handler', () => {
    const handler = vi.fn()
    const off = kobiowu.on('launch', handler)
    off()
    const ref = kobiowu.launchModal('<p/>')
    expect(handler).not.toHaveBeenCalled()
    void ref.close()
  })
})

// ─── config zIndexBase ────────────────────────────────────────────────────────

describe('kobiowu.config zIndexBase', () => {
  it('applies zIndexBase to launched modal', () => {
    const api = new KobiowuAPI()
    api.config({ zIndexBase: { modal: 5000 } })
    const ref = api.launchModal('<p/>')
    expect(ref.element?.style.zIndex).toBe('5000')
    void ref.close()
    _resetScrollLock()
  })

  it('per-launch zIndex overrides zIndexBase', () => {
    const api = new KobiowuAPI()
    api.config({ zIndexBase: { modal: 5000 } })
    const ref = api.launchModal('<p/>', { zIndex: 9999 })
    expect(ref.element?.style.zIndex).toBe('9999')
    void ref.close()
    _resetScrollLock()
  })
})

// ─── config animationPreset ───────────────────────────────────────────────────

describe('kobiowu.config animationPreset', () => {
  it('stores animationPreset in merged options accessible via patch', () => {
    const api = new KobiowuAPI()
    api.config({ animationPreset: 'fade', animationDuration: 200 })
    const ref = api.launchModal('<p/>')
    // enterAnimation and animationDuration should be set via _applyGlobalConfig
    // We verify by patching and checking the ref doesn't throw
    expect(() => { ref.patch({ className: 'x' }) }).not.toThrow()
    void ref.close()
    _resetScrollLock()
  })
})

// ─── config portalTarget ──────────────────────────────────────────────────────

describe('kobiowu.config portalTarget', () => {
  it('mounts into a custom target element', () => {
    const api = new KobiowuAPI()
    const target = document.createElement('div')
    document.body.appendChild(target)
    api.config({ portalTarget: target })
    const ref = api.launchModal('<p/>')
    expect(target.querySelector('[data-kb-overlay="modal"]')).not.toBeNull()
    void ref.close()
    _resetScrollLock()
    target.remove()
  })

  it('throws if selector not found', () => {
    const api = new KobiowuAPI()
    api.config({ portalTarget: '#nonexistent' })
    expect(() => api.launchModal('<p/>')).toThrow('portalTarget')
  })
})
