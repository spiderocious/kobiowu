import { describe, it, expect, beforeEach } from 'vitest'
import { applySize, applyPosition } from './positioning'

function makeEl(): HTMLElement {
  const el = document.createElement('div')
  el.style.position = 'fixed'
  return el
}

// ─── applySize ────────────────────────────────────────────────────────────────

describe('applySize', () => {
  let el: HTMLElement

  beforeEach(() => { el = makeEl() })

  it('fullscreen sets 100vw/100vh and clears max constraints', () => {
    applySize(el, { fullscreen: true })
    expect(el.style.width).toBe('100vw')
    expect(el.style.height).toBe('100vh')
    expect(el.style.maxWidth).toBe('none')
    expect(el.style.maxHeight).toBe('none')
  })

  it('width as number uses px', () => {
    applySize(el, { width: 400 })
    expect(el.style.width).toBe('400px')
  })

  it('width as string passes through', () => {
    applySize(el, { width: '50%' })
    expect(el.style.width).toBe('50%')
  })

  it('height as number uses px', () => {
    applySize(el, { height: 300 })
    expect(el.style.height).toBe('300px')
  })

  it('maxWidth and maxHeight are applied', () => {
    applySize(el, { maxWidth: 800, maxHeight: '90vh' })
    expect(el.style.maxWidth).toBe('800px')
    expect(el.style.maxHeight).toBe('90vh')
  })

  it('does not override unspecified properties', () => {
    el.style.width = '200px'
    applySize(el, { height: 100 })
    expect(el.style.width).toBe('200px')
    expect(el.style.height).toBe('100px')
  })
})

// ─── applyPosition ────────────────────────────────────────────────────────────

describe('applyPosition', () => {
  let el: HTMLElement

  beforeEach(() => { el = makeEl() })

  it('does nothing when position is undefined', () => {
    applyPosition(el, undefined, undefined)
    expect(el.style.top).toBe('')
    expect(el.style.left).toBe('')
  })

  it('center sets top/left 50% with negative translate', () => {
    applyPosition(el, 'center', undefined)
    expect(el.style.top).toBe('50%')
    expect(el.style.left).toBe('50%')
    expect(el.style.transform).toContain('-50%')
  })

  it('top positions at top, centered horizontally', () => {
    applyPosition(el, 'top', undefined)
    expect(el.style.top).toBe('0px')
    expect(el.style.left).toBe('50%')
    expect(el.style.transform).toContain('translateX')
  })

  it('bottom positions at bottom, centered horizontally', () => {
    applyPosition(el, 'bottom', undefined)
    expect(el.style.bottom).toBe('0px')
    expect(el.style.left).toBe('50%')
  })

  it('left positions at left, centered vertically', () => {
    applyPosition(el, 'left', undefined)
    expect(el.style.left).toBe('0px')
    expect(el.style.top).toBe('50%')
  })

  it('right positions at right, centered vertically', () => {
    applyPosition(el, 'right', undefined)
    expect(el.style.right).toBe('0px')
    expect(el.style.top).toBe('50%')
  })

  it('top-left sets top and left to 0', () => {
    applyPosition(el, 'top-left', undefined)
    expect(el.style.top).toBe('0px')
    expect(el.style.left).toBe('0px')
  })

  it('top-right sets top and right to 0', () => {
    applyPosition(el, 'top-right', undefined)
    expect(el.style.top).toBe('0px')
    expect(el.style.right).toBe('0px')
  })

  it('bottom-left sets bottom and left to 0', () => {
    applyPosition(el, 'bottom-left', undefined)
    expect(el.style.bottom).toBe('0px')
    expect(el.style.left).toBe('0px')
  })

  it('bottom-right sets bottom and right to 0', () => {
    applyPosition(el, 'bottom-right', undefined)
    expect(el.style.bottom).toBe('0px')
    expect(el.style.right).toBe('0px')
  })

  it('top-center positions at top, centered horizontally', () => {
    applyPosition(el, 'top-center', undefined)
    expect(el.style.top).toBe('0px')
    expect(el.style.left).toBe('50%')
    expect(el.style.transform).toContain('translateX')
  })

  it('bottom-center positions at bottom, centered horizontally', () => {
    applyPosition(el, 'bottom-center', undefined)
    expect(el.style.bottom).toBe('0px')
    expect(el.style.left).toBe('50%')
    expect(el.style.transform).toContain('translateX')
  })

  it('custom {x, y} as numbers sets left and top', () => {
    applyPosition(el, { x: 100, y: 200 }, undefined)
    expect(el.style.left).toBe('100px')
    expect(el.style.top).toBe('200px')
  })

  it('custom {x, y} as strings sets left and top', () => {
    applyPosition(el, { x: '10vw', y: '5vh' }, undefined)
    expect(el.style.left).toBe('10vw')
    expect(el.style.top).toBe('5vh')
  })

  it('offset shifts position via transform', () => {
    applyPosition(el, 'top-left', { x: 16, y: 24 })
    expect(el.style.top).toBe('24px')
    expect(el.style.left).toBe('16px')
  })

  it('resets stale positioning props before applying new ones', () => {
    el.style.bottom = '10px'
    el.style.right = '10px'
    applyPosition(el, 'top-left', undefined)
    expect(el.style.bottom).toBe('')
    expect(el.style.right).toBe('')
  })
})
