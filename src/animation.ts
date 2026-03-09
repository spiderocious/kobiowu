import type { AnimationValue, AnimationConfig, AnimationPreset } from './types'

// ─── Preset keyframes ─────────────────────────────────────────────────────────

const ENTER_KEYFRAMES: Record<AnimationPreset, Keyframe[]> = {
  fade: [{ opacity: '0' }, { opacity: '1' }],
  scale: [
    { opacity: '0', transform: 'scale(0.95)' },
    { opacity: '1', transform: 'scale(1)' },
  ],
  slide: [
    { opacity: '0', transform: 'translateY(-8px)' },
    { opacity: '1', transform: 'translateY(0)' },
  ],
  none: [],
}

const EXIT_KEYFRAMES: Record<AnimationPreset, Keyframe[]> = {
  fade: [{ opacity: '1' }, { opacity: '0' }],
  scale: [
    { opacity: '1', transform: 'scale(1)' },
    { opacity: '0', transform: 'scale(0.95)' },
  ],
  slide: [
    { opacity: '1', transform: 'translateY(0)' },
    { opacity: '0', transform: 'translateY(-8px)' },
  ],
  none: [],
}

const PRESETS = new Set<string>(['fade', 'scale', 'slide', 'none'])

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPreset(value: string): value is AnimationPreset {
  return PRESETS.has(value)
}

function isAnimationConfig(value: AnimationValue): value is AnimationConfig {
  return typeof value === 'object' && value !== null && 'keyframes' in value
}

/**
 * Run a Web Animations API animation, waiting for it to finish.
 * Falls back gracefully if the WAAPI is unavailable (e.g. some test environments).
 */
async function runKeyframeAnimation(
  element: HTMLElement,
  keyframes: Keyframe[],
  duration: number,
  options?: KeyframeAnimationOptions,
): Promise<void> {
  if (keyframes.length === 0) return

  const anim = element.animate(keyframes, {
    duration,
    fill: 'forwards',
    easing: 'ease',
    ...options,
  })

  // `finished` is a Promise on the Animation object (WAAPI)
  if (anim && typeof anim.finished?.then === 'function') {
    await anim.finished
  } else {
    // Fallback: wait for the duration
    await new Promise<void>((resolve) => setTimeout(resolve, duration))
  }
}

/**
 * Apply a CSS class for the duration of the animation, then remove it.
 */
async function runClassAnimation(
  element: HTMLElement,
  className: string,
  duration: number,
): Promise<void> {
  element.classList.add(className)
  await new Promise<void>((resolve) => setTimeout(resolve, duration))
  element.classList.remove(className)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Play the enter (open) animation on an element.
 */
export async function animateEnter(
  element: HTMLElement,
  animation: AnimationValue | undefined,
  duration: number,
): Promise<void> {
  if (!animation) return

  if (isAnimationConfig(animation)) {
    await runKeyframeAnimation(element, animation.keyframes as Keyframe[], duration, animation.options)
    return
  }

  if (typeof animation === 'string') {
    if (isPreset(animation)) {
      await runKeyframeAnimation(element, ENTER_KEYFRAMES[animation], duration)
    } else {
      await runClassAnimation(element, animation, duration)
    }
  }
}

/**
 * Play the exit (close) animation on an element.
 */
export async function animateExit(
  element: HTMLElement,
  animation: AnimationValue | undefined,
  duration: number,
): Promise<void> {
  if (!animation) return

  if (isAnimationConfig(animation)) {
    await runKeyframeAnimation(element, animation.keyframes as Keyframe[], duration, animation.options)
    return
  }

  if (typeof animation === 'string') {
    if (isPreset(animation)) {
      await runKeyframeAnimation(element, EXIT_KEYFRAMES[animation], duration)
    } else {
      await runClassAnimation(element, animation, duration)
    }
  }
}

/**
 * Hide an element without removing it from the DOM (keepMounted behaviour).
 */
export function mountedHide(element: HTMLElement): void {
  element.style.display = 'none'
  element.setAttribute('aria-hidden', 'true')
  element.setAttribute('inert', '')
}

/**
 * Restore a keepMounted element to visibility.
 */
export function mountedShow(element: HTMLElement): void {
  element.style.removeProperty('display')
  element.removeAttribute('aria-hidden')
  element.removeAttribute('inert')
}

// ─── Re-export preset map (useful for orchestrator) ───────────────────────────

export { ENTER_KEYFRAMES, EXIT_KEYFRAMES }
