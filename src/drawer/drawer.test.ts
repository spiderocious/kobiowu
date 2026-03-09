import { describe, it, expect, afterEach } from 'vitest'
import { mountDrawer } from './drawer'

let parent: HTMLElement

afterEach(() => {
  parent?.remove()
  document.body.style.removeProperty('overflow')
  document.body.style.removeProperty('padding-right')
  document.body.style.removeProperty('margin-left')
  document.body.style.removeProperty('margin-right')
  document.body.style.removeProperty('margin-top')
  document.body.style.removeProperty('margin-bottom')
})

function setup() {
  parent = document.createElement('div')
  document.body.appendChild(parent)
  return parent
}

describe('mountDrawer', () => {
  it('appends wrapper to parent', () => {
    const { destroy } = mountDrawer('<p/>', setup())
    expect(parent.querySelector('[data-kb-overlay="drawer"]')).not.toBeNull()
    destroy()
  })

  it('defaults to side=right', () => {
    const { wrapper, destroy } = mountDrawer('<p/>', setup())
    expect(wrapper.getAttribute('data-kb-drawer-side')).toBe('right')
    destroy()
  })

  it('applies specified side', () => {
    const { wrapper, destroy } = mountDrawer('<p/>', setup(), { side: 'left' })
    expect(wrapper.getAttribute('data-kb-drawer-side')).toBe('left')
    destroy()
  })

  it('has role=dialog and aria-modal=true', () => {
    const { wrapper, destroy } = mountDrawer('<p/>', setup())
    expect(wrapper.getAttribute('role')).toBe('dialog')
    expect(wrapper.getAttribute('aria-modal')).toBe('true')
    destroy()
  })

  it('content has data-kb-content=drawer', () => {
    const { content, destroy } = mountDrawer('<p/>', setup())
    expect(content.getAttribute('data-kb-content')).toBe('drawer')
    destroy()
  })

  it('left/right drawer content has width style', () => {
    const { content, destroy } = mountDrawer('<p/>', setup(), { side: 'left', size: 400 })
    expect(content.style.width).toBe('400px')
    destroy()
  })

  it('top/bottom drawer content has height style', () => {
    const { content, destroy } = mountDrawer('<p/>', setup(), { side: 'bottom', size: '40%' })
    expect(content.style.height).toBe('40%')
    destroy()
  })

  it('defaultSnapPoint sets initial size', () => {
    const { content, destroy } = mountDrawer('<p/>', setup(), { side: 'right', defaultSnapPoint: '60%' })
    expect(content.style.width).toBe('60%')
    destroy()
  })

  it('snapTo changes the content size', () => {
    const { content, snapTo, destroy } = mountDrawer('<p/>', setup(), { side: 'bottom' })
    snapTo('80%')
    expect(content.style.height).toBe('80%')
    destroy()
  })

  it('snapTo with number uses px', () => {
    const { content, snapTo, destroy } = mountDrawer('<p/>', setup(), { side: 'right' })
    snapTo(500)
    expect(content.style.width).toBe('500px')
    destroy()
  })

  it('renders HTML string component', () => {
    const { content, destroy } = mountDrawer('<h2>Drawer</h2>', setup())
    expect(content.querySelector('h2')).not.toBeNull()
    destroy()
  })

  it('locks scroll on mount', () => {
    const { destroy } = mountDrawer('<p/>', setup())
    expect(document.body.style.overflow).toBe('hidden')
    destroy()
  })

  it('unlocks scroll on destroy', () => {
    const { destroy } = mountDrawer('<p/>', setup())
    destroy()
    expect(document.body.style.overflow).toBe('')
  })

  it('pushContent applies margin to body', () => {
    const { destroy } = mountDrawer('<p/>', setup(), { side: 'left', pushContent: true })
    expect(document.body.style.marginLeft).not.toBe('')
    destroy()
  })

  it('pushContent is removed on destroy', () => {
    const { destroy } = mountDrawer('<p/>', setup(), { side: 'right', pushContent: true })
    destroy()
    expect(document.body.style.marginRight).toBe('')
  })

  it('marks wrapper with data-kb-needs-backdrop when overlay:true', () => {
    const { wrapper, destroy } = mountDrawer('<p/>', setup(), { overlay: true })
    expect(wrapper.getAttribute('data-kb-needs-backdrop')).toBe('true')
    destroy()
  })

  it('applies className to wrapper', () => {
    const { wrapper, destroy } = mountDrawer('<p/>', setup(), { className: 'my-drawer' })
    expect(wrapper.classList.contains('my-drawer')).toBe(true)
    destroy()
  })

  it('destroy removes wrapper from DOM', () => {
    const { wrapper, destroy } = mountDrawer('<p/>', setup())
    destroy()
    expect(parent.contains(wrapper)).toBe(false)
  })
})
