import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DragController } from './drag'
import type { OverlayRef } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRef(): OverlayRef {
  return {
    id: 'test',
    type: 'modal',
    state: 'open',
    close: vi.fn(),
    open: vi.fn(),
    toggle: vi.fn(),
    focus: vi.fn(),
    patch: vi.fn(),
    moveTo: vi.fn(),
    resetPosition: vi.fn(),
    getPosition: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    update: vi.fn(),
    getData: vi.fn().mockReturnValue({}),
    setData: vi.fn(),
    setType: vi.fn(),
    setProgress: vi.fn(),
    sendToBack: vi.fn(),
    bringToFront: vi.fn(),
    setPriority: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    once: vi.fn(),
    off: vi.fn(),
    element: null,
    contentElement: null,
  } as unknown as OverlayRef
}

function fireMouseDown(el: HTMLElement, x = 0, y = 0): void {
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: x, clientY: y }))
}

function fireMouseMove(x: number, y: number): void {
  document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }))
}

function fireMouseUp(x: number, y: number): void {
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DragController', () => {
  let el: HTMLElement
  let ref: OverlayRef

  beforeEach(() => {
    el = document.createElement('div')
    document.body.appendChild(el)
    ref = makeRef()
  })

  afterEach(() => {
    el.remove()
  })

  it('starts at (0,0) with no initialPosition', () => {
    const ctrl = new DragController(el, ref, {})
    expect(ctrl.getPosition()).toEqual({ x: 0, y: 0 })
    ctrl.destroy()
  })

  it('applies initialPosition on creation', () => {
    const ctrl = new DragController(el, ref, { initialPosition: { x: 50, y: 100 } })
    expect(ctrl.getPosition()).toEqual({ x: 50, y: 100 })
    expect(el.style.transform).toBe('translate(50px, 100px)')
    ctrl.destroy()
  })

  it('moveTo updates position', () => {
    const ctrl = new DragController(el, ref, {})
    ctrl.moveTo(30, 60)
    expect(ctrl.getPosition()).toEqual({ x: 30, y: 60 })
    expect(el.style.transform).toBe('translate(30px, 60px)')
    ctrl.destroy()
  })

  it('reset returns to (0,0)', () => {
    const ctrl = new DragController(el, ref, { initialPosition: { x: 100, y: 100 } })
    ctrl.reset()
    expect(ctrl.getPosition()).toEqual({ x: 0, y: 0 })
    ctrl.destroy()
  })

  it('dragging moves element by mouse delta', () => {
    const ctrl = new DragController(el, ref, {})
    fireMouseDown(el, 0, 0)
    fireMouseMove(50, 80)
    fireMouseUp(50, 80)
    expect(ctrl.getPosition()).toEqual({ x: 50, y: 80 })
    ctrl.destroy()
  })

  it('axis:x only moves horizontally', () => {
    const ctrl = new DragController(el, ref, { axis: 'x' })
    fireMouseDown(el, 0, 0)
    fireMouseMove(40, 90)
    fireMouseUp(40, 90)
    expect(ctrl.getPosition().x).toBe(40)
    expect(ctrl.getPosition().y).toBe(0)
    ctrl.destroy()
  })

  it('axis:y only moves vertically', () => {
    const ctrl = new DragController(el, ref, { axis: 'y' })
    fireMouseDown(el, 0, 0)
    fireMouseMove(40, 90)
    fireMouseUp(40, 90)
    expect(ctrl.getPosition().x).toBe(0)
    expect(ctrl.getPosition().y).toBe(90)
    ctrl.destroy()
  })

  it('fires onDragStart on mousedown', () => {
    const onDragStart = vi.fn()
    const ctrl = new DragController(el, ref, { onDragStart })
    fireMouseDown(el, 10, 10)
    expect(onDragStart).toHaveBeenCalledWith(ref, { x: 0, y: 0 })
    fireMouseUp(10, 10)
    ctrl.destroy()
  })

  it('fires onDragEnd on mouseup', () => {
    const onDragEnd = vi.fn()
    const ctrl = new DragController(el, ref, { onDragEnd })
    fireMouseDown(el, 0, 0)
    fireMouseMove(20, 30)
    fireMouseUp(20, 30)
    expect(onDragEnd).toHaveBeenCalledWith(ref, { x: 20, y: 30 })
    ctrl.destroy()
  })

  it('ignores non-primary button mousedown', () => {
    const ctrl = new DragController(el, ref, {})
    el.dispatchEvent(new MouseEvent('mousedown', { button: 2, clientX: 0, clientY: 0 }))
    fireMouseMove(50, 50)
    expect(ctrl.getPosition()).toEqual({ x: 0, y: 0 })
    ctrl.destroy()
  })

  it('destroy stops drag events from working', () => {
    const ctrl = new DragController(el, ref, {})
    ctrl.destroy()
    fireMouseDown(el, 0, 0)
    fireMouseMove(99, 99)
    fireMouseUp(99, 99)
    expect(ctrl.getPosition()).toEqual({ x: 0, y: 0 })
  })

  it('uses a CSS selector handle', () => {
    const handle = document.createElement('span')
    handle.className = 'handle'
    el.appendChild(handle)
    const ctrl = new DragController(el, ref, { handle: '.handle' })
    expect(handle.style.cursor).toBe('grab')
    ctrl.destroy()
  })

  it('falls back to element if CSS selector handle not found', () => {
    const ctrl = new DragController(el, ref, { handle: '.does-not-exist' })
    expect(el.style.cursor).toBe('grab')
    ctrl.destroy()
  })

  it('uses an HTMLElement handle directly', () => {
    const handle = document.createElement('button')
    document.body.appendChild(handle)
    const ctrl = new DragController(el, ref, { handle })
    expect(handle.style.cursor).toBe('grab')
    ctrl.destroy()
    handle.remove()
  })
})
