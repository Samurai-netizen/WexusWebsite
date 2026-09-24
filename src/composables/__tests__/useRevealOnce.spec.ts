import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, useTemplateRef } from 'vue'

import { isRectOnScreen, useRevealOnce } from '../useRevealOnce'

/* В jsdom нет IntersectionObserver: подменяем его и сами «показываем» элемент. */
let reportVisible: ((visible: boolean) => void) | undefined

class FakeIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    reportVisible = (visible) =>
      callback(
        [{ isIntersecting: visible } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      )
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }))
}

function stubRect(top: number) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom: top + 350,
  } as DOMRect)
}

/** Минимальный компонент: один элемент с классами появления. */
const Probe = defineComponent({
  setup() {
    const el = useTemplateRef<HTMLElement>('el')
    const { revealClass } = useRevealOnce(el)
    return () => h('div', { ref: 'el', class: revealClass.value })
  },
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  reportVisible = undefined
})

describe('isRectOnScreen', () => {
  it('видно, если хоть часть по вертикали внутри окна', () => {
    expect(isRectOnScreen({ top: 100, bottom: 400 }, 800)).toBe(true)
    expect(isRectOnScreen({ top: -300, bottom: 10 }, 800)).toBe(true)
    expect(isRectOnScreen({ top: 790, bottom: 1100 }, 800)).toBe(true)
  })

  it('не видно, если целиком ниже или выше окна', () => {
    expect(isRectOnScreen({ top: 800, bottom: 1100 }, 800)).toBe(false)
    expect(isRectOnScreen({ top: -300, bottom: 0 }, 800)).toBe(false)
  })
})

describe('useRevealOnce', () => {
  it('ниже экрана: части спрятаны (is-pending), при появлении — анимируются (is-in)', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    stubReducedMotion(false)
    stubRect(2000)

    const wrapper = mount(Probe)
    await nextTick()
    expect(wrapper.classes()).toContain('is-pending')

    reportVisible?.(true)
    await nextTick()
    expect(wrapper.classes()).toContain('is-in')
    expect(wrapper.classes()).not.toContain('is-pending')
    wrapper.unmount()
  })

  it('уже на экране при загрузке: не прячется и не анимируется', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    stubReducedMotion(false)
    stubRect(100)

    const wrapper = mount(Probe)
    await nextTick()
    reportVisible?.(true)
    await nextTick()
    expect(wrapper.classes()).not.toContain('is-pending')
    expect(wrapper.classes()).not.toContain('is-in')
    wrapper.unmount()
  })

  it('prefers-reduced-motion: всё просто видно, без анимации', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    stubReducedMotion(true)
    stubRect(2000)

    const wrapper = mount(Probe)
    await nextTick()
    reportVisible?.(true)
    await nextTick()
    expect(wrapper.classes()).not.toContain('is-pending')
    expect(wrapper.classes()).not.toContain('is-in')
    wrapper.unmount()
  })
})
