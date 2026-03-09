import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountAlert } from './alert'

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

describe('mountAlert', () => {
  it('appends wrapper to parent', () => {
    const { destroy } = mountAlert('<p/>', setup())
    expect(parent.querySelector('[data-kb-overlay="alert"]')).not.toBeNull()
    destroy()
  })

  it('has role=alertdialog and aria-modal=true', () => {
    const { wrapper, destroy } = mountAlert('<p/>', setup())
    expect(wrapper.getAttribute('role')).toBe('alertdialog')
    expect(wrapper.getAttribute('aria-modal')).toBe('true')
    destroy()
  })

  it('defaults to type=confirm', () => {
    const { wrapper, destroy } = mountAlert('<p/>', setup())
    expect(wrapper.getAttribute('data-kb-alert-type')).toBe('confirm')
    destroy()
  })

  it('sets data-kb-alert-type from options', () => {
    const { wrapper, destroy } = mountAlert('<p/>', setup(), { type: 'destructive' })
    expect(wrapper.getAttribute('data-kb-alert-type')).toBe('destructive')
    destroy()
  })

  it('content has data-kb-content=alert', () => {
    const { content, destroy } = mountAlert('<p/>', setup())
    expect(content.getAttribute('data-kb-content')).toBe('alert')
    destroy()
  })

  it('mounts HTML string component', () => {
    const { content, destroy } = mountAlert('<button data-kb-confirm>OK</button>', setup())
    expect(content.querySelector('button')).not.toBeNull()
    destroy()
  })

  it('fires onConfirm when [data-kb-confirm] element is clicked', () => {
    const onConfirm = vi.fn()
    const { content, destroy } = mountAlert(
      '<button data-kb-confirm>OK</button>',
      setup(),
      { onConfirm },
    )
    content.querySelector('button')?.click()
    expect(onConfirm).toHaveBeenCalled()
    destroy()
  })

  it('fires onCancel when [data-kb-cancel] element is clicked', () => {
    const onCancel = vi.fn()
    const { content, destroy } = mountAlert(
      '<button data-kb-cancel>Cancel</button>',
      setup(),
      { onCancel },
    )
    content.querySelector('button')?.click()
    expect(onCancel).toHaveBeenCalled()
    destroy()
  })

  it('applies width to content', () => {
    const { content, destroy } = mountAlert('<p/>', setup(), { width: 400 })
    expect(content.style.width).toBe('400px')
    destroy()
  })

  it('applies maxWidth to content', () => {
    const { content, destroy } = mountAlert('<p/>', setup(), { maxWidth: '90vw' })
    expect(content.style.maxWidth).toBe('90vw')
    destroy()
  })

  it('applies className to wrapper', () => {
    const { wrapper, destroy } = mountAlert('<p/>', setup(), { className: 'my-alert' })
    expect(wrapper.classList.contains('my-alert')).toBe(true)
    destroy()
  })

  it('locks scroll on mount', () => {
    const { destroy } = mountAlert('<p/>', setup())
    expect(document.body.style.overflow).toBe('hidden')
    destroy()
  })

  it('unlocks scroll on destroy', () => {
    const { destroy } = mountAlert('<p/>', setup())
    destroy()
    expect(document.body.style.overflow).toBe('')
  })

  it('destroy removes wrapper from DOM', () => {
    const { wrapper, destroy } = mountAlert('<p/>', setup())
    destroy()
    expect(parent.contains(wrapper)).toBe(false)
  })

  it('does not fire onConfirm for non-confirm clicks', () => {
    const onConfirm = vi.fn()
    const { content, destroy } = mountAlert('<p>text</p>', setup(), { onConfirm })
    content.querySelector('p')?.click()
    expect(onConfirm).not.toHaveBeenCalled()
    destroy()
  })
})
