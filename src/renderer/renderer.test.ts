import { describe, it, expect, vi } from 'vitest'
import { renderComponent } from './renderer'

describe('renderComponent', () => {
  it('appends HTMLElement and returns remover', () => {
    const container = document.createElement('div')
    const child = document.createElement('span')
    const teardown = renderComponent(child, container)
    expect(container.contains(child)).toBe(true)
    teardown()
    expect(container.contains(child)).toBe(false)
  })

  it('sets innerHTML for string and clears on teardown', () => {
    const container = document.createElement('div')
    const teardown = renderComponent('<p>hello</p>', container)
    expect(container.innerHTML).toBe('<p>hello</p>')
    teardown()
    expect(container.innerHTML).toBe('')
  })

  it('creates an iframe for URL and removes on teardown', () => {
    const container = document.createElement('div')
    const url = new URL('https://example.com')
    const teardown = renderComponent(url, container)
    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe!.src).toBe('https://example.com/')
    teardown()
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('calls render function with container', () => {
    const container = document.createElement('div')
    const fn = vi.fn()
    renderComponent(fn, container)
    expect(fn).toHaveBeenCalledWith(container)
  })

  it('calls teardown returned by render function', () => {
    const container = document.createElement('div')
    const cleanup = vi.fn()
    const teardown = renderComponent(() => cleanup, container)
    teardown()
    expect(cleanup).toHaveBeenCalled()
  })

  it('returns no-op teardown when render function returns void', () => {
    const container = document.createElement('div')
    const teardown = renderComponent(() => undefined, container)
    expect(() => teardown()).not.toThrow()
  })
})
