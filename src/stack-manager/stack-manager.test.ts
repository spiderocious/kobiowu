import { describe, it, expect, beforeEach } from 'vitest'
import { StackManager } from './stack-manager'
import { DEFAULT_Z_INDEX } from '../portal'

function makeElement(): HTMLElement {
  return document.createElement('div')
}

describe('StackManager', () => {
  let sm: StackManager

  beforeEach(() => {
    sm = new StackManager()
  })

  it('push returns an entry with computed zIndex', () => {
    const el = makeElement()
    const entry = sm.push({ id: 'a', type: 'modal', priority: 0, isolate: false, element: el })
    expect(entry.zIndex).toBe(DEFAULT_Z_INDEX.modal + 0 * 10)
  })

  it('higher priority gets higher zIndex within the same type', () => {
    const el1 = makeElement()
    const el2 = makeElement()
    sm.push({ id: 'a', type: 'modal', priority: 0, isolate: false, element: el1 })
    sm.push({ id: 'b', type: 'modal', priority: 1, isolate: false, element: el2 })
    const a = sm.get('a')!
    const b = sm.get('b')!
    expect(b.zIndex).toBeGreaterThan(a.zIndex)
  })

  it('different types use their own base z-index', () => {
    const el1 = makeElement()
    const el2 = makeElement()
    sm.push({ id: 'modal', type: 'modal', priority: 0, isolate: false, element: el1 })
    sm.push({ id: 'toast', type: 'toast', priority: 0, isolate: false, element: el2 })
    expect(sm.get('modal')!.zIndex).toBe(DEFAULT_Z_INDEX.modal)
    expect(sm.get('toast')!.zIndex).toBe(DEFAULT_Z_INDEX.toast)
  })

  it('applies zIndex to element style on push', () => {
    const el = makeElement()
    sm.push({ id: 'x', type: 'alert', priority: 0, isolate: false, element: el })
    expect(el.style.zIndex).toBe(String(DEFAULT_Z_INDEX.alert))
  })

  it('remove deletes the entry', () => {
    const el = makeElement()
    sm.push({ id: 'r', type: 'modal', priority: 0, isolate: false, element: el })
    sm.remove('r')
    expect(sm.get('r')).toBeNull()
  })

  it('bringToFront raises an entry above others of same type', () => {
    const el1 = makeElement()
    const el2 = makeElement()
    sm.push({ id: 'a', type: 'modal', priority: 0, isolate: false, element: el1 })
    sm.push({ id: 'b', type: 'modal', priority: 1, isolate: false, element: el2 })
    sm.bringToFront('a')
    expect(sm.get('a')!.zIndex).toBeGreaterThan(sm.get('b')!.zIndex)
  })

  it('sendToBack lowers an entry below others of same type', () => {
    const el1 = makeElement()
    const el2 = makeElement()
    sm.push({ id: 'a', type: 'modal', priority: 0, isolate: false, element: el1 })
    sm.push({ id: 'b', type: 'modal', priority: 1, isolate: false, element: el2 })
    sm.sendToBack('b')
    expect(sm.get('b')!.zIndex).toBeLessThan(sm.get('a')!.zIndex)
  })

  it('setPriority updates z-index', () => {
    const el = makeElement()
    sm.push({ id: 'p', type: 'modal', priority: 0, isolate: false, element: el })
    sm.setPriority('p', 5)
    expect(sm.get('p')!.zIndex).toBe(DEFAULT_Z_INDEX.modal + 5 * 10)
  })

  it('isBlocked returns true when isolating overlay sits above', () => {
    const el1 = makeElement()
    const el2 = makeElement()
    sm.push({ id: 'lower', type: 'modal', priority: 0, isolate: false, element: el1 })
    sm.push({ id: 'blocker', type: 'alert', priority: 10, isolate: true, element: el2 })
    expect(sm.isBlocked('lower')).toBe(true)
    expect(sm.isBlocked('blocker')).toBe(false)
  })

  it('isBlocked returns false when no isolating overlay is above', () => {
    const el = makeElement()
    sm.push({ id: 'solo', type: 'modal', priority: 0, isolate: false, element: el })
    expect(sm.isBlocked('solo')).toBe(false)
  })

  it('getAll returns entries in ascending zIndex order', () => {
    const e1 = makeElement()
    const e2 = makeElement()
    const e3 = makeElement()
    sm.push({ id: 'c', type: 'modal', priority: 2, isolate: false, element: e3 })
    sm.push({ id: 'a', type: 'modal', priority: 0, isolate: false, element: e1 })
    sm.push({ id: 'b', type: 'modal', priority: 1, isolate: false, element: e2 })
    const all = sm.getAll()
    expect(all[0]!.id).toBe('a')
    expect(all[1]!.id).toBe('b')
    expect(all[2]!.id).toBe('c')
  })

  it('configure sets sharedBackdrop', () => {
    expect(sm.sharedBackdrop).toBe(false)
    sm.configure(true)
    expect(sm.sharedBackdrop).toBe(true)
  })

  it('bringToFront is a no-op for unknown id', () => {
    expect(() => sm.bringToFront('ghost')).not.toThrow()
  })

  it('sendToBack is a no-op for unknown id', () => {
    expect(() => sm.sendToBack('ghost')).not.toThrow()
  })

  it('setPriority is a no-op for unknown id', () => {
    expect(() => sm.setPriority('ghost', 5)).not.toThrow()
  })
})
