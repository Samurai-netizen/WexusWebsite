import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import HeroSection from '../HeroSection.vue'
import HeroDevice from '../HeroDevice.vue'
import { useRequestModal } from '@/composables/useRequestModal'

describe('HeroSection', () => {
  const wrapper = mount(HeroSection)

  it('рендерит тёмный экран с якорем #hero и одним заголовком h1', () => {
    const section = wrapper.get('section#hero')
    expect(section.classes()).toContain('theme-dark')
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toContain('Приватность физического хранилища.')
  })

  it('знак подписан для скринридера', () => {
    const mark = wrapper.get('svg[aria-label^="Знак WEXUS"]')
    expect(mark.attributes('role')).toBe('img')
  })

  it('кнопка открывает окно заявки, ссылка ведёт на экран проблемы', async () => {
    const { isOpen, closeRequestModal } = useRequestModal()
    closeRequestModal()
    await wrapper.get('button.btn').trigger('click')
    expect(isOpen.value).toBe(true)
    closeRequestModal()
    expect(wrapper.get('a.link-quiet').attributes('href')).toBe('#problem')
  })
})

describe('HeroDevice', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('три дуги сигнала и три элемента значка Wi-Fi — по одному на уровень такта', () => {
    const wrapper = mount(HeroDevice)
    expect(wrapper.findAll('.sig path')).toHaveLength(3)
    expect(wrapper.findAll('.hero-wifi > *')).toHaveLength(3)
    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toContain('WX-1TB')
  })

  it('ставит анимацию на паузу, только когда устройство за кадром', async () => {
    let report: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {}
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
          report = callback
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    const wrapper = mount(HeroDevice, { attachTo: document.body })
    await nextTick()
    const root = wrapper.get('div')

    // до первого ответа наблюдателя анимация идёт
    expect(root.classes()).not.toContain('is-paused')

    report([{ isIntersecting: false }])
    await nextTick()
    expect(root.classes()).toContain('is-paused')

    report([{ isIntersecting: true }])
    await nextTick()
    expect(root.classes()).not.toContain('is-paused')

    // несколько накопившихся записей разом: верна последняя
    report([{ isIntersecting: true }, { isIntersecting: false }])
    await nextTick()
    expect(root.classes()).toContain('is-paused')

    wrapper.unmount()
  })
})
