import { describe, it, expect, afterEach, vi } from 'vitest'
import { mountDevtools } from './devtools'
import type { OverlayRef, OverlayState, OverlayType } from '../types'

afterEach(() => {
  document.body.innerHTML = ''
})

function makeRef(id: string, type: OverlayType = 'modal', state: OverlayState = 'open'): OverlayRef {
  return {
    id,
    type,
    state,
    close: async () => {},
    open: async () => {},
    toggle: async () => {},
    focus: () => {},
    patch: () => {},
    moveTo: () => {},
    resetPosition: () => {},
    getPosition: () => ({ x: 0, y: 0 }),
    update: () => {},
    getData: () => ({}),
    setData: () => {},
    setType: () => {},
    setProgress: () => {},
    sendToBack: () => {},
    bringToFront: () => {},
    setPriority: () => {},
    on: () => () => {},
    once: () => {},
    off: () => {},
    element: null,
    contentElement: null,
  }
}

describe('mountDevtools', () => {
  it('mounts panel to document.body', () => {
    const { destroy } = mountDevtools(() => [])
    expect(document.body.querySelector('[data-kb-devtools]')).not.toBeNull()
    destroy()
  })

  it('shows "No active overlays" when list is empty', () => {
    const { destroy } = mountDevtools(() => [])
    const panel = document.body.querySelector('[data-kb-devtools]')!
    expect(panel.textContent).toContain('No active overlays')
    destroy()
  })

  it('renders a row per overlay', () => {
    const refs = [makeRef('modal-1', 'modal'), makeRef('toast-1', 'toast')]
    const { destroy } = mountDevtools(() => refs)
    const panel = document.body.querySelector('[data-kb-devtools]')!
    expect(panel.textContent).toContain('modal-1')
    expect(panel.textContent).toContain('toast-1')
    destroy()
  })

  it('shows overlay type badge', () => {
    const refs = [makeRef('m1', 'drawer')]
    const { destroy } = mountDevtools(() => refs)
    const panel = document.body.querySelector('[data-kb-devtools]')!
    expect(panel.textContent).toContain('drawer')
    destroy()
  })

  it('shows overlay state', () => {
    const refs = [makeRef('a1', 'alert', 'opening')]
    const { destroy } = mountDevtools(() => refs)
    const panel = document.body.querySelector('[data-kb-devtools]')!
    expect(panel.textContent).toContain('opening')
    destroy()
  })

  it('destroy removes panel from DOM', () => {
    const { destroy } = mountDevtools(() => [])
    destroy()
    expect(document.body.querySelector('[data-kb-devtools]')).toBeNull()
  })

  it('refresh re-renders the list', () => {
    let refs: OverlayRef[] = []
    const { refresh, destroy } = mountDevtools(() => refs)
    const panel = document.body.querySelector('[data-kb-devtools]')!
    expect(panel.textContent).toContain('No active overlays')

    refs = [makeRef('new-1')]
    refresh()
    expect(panel.textContent).toContain('new-1')
    destroy()
  })

  it('respects position option (top-left)', () => {
    const { destroy } = mountDevtools(() => [], { position: 'top-left' })
    const panel = document.body.querySelector<HTMLElement>('[data-kb-devtools]')!
    expect(panel.style.cssText).toContain('top:')
    expect(panel.style.cssText).toContain('left:')
    destroy()
  })

  it('respects custom zIndex', () => {
    const { destroy } = mountDevtools(() => [], { zIndex: 12345 })
    const panel = document.body.querySelector<HTMLElement>('[data-kb-devtools]')!
    expect(panel.style.zIndex).toBe('12345')
    destroy()
  })

  it('close button removes the panel', () => {
    mountDevtools(() => [])
    const panel = document.body.querySelector('[data-kb-devtools]')!
    const btn = panel.querySelector('button')!
    btn.click()
    expect(document.body.querySelector('[data-kb-devtools]')).toBeNull()
  })

  it('auto-refresh polls via setInterval', () => {
    vi.useFakeTimers()
    const refs: OverlayRef[] = []
    const { destroy } = mountDevtools(() => refs)
    // advance time — should not throw
    expect(() => { vi.advanceTimersByTime(2000) }).not.toThrow()
    destroy()
    vi.useRealTimers()
  })
})
