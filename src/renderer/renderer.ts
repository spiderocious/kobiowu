import type { Component } from '../types'

/**
 * Mounts a `Component` into a container element.
 * Returns a teardown function that undoes the mount.
 */
export function renderComponent(component: Component, container: HTMLElement): () => void {
  if (component instanceof HTMLElement) {
    container.appendChild(component)
    return () => component.remove()
  }

  if (typeof component === 'string') {
    container.innerHTML = component
    return () => {
      container.innerHTML = ''
    }
  }

  if (component instanceof URL) {
    const iframe = document.createElement('iframe')
    iframe.src = component.href
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block'
    container.appendChild(iframe)
    return () => iframe.remove()
  }

  if (typeof component === 'function') {
    const result = component(container)
    return typeof result === 'function' ? result : () => {}
  }

  return () => {}
}
