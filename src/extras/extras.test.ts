import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountTooltip, mountPopover, mountSheet, mountSpotlight } from './extras'
import { _resetScrollLock } from '../lifecycle'

let parent: HTMLElement

afterEach(() => {
  parent?.remove()
  _resetScrollLock()
})

function setup() {
  parent = document.createElement('div')
  document.body.appendChild(parent)
  return parent
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

describe('mountTooltip', () => {
  it('appends wrapper with data-kb-overlay=tooltip', () => {
    const { destroy } = mountTooltip('<span>tip</span>', setup())
    expect(parent.querySelector('[data-kb-overlay="tooltip"]')).not.toBeNull()
    destroy()
  })

  it('has role=tooltip', () => {
    const { wrapper, destroy } = mountTooltip('<span/>', setup())
    expect(wrapper.getAttribute('role')).toBe('tooltip')
    destroy()
  })

  it('positions near anchor (top placement)', () => {
    const anchor = document.createElement('button')
    anchor.style.cssText = 'position:absolute;top:100px;left:100px;width:80px;height:40px'
    document.body.appendChild(anchor)
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      top: 100, bottom: 140, left: 100, right: 180, width: 80, height: 40, x: 100, y: 100, toJSON: () => ({}),
    } as DOMRect)
    const { wrapper, destroy } = mountTooltip('<span/>', setup(), { anchor, placement: 'top' })
    expect(wrapper.style.transform).toContain('-100%')
    destroy()
    anchor.remove()
  })

  it('applies className', () => {
    const { wrapper, destroy } = mountTooltip('<span/>', setup(), { className: 'tip' })
    expect(wrapper.classList.contains('tip')).toBe(true)
    destroy()
  })

  it('destroy removes wrapper', () => {
    const { wrapper, destroy } = mountTooltip('<span/>', setup())
    destroy()
    expect(parent.contains(wrapper)).toBe(false)
  })
})

// ─── Popover ──────────────────────────────────────────────────────────────────

describe('mountPopover', () => {
  it('appends wrapper with data-kb-overlay=popover', () => {
    const { destroy } = mountPopover('<div>pop</div>', setup())
    expect(parent.querySelector('[data-kb-overlay="popover"]')).not.toBeNull()
    destroy()
  })

  it('has role=dialog', () => {
    const { wrapper, destroy } = mountPopover('<div/>', setup())
    expect(wrapper.getAttribute('role')).toBe('dialog')
    destroy()
  })

  it('positions near anchor (bottom placement)', () => {
    const anchor = document.createElement('button')
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      top: 50, bottom: 80, left: 200, right: 280, width: 80, height: 30, x: 200, y: 50, toJSON: () => ({}),
    } as DOMRect)
    document.body.appendChild(anchor)
    const { wrapper, destroy } = mountPopover('<div/>', setup(), { anchor, placement: 'bottom' })
    expect(wrapper.style.top).not.toBe('')
    destroy()
    anchor.remove()
  })

  it('destroy removes wrapper', () => {
    const { wrapper, destroy } = mountPopover('<div/>', setup())
    destroy()
    expect(parent.contains(wrapper)).toBe(false)
  })
})

// ─── Sheet ────────────────────────────────────────────────────────────────────

describe('mountSheet', () => {
  it('appends wrapper with data-kb-overlay=sheet', () => {
    const { destroy } = mountSheet('<div/>', setup())
    expect(parent.querySelector('[data-kb-overlay="sheet"]')).not.toBeNull()
    destroy()
  })

  it('has role=dialog and aria-modal=true', () => {
    const { wrapper, destroy } = mountSheet('<div/>', setup())
    expect(wrapper.getAttribute('role')).toBe('dialog')
    expect(wrapper.getAttribute('aria-modal')).toBe('true')
    destroy()
  })

  it('defaults height to 50vh', () => {
    const { content, destroy } = mountSheet('<div/>', setup())
    expect(content.style.height).toBe('50vh')
    destroy()
  })

  it('applies defaultSnapPoint as initial height', () => {
    const { content, destroy } = mountSheet('<div/>', setup(), { defaultSnapPoint: '40%' })
    expect(content.style.height).toBe('40%')
    destroy()
  })

  it('snapTo changes height', () => {
    const { content, snapTo, destroy } = mountSheet('<div/>', setup())
    snapTo('80%')
    expect(content.style.height).toBe('80%')
    destroy()
  })

  it('locks scroll on mount', () => {
    const { destroy } = mountSheet('<div/>', setup())
    expect(document.body.style.overflow).toBe('hidden')
    destroy()
  })

  it('unlocks scroll on destroy', () => {
    const { destroy } = mountSheet('<div/>', setup())
    destroy()
    expect(document.body.style.overflow).toBe('')
  })

  it('destroy removes wrapper', () => {
    const { wrapper, destroy } = mountSheet('<div/>', setup())
    destroy()
    expect(parent.contains(wrapper)).toBe(false)
  })
})

// ─── Spotlight ────────────────────────────────────────────────────────────────

describe('mountSpotlight', () => {
  it('appends wrapper with data-kb-overlay=spotlight', () => {
    const { destroy } = mountSpotlight('<div/>', setup())
    expect(parent.querySelector('[data-kb-overlay="spotlight"]')).not.toBeNull()
    destroy()
  })

  it('has role=dialog and aria-modal=true', () => {
    const { wrapper, destroy } = mountSpotlight('<div/>', setup())
    expect(wrapper.getAttribute('role')).toBe('dialog')
    expect(wrapper.getAttribute('aria-modal')).toBe('true')
    destroy()
  })

  it('applies dim background by default', () => {
    const { wrapper, destroy } = mountSpotlight('<div/>', setup())
    expect(wrapper.style.background).toMatch(/rgba\(0,\s*0,\s*0,\s*0\.7\)/)
    destroy()
  })

  it('dim:false removes background', () => {
    const { wrapper, destroy } = mountSpotlight('<div/>', setup(), { dim: false })
    expect(wrapper.style.background).toBe('')
    destroy()
  })

  it('locks scroll on mount', () => {
    const { destroy } = mountSpotlight('<div/>', setup())
    expect(document.body.style.overflow).toBe('hidden')
    destroy()
  })

  it('unlocks scroll on destroy', () => {
    const { destroy } = mountSpotlight('<div/>', setup())
    destroy()
    expect(document.body.style.overflow).toBe('')
  })

  it('destroy removes wrapper', () => {
    const { wrapper, destroy } = mountSpotlight('<div/>', setup())
    destroy()
    expect(parent.contains(wrapper)).toBe(false)
  })
})
