import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BaseOverlayRef } from './overlay-ref'
import type { BaseOverlayRefInit } from './overlay-ref'

function makeInit(overrides: Partial<BaseOverlayRefInit> = {}): BaseOverlayRefInit {
  const element = document.createElement('div')
  const contentElement = document.createElement('div')
  return {
    id: 'test-id',
    type: 'modal',
    element,
    contentElement,
    options: {},
    onPatch: vi.fn(),
    onClose: vi.fn().mockResolvedValue(undefined),
    onOpen: vi.fn().mockResolvedValue(undefined),
    onUpdate: vi.fn(),
    onMoveTo: vi.fn(),
    onResetPosition: vi.fn(),
    onGetPosition: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    onSetPriority: vi.fn(),
    onBringToFront: vi.fn(),
    onSendToBack: vi.fn(),
    ...overrides,
  }
}

describe('BaseOverlayRef', () => {
  let ref: BaseOverlayRef

  beforeEach(() => {
    ref = new BaseOverlayRef(makeInit())
    ref._setState('open')
  })

  // ─── Identity ───────────────────────────────────────────────────────────────

  it('exposes id and type', () => {
    expect(ref.id).toBe('test-id')
    expect(ref.type).toBe('modal')
  })

  it('exposes group', () => {
    const r = new BaseOverlayRef(makeInit({ group: 'grp' }))
    expect(r._group).toBe('grp')
  })

  // ─── State ──────────────────────────────────────────────────────────────────

  it('initial state is opening then open', () => {
    const r = new BaseOverlayRef(makeInit())
    expect(r.state).toBe('opening')
    r._setState('open')
    expect(r.state).toBe('open')
  })

  // ─── close ──────────────────────────────────────────────────────────────────

  it('close transitions to closing then closed', async () => {
    await ref.close()
    expect(ref.state).toBe('closed')
  })

  it('close calls onClose callback', async () => {
    const onClose = vi.fn().mockResolvedValue(undefined)
    const r = new BaseOverlayRef(makeInit({ onClose }))
    r._setState('open')
    await r.close('user')
    expect(onClose).toHaveBeenCalledWith('user')
  })

  it('close is a no-op if already closing/closed', async () => {
    const onClose = vi.fn().mockResolvedValue(undefined)
    const r = new BaseOverlayRef(makeInit({ onClose }))
    r._setState('closed')
    await r.close()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('onBeforeClose returning false cancels close', async () => {
    const onClose = vi.fn().mockResolvedValue(undefined)
    const r = new BaseOverlayRef(
      makeInit({ onClose, options: { onBeforeClose: async () => false } }),
    )
    r._setState('open')
    await r.close()
    expect(onClose).not.toHaveBeenCalled()
    expect(r.state).toBe('open')
  })

  it('onBeforeClose returning true allows close', async () => {
    const onClose = vi.fn().mockResolvedValue(undefined)
    const r = new BaseOverlayRef(
      makeInit({ onClose, options: { onBeforeClose: async () => true } }),
    )
    r._setState('open')
    await r.close()
    expect(onClose).toHaveBeenCalled()
  })

  // ─── open ───────────────────────────────────────────────────────────────────

  it('open transitions from closed to open', async () => {
    ref._setState('closed')
    await ref.open()
    expect(ref.state).toBe('open')
  })

  it('open is a no-op if already open', async () => {
    const onOpen = vi.fn().mockResolvedValue(undefined)
    const r = new BaseOverlayRef(makeInit({ onOpen }))
    r._setState('open')
    await r.open()
    expect(onOpen).not.toHaveBeenCalled()
  })

  // ─── toggle ─────────────────────────────────────────────────────────────────

  it('toggle closes when open', async () => {
    await ref.toggle()
    expect(ref.state).toBe('closed')
  })

  it('toggle opens when closed', async () => {
    ref._setState('closed')
    await ref.toggle()
    expect(ref.state).toBe('open')
  })

  // ─── patch ──────────────────────────────────────────────────────────────────

  it('patch calls onPatch with given options', () => {
    const onPatch = vi.fn()
    const r = new BaseOverlayRef(makeInit({ onPatch }))
    r.patch({ className: 'foo' })
    expect(onPatch).toHaveBeenCalledWith({ className: 'foo' })
  })

  // ─── position ───────────────────────────────────────────────────────────────

  it('moveTo delegates to onMoveTo', () => {
    const onMoveTo = vi.fn()
    const r = new BaseOverlayRef(makeInit({ onMoveTo }))
    r.moveTo(100, 200)
    expect(onMoveTo).toHaveBeenCalledWith(100, 200)
  })

  it('resetPosition delegates to onResetPosition', () => {
    const onResetPosition = vi.fn()
    const r = new BaseOverlayRef(makeInit({ onResetPosition }))
    r.resetPosition()
    expect(onResetPosition).toHaveBeenCalled()
  })

  it('getPosition returns position from onGetPosition', () => {
    const r = new BaseOverlayRef(
      makeInit({ onGetPosition: vi.fn().mockReturnValue({ x: 42, y: 99 }) }),
    )
    expect(r.getPosition()).toEqual({ x: 42, y: 99 })
  })

  // ─── data ───────────────────────────────────────────────────────────────────

  it('getData returns a copy of stored data', () => {
    const r = new BaseOverlayRef(makeInit({ options: { data: { foo: 'bar' } } }))
    const data = r.getData()
    expect(data['foo']).toBe('bar')
    data['foo'] = 'mutated'
    expect(r.getData()['foo']).toBe('bar')
  })

  it('setData replaces data', () => {
    ref.setData({ x: 1 })
    expect(ref.getData()).toEqual({ x: 1 })
  })

  // ─── toast specific ─────────────────────────────────────────────────────────

  it('setType stores toast type', () => {
    ref.setType('success')
    expect(ref._toastTypeValue).toBe('success')
  })

  it('setProgress clamps between 0–100', () => {
    ref.setProgress(150)
    expect(ref._progressValue).toBe(100)
    ref.setProgress(-10)
    expect(ref._progressValue).toBe(0)
    ref.setProgress(42)
    expect(ref._progressValue).toBe(42)
  })

  // ─── stack control ──────────────────────────────────────────────────────────

  it('bringToFront delegates to onBringToFront', () => {
    const onBringToFront = vi.fn()
    const r = new BaseOverlayRef(makeInit({ onBringToFront }))
    r.bringToFront()
    expect(onBringToFront).toHaveBeenCalled()
  })

  it('sendToBack delegates to onSendToBack', () => {
    const onSendToBack = vi.fn()
    const r = new BaseOverlayRef(makeInit({ onSendToBack }))
    r.sendToBack()
    expect(onSendToBack).toHaveBeenCalled()
  })

  it('setPriority delegates to onSetPriority', () => {
    const onSetPriority = vi.fn()
    const r = new BaseOverlayRef(makeInit({ onSetPriority }))
    r.setPriority(5)
    expect(onSetPriority).toHaveBeenCalledWith(5)
  })

  // ─── events ─────────────────────────────────────────────────────────────────

  it('on registers and returns unsubscribe fn', () => {
    const handler = vi.fn()
    const unsub = ref.on('focus', handler)
    ref._emit('focus', ref)
    expect(handler).toHaveBeenCalledTimes(1)
    unsub()
    ref._emit('focus', ref)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('once fires only one time', () => {
    const handler = vi.fn()
    ref.once('focus', handler)
    ref._emit('focus')
    ref._emit('focus')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('off removes a handler', () => {
    const handler = vi.fn()
    ref.on('focus', handler)
    ref.off('focus', handler)
    ref._emit('focus')
    expect(handler).not.toHaveBeenCalled()
  })

  // ─── DOM access ─────────────────────────────────────────────────────────────

  it('exposes element and contentElement', () => {
    expect(ref.element).toBeInstanceOf(HTMLElement)
    expect(ref.contentElement).toBeInstanceOf(HTMLElement)
  })
})
