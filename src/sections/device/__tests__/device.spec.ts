import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { effectScope } from 'vue'

import DeviceSection from '../DeviceSection.vue'
import {
  CAPACITY_OPTIONS,
  DEFAULT_CAPACITY_INDEX,
  ENGRAVE_SWAP_MS,
  LEGEND_ITEMS,
  SPEC_ROWS,
} from '../device.data'
import { useCapacityChoice } from '../useCapacityChoice'

describe('device.data', () => {
  it('четыре объёма, по умолчанию выбран 1 TB — прототип rev 01', () => {
    expect(CAPACITY_OPTIONS.map((o) => o.label)).toEqual(['256 GB', '512 GB', '1 TB', '2 TB'])
    const byDefault = CAPACITY_OPTIONS[DEFAULT_CAPACITY_INDEX]
    expect(byDefault?.engrave).toBe('1TB')
    expect(byDefault?.model).toBe('WX–1TB / rev 01')
  })

  it('модель каждого варианта начинается с его гравировки, гравировки не повторяются', () => {
    for (const option of CAPACITY_OPTIONS) {
      expect(option.model.startsWith(`WX–${option.engrave} / `)).toBe(true)
    }
    expect(new Set(CAPACITY_OPTIONS.map((o) => o.engrave)).size).toBe(CAPACITY_OPTIONS.length)
  })

  it('в габаритах — знак умножения, а не буква «х»', () => {
    const size = SPEC_ROWS.find((r) => r.label === 'Габариты')
    expect(size?.value).toBe('96 × 72 × 9 мм')
  })

  it('легенда повторяет шесть выносок чертежа', () => {
    expect(LEGEND_ITEMS).toHaveLength(6)
  })
})

describe('useCapacityChoice', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function setup() {
    const scope = effectScope()
    const choice = scope.run(() => useCapacityChoice())!
    return { scope, choice }
  }

  it('кнопка переключается сразу, гравировка и модель — через паузу', () => {
    const { scope, choice } = setup()
    choice.select(0)
    expect(choice.selectedIndex.value).toBe(0)
    expect(choice.isSwapping.value).toBe(true)
    expect(choice.shown.value.engrave).toBe('1TB')

    vi.advanceTimersByTime(ENGRAVE_SWAP_MS)
    expect(choice.isSwapping.value).toBe(false)
    expect(choice.shown.value.engrave).toBe('256GB')
    scope.stop()
  })

  it('после серии быстрых нажатий показывается последний выбор', () => {
    const { scope, choice } = setup()
    choice.select(0)
    vi.advanceTimersByTime(ENGRAVE_SWAP_MS / 2)
    choice.select(3)
    vi.advanceTimersByTime(ENGRAVE_SWAP_MS / 2)
    expect(choice.shown.value.engrave).toBe('1TB')
    vi.advanceTimersByTime(ENGRAVE_SWAP_MS)
    expect(choice.shown.value.engrave).toBe('2TB')
    scope.stop()
  })

  it('несуществующий индекс игнорируется', () => {
    const { scope, choice } = setup()
    choice.select(99)
    expect(choice.selectedIndex.value).toBe(DEFAULT_CAPACITY_INDEX)
    expect(choice.isSwapping.value).toBe(false)
    scope.stop()
  })
})

describe('DeviceSection', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('рендерит светлый экран с якорем #device', () => {
    const wrapper = mount(DeviceSection)
    const section = wrapper.get('section#device')
    expect(section.classes()).toContain('theme-light')
    expect(section.attributes('data-theme')).toBe('light')
    expect(wrapper.get('h2').text()).toBe('Одно устройство: накопитель, батарея и точка доступа')
    wrapper.unmount()
  })

  it('чертёж — картинка с подписью для скринридера, легенда и таблица из данных', () => {
    const wrapper = mount(DeviceSection)
    const svg = wrapper.get('svg.blueprint')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toContain('Чертёж WEXUS')
    expect(svg.findAll('.bp-callouts text')).toHaveLength(6)
    expect(svg.findAll('.bp-leaders path')).toHaveLength(6)
    expect(svg.findAll('.bp-dots circle')).toHaveLength(6)
    expect(wrapper.findAll('tbody tr')).toHaveLength(SPEC_ROWS.length + 1)
    expect(wrapper.get('caption').text()).toBe('Технические характеристики прототипа')
    for (const item of LEGEND_ITEMS) expect(wrapper.text()).toContain(item)
    wrapper.unmount()
  })

  it('выбор объёма: aria-pressed сразу, гравировка и модель — через 130 мс', async () => {
    const wrapper = mount(DeviceSection)
    const group = wrapper.get('[role="group"]')
    expect(group.attributes('aria-label')).toBe('Объём накопителя')

    const buttons = group.findAll('button')
    expect(buttons.map((b) => b.attributes('aria-pressed'))).toEqual([
      'false',
      'false',
      'true',
      'false',
    ])
    const engrave = wrapper.get('.bp-cap')
    const model = () => wrapper.get('tbody tr td').text()
    expect(engrave.text()).toBe('1TB')
    expect(model()).toBe('WX–1TB / rev 01')

    await buttons[1]!.trigger('click')
    expect(buttons[1]!.attributes('aria-pressed')).toBe('true')
    expect(buttons[2]!.attributes('aria-pressed')).toBe('false')
    expect(engrave.classes()).toContain('is-swap')
    expect(engrave.text()).toBe('1TB')

    vi.advanceTimersByTime(ENGRAVE_SWAP_MS)
    await wrapper.vm.$nextTick()
    expect(engrave.classes()).not.toContain('is-swap')
    expect(engrave.text()).toBe('512GB')
    expect(model()).toBe('WX–512GB / в плане')
    wrapper.unmount()
  })
})
