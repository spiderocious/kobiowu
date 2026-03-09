import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountToast, _resetLiveRegion, _resetPositionContainers } from './toast'

beforeEach(() => {
  _resetLiveRegion()
  _resetPositionContainers()
  vi.useFakeTimers()
})

afterEach(() => {
  _resetLiveRegion()
  _resetPositionContainers()
  vi.useRealTimers()
})

describe('mountToast', () => {
  it('appends wrapper to a position container on document.body', () => {
    const { destroy } = mountToast('<p>hi</p>', {}, vi.fn())
    const region = document.querySelector('[data-kb-toast-region]')
    expect(region).not.toBeNull()
    destroy()
  })

  it('uses top-right as default position', () => {
    const { destroy } = mountToast('<p/>', {}, vi.fn())
    expect(document.querySelector('[data-kb-toast-region="top-right"]')).not.toBeNull()
    destroy()
  })

  it('creates region for specified position', () => {
    const { destroy } = mountToast('<p/>', { position: 'bottom-left' }, vi.fn())
    expect(document.querySelector('[data-kb-toast-region="bottom-left"]')).not.toBeNull()
    destroy()
  })

  it('wrapper has role=status', () => {
    const { wrapper, destroy } = mountToast('<p/>', {}, vi.fn())
    expect(wrapper.getAttribute('role')).toBe('status')
    destroy()
  })

  it('sets data-kb-toast-type from options', () => {
    const { wrapper, destroy } = mountToast('<p/>', { type: 'success' }, vi.fn())
    expect(wrapper.getAttribute('data-kb-toast-type')).toBe('success')
    destroy()
  })

  it('setType updates data-kb-toast-type', () => {
    const { wrapper, setType, destroy } = mountToast('<p/>', { type: 'loading' }, vi.fn())
    setType('success')
    expect(wrapper.getAttribute('data-kb-toast-type')).toBe('success')
    destroy()
  })

  it('renders string component into content', () => {
    const { content, destroy } = mountToast('<b>toast!</b>', {}, vi.fn())
    expect(content.querySelector('b')).not.toBeNull()
    destroy()
  })

  it('renders HTMLElement component', () => {
    const el = document.createElement('span')
    const { content, destroy } = mountToast(el, {}, vi.fn())
    expect(content.contains(el)).toBe(true)
    destroy()
  })

  it('auto-closes after duration', () => {
    const onClose = vi.fn()
    const { destroy } = mountToast('<p/>', { duration: 3000 }, onClose)
    vi.advanceTimersByTime(3000)
    expect(onClose).toHaveBeenCalled()
    destroy()
  })

  it('duration:0 does not auto-close', () => {
    const onClose = vi.fn()
    const { timer, destroy } = mountToast('<p/>', { duration: 0 }, onClose)
    vi.advanceTimersByTime(99999)
    expect(onClose).not.toHaveBeenCalled()
    expect(timer).toBeNull()
    destroy()
  })

  it('creates a progress bar element when showProgress:true', () => {
    const { wrapper, destroy } = mountToast('<p/>', { showProgress: true, duration: 3000 }, vi.fn())
    expect(wrapper.querySelector('[data-kb-toast-progress]')).not.toBeNull()
    destroy()
  })

  it('does not create progress bar when showProgress:false', () => {
    const { wrapper, destroy } = mountToast('<p/>', { showProgress: false }, vi.fn())
    expect(wrapper.querySelector('[data-kb-toast-progress]')).toBeNull()
    destroy()
  })

  it('enforce limit by removing oldest toast', () => {
    const onClose = vi.fn()
    const { destroy: d1 } = mountToast('<p/>', { position: 'top-right', limit: 2 }, onClose)
    const { destroy: d2 } = mountToast('<p/>', { position: 'top-right', limit: 2 }, onClose)
    const { destroy: d3 } = mountToast('<p/>', { position: 'top-right', limit: 2 }, onClose)
    const region = document.querySelector('[data-kb-toast-region="top-right"]')!
    expect(region.querySelectorAll('[data-kb-overlay="toast"]').length).toBeLessThanOrEqual(2)
    d1(); d2(); d3()
  })

  it('destroy removes wrapper from DOM', () => {
    const { wrapper, destroy } = mountToast('<p/>', {}, vi.fn())
    destroy()
    expect(document.body.contains(wrapper)).toBe(false)
  })

  it('destroy cancels auto-close timer', () => {
    const onClose = vi.fn()
    const { destroy } = mountToast('<p/>', { duration: 1000 }, onClose)
    destroy()
    vi.advanceTimersByTime(2000)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('creates ARIA live region on document.body', () => {
    const { destroy } = mountToast('<p/>', {}, vi.fn())
    expect(document.querySelector('[aria-live]')).not.toBeNull()
    destroy()
  })

  it('applies className to wrapper', () => {
    const { wrapper, destroy } = mountToast('<p/>', { className: 'my-toast' }, vi.fn())
    expect(wrapper.classList.contains('my-toast')).toBe(true)
    destroy()
  })

  it('reuses same position container for same position', () => {
    const { destroy: d1 } = mountToast('<p/>', { position: 'top-right' }, vi.fn())
    const { destroy: d2 } = mountToast('<p/>', { position: 'top-right' }, vi.fn())
    expect(document.querySelectorAll('[data-kb-toast-region="top-right"]')).toHaveLength(1)
    d1(); d2()
  })
})
