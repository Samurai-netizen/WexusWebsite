import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import ProblemSection from '../ProblemSection.vue'
import { FACTS, PAYMENT_MARK_COUNT, PAYMENT_MARK_X, SEGMENTS } from '../problem.data'

describe('problem.data', () => {
  it('отметки платежей идут слева направо без наложений и помещаются в viewBox шириной 480', () => {
    const MARK_WIDTH = 6
    expect(PAYMENT_MARK_X).toHaveLength(PAYMENT_MARK_COUNT)
    PAYMENT_MARK_X.slice(1).forEach((x, i) => {
      expect(x - PAYMENT_MARK_X[i]!).toBeGreaterThan(MARK_WIDTH)
    })
    expect(Math.max(...PAYMENT_MARK_X) + MARK_WIDTH).toBeLessThanOrEqual(480)
  })

  it('у каждого пункта и сегмента есть заголовок и текст, заголовки не повторяются', () => {
    for (const item of [...FACTS, ...SEGMENTS]) {
      expect(item.title.trim()).not.toBe('')
      expect(item.text.trim()).not.toBe('')
    }
    expect(new Set(FACTS.map((f) => f.title)).size).toBe(FACTS.length)
    expect(new Set(SEGMENTS.map((s) => s.title)).size).toBe(SEGMENTS.length)
  })
})

describe('ProblemSection', () => {
  const wrapper = mount(ProblemSection)

  it('рендерит светлый экран с якорем #problem', () => {
    const section = wrapper.get('section#problem')
    expect(section.classes()).toContain('theme-light')
    expect(section.attributes('data-theme')).toBe('light')
  })

  it('выводит все пункты и сегменты из данных', () => {
    expect(wrapper.findAll('li')).toHaveLength(FACTS.length)
    const firstFact = wrapper.get('li')
    expect(firstFact.get('b').text()).toBe(FACTS[0]?.title)
    // между жирным началом и продолжением должен остаться пробел
    expect(firstFact.text()).toContain(`${FACTS[0]?.title} ${FACTS[0]?.text}`)
    for (const segment of SEGMENTS) {
      expect(wrapper.text()).toContain(segment.title)
      expect(wrapper.text()).toContain(segment.text)
    }
  })

  it('схема доступна скринридеру', () => {
    const svg = wrapper.get('svg[role="img"]')
    expect(svg.attributes('aria-label')).toMatch(/^Схема: твои устройства/)
  })
})
