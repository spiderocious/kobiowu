import { describe, it, expect, vi, beforeEach } from 'vitest'
import { animateEnter, animateExit, mountedHide, mountedShow, ENTER_KEYFRAMES, EXIT_KEYFRAMES } from './animation'
import type { AnimationConfig } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeElement(): HTMLElement {
  const el = document.createElement('div')
  // Provide a minimal WAAPI stub so tests run without a real browser engine
  el.animate = vi.fn().mockReturnValue({
    finished: Promise.resolve(),
    cancel: vi.fn(),
  })
  return el
}

// ─── animateEnter ─────────────────────────────────────────────────────────────

describe('animateEnter', () => {
  let el: HTMLElement

  beforeEach(() => {
    el = makeElement()
  })

  it('does nothing when animation is undefined', async () => {
    await animateEnter(el, undefined, 200)
    expect(el.animate).not.toHaveBeenCalled()
  })

  it('calls animate with fade enter keyframes', async () => {
    await animateEnter(el, 'fade', 200)
    expect(el.animate).toHaveBeenCalledWith(ENTER_KEYFRAMES.fade, expect.objectContaining({ duration: 200 }))
  })

  it('calls animate with scale enter keyframes', async () => {
    await animateEnter(el, 'scale', 300)
    expect(el.animate).toHaveBeenCalledWith(ENTER_KEYFRAMES.scale, expect.objectContaining({ duration: 300 }))
  })

  it('calls animate with slide enter keyframes', async () => {
    await animateEnter(el, 'slide', 150)
    expect(el.animate).toHaveBeenCalledWith(ENTER_KEYFRAMES.slide, expect.objectContaining({ duration: 150 }))
  })

  it('does not call animate for preset "none"', async () => {
    await animateEnter(el, 'none', 200)
    expect(el.animate).not.toHaveBeenCalled()
  })

  it('applies and removes CSS class for non-preset string', async () => {
    vi.useFakeTimers()
    const p = animateEnter(el, 'my-enter', 100)
    expect(el.classList.contains('my-enter')).toBe(true)
    vi.advanceTimersByTime(100)
    await p
    expect(el.classList.contains('my-enter')).toBe(false)
    vi.useRealTimers()
  })

  it('uses AnimationConfig keyframes and options', async () => {
    const config: AnimationConfig = {
      keyframes: [{ opacity: '0' }, { opacity: '1' }],
      options: { easing: 'linear' },
    }
    await animateEnter(el, config, 250)
    expect(el.animate).toHaveBeenCalledWith(
      config.keyframes,
      expect.objectContaining({ duration: 250, easing: 'linear' }),
    )
  })
})

// ─── animateExit ──────────────────────────────────────────────────────────────

describe('animateExit', () => {
  let el: HTMLElement

  beforeEach(() => {
    el = makeElement()
  })

  it('does nothing when animation is undefined', async () => {
    await animateExit(el, undefined, 200)
    expect(el.animate).not.toHaveBeenCalled()
  })

  it('calls animate with fade exit keyframes', async () => {
    await animateExit(el, 'fade', 200)
    expect(el.animate).toHaveBeenCalledWith(EXIT_KEYFRAMES.fade, expect.objectContaining({ duration: 200 }))
  })

  it('calls animate with scale exit keyframes', async () => {
    await animateExit(el, 'scale', 200)
    expect(el.animate).toHaveBeenCalledWith(EXIT_KEYFRAMES.scale, expect.objectContaining({ duration: 200 }))
  })

  it('calls animate with slide exit keyframes', async () => {
    await animateExit(el, 'slide', 200)
    expect(el.animate).toHaveBeenCalledWith(EXIT_KEYFRAMES.slide, expect.objectContaining({ duration: 200 }))
  })

  it('does not call animate for preset "none"', async () => {
    await animateExit(el, 'none', 200)
    expect(el.animate).not.toHaveBeenCalled()
  })

  it('applies and removes CSS class for non-preset string', async () => {
    vi.useFakeTimers()
    const p = animateExit(el, 'my-exit', 100)
    expect(el.classList.contains('my-exit')).toBe(true)
    vi.advanceTimersByTime(100)
    await p
    expect(el.classList.contains('my-exit')).toBe(false)
    vi.useRealTimers()
  })

  it('uses AnimationConfig keyframes', async () => {
    const config: AnimationConfig = {
      keyframes: [{ opacity: '1' }, { opacity: '0' }],
    }
    await animateExit(el, config, 200)
    expect(el.animate).toHaveBeenCalledWith(config.keyframes, expect.objectContaining({ duration: 200 }))
  })
})

// ─── mountedHide / mountedShow ────────────────────────────────────────────────

describe('mountedHide', () => {
  it('sets display:none, aria-hidden, and inert', () => {
    const el = document.createElement('div')
    mountedHide(el)
    expect(el.style.display).toBe('none')
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.hasAttribute('inert')).toBe(true)
  })
})

describe('mountedShow', () => {
  it('removes display, aria-hidden, and inert', () => {
    const el = document.createElement('div')
    mountedHide(el)
    mountedShow(el)
    expect(el.style.display).toBe('')
    expect(el.getAttribute('aria-hidden')).toBeNull()
    expect(el.hasAttribute('inert')).toBe(false)
  })
})

// ─── ENTER_KEYFRAMES / EXIT_KEYFRAMES shape ───────────────────────────────────

describe('preset keyframe shapes', () => {
  it('enter fade goes from opacity 0 to 1', () => {
    expect(ENTER_KEYFRAMES.fade[0]).toMatchObject({ opacity: '0' })
    expect(ENTER_KEYFRAMES.fade[1]).toMatchObject({ opacity: '1' })
  })

  it('exit fade goes from opacity 1 to 0', () => {
    expect(EXIT_KEYFRAMES.fade[0]).toMatchObject({ opacity: '1' })
    expect(EXIT_KEYFRAMES.fade[1]).toMatchObject({ opacity: '0' })
  })

  it('none preset has empty keyframes', () => {
    expect(ENTER_KEYFRAMES.none).toHaveLength(0)
    expect(EXIT_KEYFRAMES.none).toHaveLength(0)
  })
})
