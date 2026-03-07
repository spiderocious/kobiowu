import { describe, it, expect, beforeEach } from 'vitest'
import { OverlayRegistry, generateId } from './registry'
import type { OverlayRef, OverlayType } from './types'

function makeRef(overrides: Partial<OverlayRef> & { id: string; type: OverlayType; _group?: string }): OverlayRef {
  return {
    state: 'open',
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
    ...overrides,
  } as OverlayRef & { _group?: string }
}

describe('generateId', () => {
  it('generates unique IDs', () => {
    const a = generateId('modal')
    const b = generateId('modal')
    expect(a).not.toBe(b)
  })

  it('includes the overlay type in the ID', () => {
    expect(generateId('toast')).toContain('toast')
    expect(generateId('drawer')).toContain('drawer')
  })
})

describe('OverlayRegistry', () => {
  let reg: OverlayRegistry

  beforeEach(() => {
    reg = new OverlayRegistry()
  })

  it('registers and retrieves a ref', () => {
    const ref = makeRef({ id: 'test-1', type: 'modal' })
    reg.register(ref)
    expect(reg.get('test-1')).toBe(ref)
  })

  it('returns null for unknown id', () => {
    expect(reg.get('nope')).toBeNull()
  })

  it('unregisters a ref', () => {
    const ref = makeRef({ id: 'test-2', type: 'toast' })
    reg.register(ref)
    reg.unregister('test-2')
    expect(reg.get('test-2')).toBeNull()
  })

  it('isOpen returns true for open/opening states', () => {
    const open = makeRef({ id: 'open', type: 'modal', state: 'open' })
    const opening = makeRef({ id: 'opening', type: 'modal', state: 'opening' })
    const closed = makeRef({ id: 'closed', type: 'modal', state: 'closed' })
    reg.register(open)
    reg.register(opening)
    reg.register(closed)

    expect(reg.isOpen('open')).toBe(true)
    expect(reg.isOpen('opening')).toBe(true)
    expect(reg.isOpen('closed')).toBe(false)
    expect(reg.isOpen('unknown')).toBe(false)
  })

  it('getAll returns all refs when no filter', () => {
    reg.register(makeRef({ id: 'a', type: 'modal' }))
    reg.register(makeRef({ id: 'b', type: 'toast' }))
    expect(reg.getAll()).toHaveLength(2)
  })

  it('getAll filters by type', () => {
    reg.register(makeRef({ id: 'a', type: 'modal' }))
    reg.register(makeRef({ id: 'b', type: 'toast' }))
    reg.register(makeRef({ id: 'c', type: 'modal' }))
    const modals = reg.getAll({ type: 'modal' })
    expect(modals).toHaveLength(2)
    expect(modals.every((r) => r.type === 'modal')).toBe(true)
  })

  it('getAll filters by group', () => {
    const a = makeRef({ id: 'a', type: 'modal', _group: 'grp1' })
    const b = makeRef({ id: 'b', type: 'toast', _group: 'grp2' })
    const c = makeRef({ id: 'c', type: 'drawer', _group: 'grp1' })
    reg.register(a)
    reg.register(b)
    reg.register(c)
    expect(reg.getAll({ group: 'grp1' })).toHaveLength(2)
    expect(reg.getAll({ group: 'grp2' })).toHaveLength(1)
  })

  it('size reflects registered count', () => {
    expect(reg.size).toBe(0)
    reg.register(makeRef({ id: 'x', type: 'alert' }))
    expect(reg.size).toBe(1)
    reg.unregister('x')
    expect(reg.size).toBe(0)
  })

  it('has returns correct boolean', () => {
    const ref = makeRef({ id: 'z', type: 'drawer' })
    expect(reg.has('z')).toBe(false)
    reg.register(ref)
    expect(reg.has('z')).toBe(true)
  })

  it('clear removes all entries', () => {
    reg.register(makeRef({ id: 'a', type: 'modal' }))
    reg.register(makeRef({ id: 'b', type: 'toast' }))
    reg.clear()
    expect(reg.size).toBe(0)
  })
})
