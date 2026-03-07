import { describe, it, expect, beforeEach } from 'vitest'
import { Backdrop, BackdropManager } from './backdrop'
import type { BackdropConfig } from './backdrop'

function makeConfig(overrides: Partial<BackdropConfig> = {}): BackdropConfig {
  return { type: 'dim', zIndex: 999, ...overrides }
}

describe('Backdrop', () => {
  it('creates a div with data-kb-backdrop attribute', () => {
    const b = new Backdrop(makeConfig({ type: 'blur' }))
    expect(b.element.tagName).toBe('DIV')
    expect(b.element.getAttribute('data-kb-backdrop')).toBe('blur')
  })

  it('is aria-hidden', () => {
    const b = new Backdrop(makeConfig())
    expect(b.element.getAttribute('aria-hidden')).toBe('true')
  })

  it('sets z-index from config', () => {
    const b = new Backdrop(makeConfig({ zIndex: 1099 }))
    expect(b.element.style.zIndex).toBe('1099')
  })

  it('dim type applies background and opacity', () => {
    const b = new Backdrop(makeConfig({ type: 'dim', opacity: 0.5 }))
    expect(b.element.style.cssText).toContain('background')
    expect(b.element.style.cssText).toContain('opacity')
  })

  it('blur type applies backdrop-filter', () => {
    const b = new Backdrop(makeConfig({ type: 'blur', blur: 8 }))
    expect(b.element.style.cssText).toContain('backdrop-filter')
  })

  it('frosted type applies backdrop-filter with saturate', () => {
    const b = new Backdrop(makeConfig({ type: 'frosted' }))
    expect(b.element.style.cssText).toContain('saturate')
  })

  it('none type sets pointer-events: none', () => {
    const b = new Backdrop(makeConfig({ type: 'none' }))
    expect(b.element.style.cssText).toContain('pointer-events: none')
  })

  it('show appends element to parent', () => {
    const parent = document.createElement('div')
    document.body.appendChild(parent)
    const b = new Backdrop(makeConfig())
    b.show(parent)
    expect(parent.contains(b.element)).toBe(true)
    parent.remove()
  })

  it('hide sets opacity to 0', () => {
    const b = new Backdrop(makeConfig({ type: 'dim' }))
    b.hide()
    expect(b.element.style.opacity).toBe('0')
  })

  it('remove detaches element from DOM', () => {
    const parent = document.createElement('div')
    document.body.appendChild(parent)
    const b = new Backdrop(makeConfig())
    b.show(parent)
    b.remove()
    expect(parent.contains(b.element)).toBe(false)
    parent.remove()
  })

  it('calls onClick when element is clicked', () => {
    let clicked = false
    const b = new Backdrop(makeConfig({ onClick: () => { clicked = true } }))
    b.element.click()
    expect(clicked).toBe(true)
  })
})

describe('BackdropManager', () => {
  let manager: BackdropManager
  let parent: HTMLElement

  beforeEach(() => {
    manager = new BackdropManager()
    parent = document.createElement('div')
    document.body.appendChild(parent)
  })

  it('createForOverlay returns null when backdrop is "none"', () => {
    const result = manager.createForOverlay('id1', { backdrop: 'none' }, 1000, parent)
    expect(result).toBeNull()
  })

  it('createForOverlay returns null when backdrop is omitted', () => {
    const result = manager.createForOverlay('id1', {}, 1000, parent)
    expect(result).toBeNull()
  })

  it('createForOverlay creates and appends backdrop', () => {
    const b = manager.createForOverlay('id2', { backdrop: 'dim' }, 1000, parent)
    expect(b).not.toBeNull()
    expect(parent.contains(b!.element)).toBe(true)
  })

  it('createForOverlay sets zIndex to overlay zIndex - 1', () => {
    const b = manager.createForOverlay('id3', { backdrop: 'dim' }, 1010, parent)
    expect(b!.element.style.zIndex).toBe('1009')
  })

  it('removeForOverlay removes the backdrop from DOM', () => {
    const b = manager.createForOverlay('id4', { backdrop: 'blur' }, 1000, parent)
    manager.removeForOverlay('id4')
    expect(parent.contains(b!.element)).toBe(false)
  })

  it('removeForOverlay is a no-op for unknown id', () => {
    expect(() => manager.removeForOverlay('ghost')).not.toThrow()
  })

  it('get returns backdrop by id', () => {
    const b = manager.createForOverlay('id5', { backdrop: 'fade' }, 1000, parent)
    expect(manager.get('id5')).toBe(b)
  })

  it('shared backdrop is created once and removed when last ref releases', () => {
    manager.createShared({ backdrop: 'dim' }, 1000, parent)
    manager.createShared({ backdrop: 'dim' }, 1000, parent)
    expect(parent.querySelectorAll('[data-kb-backdrop]')).toHaveLength(1)
    manager.releaseShared()
    expect(parent.querySelectorAll('[data-kb-backdrop]')).toHaveLength(1)
    manager.releaseShared()
    expect(parent.querySelectorAll('[data-kb-backdrop]')).toHaveLength(0)
  })
})
