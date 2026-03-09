import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ResizeController } from './resize'

function fireMouseDown(el: HTMLElement, x = 0, y = 0): void {
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: x, clientY: y }))
}

function fireMouseMove(x: number, y: number): void {
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }))
}

function fireMouseUp(): void {
  document.dispatchEvent(new MouseEvent('mouseup'))
}

function getHandle(el: HTMLElement, side: string): HTMLElement | null {
  return el.querySelector(`[data-kb-resize-handle="${side}"]`)
}

describe('ResizeController', () => {
  let el: HTMLElement

  beforeEach(() => {
    el = document.createElement('div')
    el.style.width = '200px'
    el.style.height = '150px'
    el.style.position = 'absolute'
    el.style.left = '0px'
    el.style.top = '0px'
    document.body.appendChild(el)
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 200, height: 150, right: 200, bottom: 150, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect)
  })

  afterEach(() => {
    el.remove()
  })

  it('creates handle elements for each side', () => {
    const ctrl = new ResizeController(el, { handles: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] })
    expect(el.querySelectorAll('[data-kb-resize-handle]')).toHaveLength(8)
    ctrl.destroy()
  })

  it('only creates specified handles', () => {
    const ctrl = new ResizeController(el, { handles: ['se', 'sw'] })
    expect(el.querySelectorAll('[data-kb-resize-handle]')).toHaveLength(2)
    expect(getHandle(el, 'se')).not.toBeNull()
    expect(getHandle(el, 'sw')).not.toBeNull()
    expect(getHandle(el, 'n')).toBeNull()
    ctrl.destroy()
  })

  it('each handle has the correct cursor', () => {
    const ctrl = new ResizeController(el, { handles: ['ne'] })
    const handle = getHandle(el, 'ne')!
    expect(handle.style.cursor).toBe('ne-resize')
    ctrl.destroy()
  })

  it('resizes width on e-handle drag', () => {
    const ctrl = new ResizeController(el, { handles: ['e'] })
    const handle = getHandle(el, 'e')!
    fireMouseDown(handle, 200, 75)
    fireMouseMove(250, 75)
    fireMouseUp()
    expect(parseInt(el.style.width)).toBeGreaterThan(200)
    ctrl.destroy()
  })

  it('resizes width on w-handle drag', () => {
    const ctrl = new ResizeController(el, { handles: ['w'] })
    const handle = getHandle(el, 'w')!
    fireMouseDown(handle, 0, 75)
    fireMouseMove(-50, 75)
    fireMouseUp()
    expect(parseInt(el.style.width)).toBeGreaterThan(200)
    ctrl.destroy()
  })

  it('resizes height on s-handle drag', () => {
    const ctrl = new ResizeController(el, { handles: ['s'] })
    const handle = getHandle(el, 's')!
    fireMouseDown(handle, 100, 150)
    fireMouseMove(100, 200)
    fireMouseUp()
    expect(parseInt(el.style.height)).toBeGreaterThan(150)
    ctrl.destroy()
  })

  it('resizes height on n-handle drag', () => {
    const ctrl = new ResizeController(el, { handles: ['n'] })
    const handle = getHandle(el, 'n')!
    fireMouseDown(handle, 100, 0)
    fireMouseMove(100, -40)
    fireMouseUp()
    expect(parseInt(el.style.height)).toBeGreaterThan(150)
    ctrl.destroy()
  })

  it('respects minWidth', () => {
    const ctrl = new ResizeController(el, { handles: ['e'], minWidth: 100 })
    const handle = getHandle(el, 'e')!
    fireMouseDown(handle, 200, 75)
    fireMouseMove(0, 75)    // try to shrink past min
    fireMouseUp()
    expect(parseInt(el.style.width)).toBeGreaterThanOrEqual(100)
    ctrl.destroy()
  })

  it('respects maxWidth', () => {
    const ctrl = new ResizeController(el, { handles: ['e'], maxWidth: 250 })
    const handle = getHandle(el, 'e')!
    fireMouseDown(handle, 200, 75)
    fireMouseMove(400, 75)  // try to grow past max
    fireMouseUp()
    expect(parseInt(el.style.width)).toBeLessThanOrEqual(250)
    ctrl.destroy()
  })

  it('destroy removes all handle elements', () => {
    const ctrl = new ResizeController(el)
    expect(el.querySelectorAll('[data-kb-resize-handle]').length).toBeGreaterThan(0)
    ctrl.destroy()
    expect(el.querySelectorAll('[data-kb-resize-handle]')).toHaveLength(0)
  })

  it('destroy is idempotent', () => {
    const ctrl = new ResizeController(el)
    ctrl.destroy()
    expect(() => ctrl.destroy()).not.toThrow()
  })

  it('sets position:relative if element has position:static', () => {
    const div = document.createElement('div')
    div.style.position = 'static'
    document.body.appendChild(div)
    new ResizeController(div)
    expect(div.style.position).toBe('relative')
    div.remove()
  })
})
