import { describe, it, expectTypeOf } from 'vitest'
import type { OverlayType, OverlayState, OverlayRef, OverlayOptions, KobiowuConfig } from './types'

describe('types', () => {
  it('OverlayType covers all 8 types', () => {
    const types: OverlayType[] = [
      'modal',
      'toast',
      'drawer',
      'alert',
      'tooltip',
      'popover',
      'sheet',
      'spotlight',
    ]
    expectTypeOf(types).toMatchTypeOf<OverlayType[]>()
  })

  it('OverlayState covers all 4 states', () => {
    const states: OverlayState[] = ['opening', 'open', 'closing', 'closed']
    expectTypeOf(states).toMatchTypeOf<OverlayState[]>()
  })

  it('OverlayOptions accepts valid shape', () => {
    const opts: OverlayOptions = {
      id: 'test',
      backdrop: 'blur',
      draggable: true,
      closeOnEscape: true,
    }
    expectTypeOf(opts).toMatchTypeOf<OverlayOptions>()
  })

  it('KobiowuConfig accepts valid shape', () => {
    const config: KobiowuConfig = {
      containerPrefix: 'kb',
      sharedBackdrop: false,
      zIndexBase: { modal: 1000, toast: 1100 },
    }
    expectTypeOf(config).toMatchTypeOf<KobiowuConfig>()
  })

  it('OverlayRef has required methods', () => {
    expectTypeOf<OverlayRef['close']>().toBeFunction()
    expectTypeOf<OverlayRef['open']>().toBeFunction()
    expectTypeOf<OverlayRef['patch']>().toBeFunction()
    expectTypeOf<OverlayRef['moveTo']>().toBeFunction()
    expectTypeOf<OverlayRef['bringToFront']>().toBeFunction()
    expectTypeOf<OverlayRef['sendToBack']>().toBeFunction()
    expectTypeOf<OverlayRef['on']>().toBeFunction()
  })
})
