import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PortalManager, DEFAULT_Z_INDEX } from './portal'

describe('PortalManager', () => {
  let manager: PortalManager

  beforeEach(() => {
    manager = new PortalManager()
  })

  afterEach(() => {
    manager.destroy()
  })

  it('creates a container appended to document.body by default', () => {
    const container = manager.getContainer('modal')
    expect(document.body.contains(container)).toBe(true)
  })

  it('returns the same container instance on repeated calls', () => {
    const a = manager.getContainer('toast')
    const b = manager.getContainer('toast')
    expect(a).toBe(b)
  })

  it('creates separate containers per overlay type', () => {
    const modal = manager.getContainer('modal')
    const toast = manager.getContainer('toast')
    expect(modal).not.toBe(toast)
  })

  it('sets correct data attribute on container', () => {
    const container = manager.getContainer('drawer')
    expect(container.getAttribute('data-kb-container')).toBe('drawer')
  })

  it('applies default prefix class names', () => {
    const container = manager.getContainer('alert')
    expect(container.className).toContain('kb-container')
    expect(container.className).toContain('kb-container--alert')
  })

  it('applies custom prefix after configure()', () => {
    manager.configure({ containerPrefix: 'myapp' })
    const container = manager.getContainer('modal')
    expect(container.className).toContain('myapp-container')
  })

  it('applies correct z-index from DEFAULT_Z_INDEX', () => {
    const container = manager.getContainer('alert')
    expect(container.style.zIndex).toBe(String(DEFAULT_Z_INDEX.alert))
  })

  it('removeContainer removes the element from the DOM', () => {
    const container = manager.getContainer('tooltip')
    expect(document.body.contains(container)).toBe(true)
    manager.removeContainer('tooltip')
    expect(document.body.contains(container)).toBe(false)
  })

  it('removeContainer is a no-op for unknown type', () => {
    expect(() => manager.removeContainer('popover')).not.toThrow()
  })

  it('destroy removes all containers', () => {
    const modal = manager.getContainer('modal')
    const toast = manager.getContainer('toast')
    manager.destroy()
    expect(document.body.contains(modal)).toBe(false)
    expect(document.body.contains(toast)).toBe(false)
  })

  it('respects custom portalTarget element', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    manager.configure({ portalTarget: target })
    const container = manager.getContainer('sheet')
    expect(target.contains(container)).toBe(true)
    target.remove()
  })

  it('throws if portalTarget selector not found', () => {
    expect(() => manager.configure({ portalTarget: '#does-not-exist' })).toThrow(
      '[kobiowu] portalTarget "#does-not-exist" not found in DOM',
    )
  })

  it('DEFAULT_Z_INDEX has correct base values', () => {
    expect(DEFAULT_Z_INDEX.modal).toBe(1000)
    expect(DEFAULT_Z_INDEX.toast).toBe(1100)
    expect(DEFAULT_Z_INDEX.alert).toBe(1200)
    expect(DEFAULT_Z_INDEX.drawer).toBe(1000)
  })
})
