import { describe, it, expect, afterEach } from 'vitest'
import { mountModal } from './modal'

let parent: HTMLElement

afterEach(() => {
  parent?.remove()
  document.body.style.removeProperty('overflow')
  document.body.style.removeProperty('padding-right')
})

function setup() {
  parent = document.createElement('div')
  document.body.appendChild(parent)
  return parent
}

describe('mountModal', () => {
  it('appends wrapper to parent', () => {
    const p = setup()
    const { destroy } = mountModal('<p>hi</p>', p)
    expect(p.querySelector('[data-kb-overlay="modal"]')).not.toBeNull()
    destroy()
  })

  it('wrapper has role="dialog" and aria-modal="true"', () => {
    const p = setup()
    const { wrapper, destroy } = mountModal('<p>hi</p>', p)
    expect(wrapper.getAttribute('role')).toBe('dialog')
    expect(wrapper.getAttribute('aria-modal')).toBe('true')
    destroy()
  })

  it('content has data-kb-content="modal"', () => {
    const p = setup()
    const { content, destroy } = mountModal('<p>hi</p>', p)
    expect(content.getAttribute('data-kb-content')).toBe('modal')
    destroy()
  })

  it('mounts HTML string component', () => {
    const p = setup()
    const { content, destroy } = mountModal('<span id="test">hello</span>', p)
    expect(content.querySelector('#test')).not.toBeNull()
    destroy()
  })

  it('mounts HTMLElement component', () => {
    const p = setup()
    const el = document.createElement('section')
    const { content, destroy } = mountModal(el, p)
    expect(content.contains(el)).toBe(true)
    destroy()
  })

  it('mounts render function component', () => {
    const p = setup()
    let mounted = false
    const { destroy } = mountModal((container) => {
      mounted = true
      container.innerHTML = 'rendered'
    }, p)
    expect(mounted).toBe(true)
    destroy()
  })

  it('centered (default) applies center flex alignment', () => {
    const p = setup()
    const { wrapper, destroy } = mountModal('<p/>', p)
    expect(wrapper.style.alignItems).toBe('center')
    expect(wrapper.style.justifyContent).toBe('center')
    destroy()
  })

  it('centered:false applies flex-start alignment', () => {
    const p = setup()
    const { wrapper, destroy } = mountModal('<p/>', p, { centered: false })
    expect(wrapper.style.alignItems).toBe('flex-start')
    destroy()
  })

  it('scrollable:true sets overflow-y:auto on content', () => {
    const p = setup()
    const { content, destroy } = mountModal('<p/>', p, { scrollable: true })
    expect(content.style.overflowY).toBe('auto')
    destroy()
  })

  it('applies width and height to content', () => {
    const p = setup()
    const { content, destroy } = mountModal('<p/>', p, { width: 500, height: 300 })
    expect(content.style.width).toBe('500px')
    expect(content.style.height).toBe('300px')
    destroy()
  })

  it('applies fullscreen to content', () => {
    const p = setup()
    const { content, destroy } = mountModal('<p/>', p, { fullscreen: true })
    expect(content.style.width).toBe('100vw')
    expect(content.style.height).toBe('100vh')
    destroy()
  })

  it('applies className to wrapper', () => {
    const p = setup()
    const { wrapper, destroy } = mountModal('<p/>', p, { className: 'my-modal' })
    expect(wrapper.classList.contains('my-modal')).toBe(true)
    destroy()
  })

  it('locks scroll on mount and unlocks on destroy', () => {
    const p = setup()
    const { destroy } = mountModal('<p/>', p)
    expect(document.body.style.overflow).toBe('hidden')
    destroy()
    expect(document.body.style.overflow).toBe('')
  })

  it('destroy removes wrapper from DOM', () => {
    const p = setup()
    const { wrapper, destroy } = mountModal('<p/>', p)
    destroy()
    expect(p.contains(wrapper)).toBe(false)
  })
})
