import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import { FAQ } from '@/content/faq'
import { SECTIONS } from '@/content/sections'
import { useRequestModal } from '@/composables/useRequestModal'
import FaqAccordion from '../FaqAccordion.vue'
import FinalSection from '../FinalSection.vue'
import { faqAnswerId, faqQuestionId, nextOpenIndex } from '../faqAccordion'
import { FOOTER_NAV, STATUS_ROWS } from '../final.data'

describe('faqAccordion', () => {
  it('раскрыт один ответ: другой вопрос переключает, повторное нажатие сворачивает', () => {
    expect(nextOpenIndex(null, 2)).toBe(2)
    expect(nextOpenIndex(2, 4)).toBe(4)
    expect(nextOpenIndex(4, 4)).toBeNull()
  })

  it('id считаются с единицы, как в исходнике', () => {
    expect(faqQuestionId(0)).toBe('faq-q1')
    expect(faqAnswerId(5)).toBe('faq-a6')
  })
})

describe('final.data', () => {
  it('подвал ведёт на все экраны, кроме последнего, по порядку', () => {
    expect(FOOTER_NAV).toEqual(SECTIONS.filter((s) => s.id !== 'final'))
  })

  it('у строк статуса есть подпись и значение', () => {
    expect(STATUS_ROWS.length).toBeGreaterThan(0)
    for (const row of STATUS_ROWS) {
      expect(row.label.trim()).not.toBe('')
      expect(row.value.trim()).not.toBe('')
    }
  })
})

describe('FaqAccordion', () => {
  const expanded = (wrapper: ReturnType<typeof mount>) =>
    wrapper.findAll('button').map((b) => b.attributes('aria-expanded'))

  it('выводит все вопросы из src/content/faq.ts со связанными aria-атрибутами', () => {
    const wrapper = mount(FaqAccordion)
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(FAQ.length)
    FAQ.forEach((item, i) => {
      const button = buttons[i]
      const region = wrapper.get(`#${faqAnswerId(i)}`)
      expect(button?.attributes('id')).toBe(faqQuestionId(i))
      expect(button?.attributes('aria-controls')).toBe(faqAnswerId(i))
      expect(button?.text()).toBe(item.question)
      expect(region.attributes('role')).toBe('region')
      expect(region.attributes('aria-labelledby')).toBe(faqQuestionId(i))
      expect(region.findAll('p').map((p) => p.text())).toEqual(item.answer)
    })
  })

  it('сначала всё свёрнуто, затем раскрыт всегда один ответ', async () => {
    const wrapper = mount(FaqAccordion)
    const closed = FAQ.map(() => 'false')
    expect(expanded(wrapper)).toEqual(closed)

    await wrapper.get('#faq-q2').trigger('click')
    expect(expanded(wrapper)).toEqual(closed.map((v, i) => (i === 1 ? 'true' : v)))
    expect(wrapper.findAll('.is-open')).toHaveLength(1)
    expect(wrapper.get('.is-open').attributes('id')).toBe('faq-a2')

    await wrapper.get('#faq-q3').trigger('click')
    expect(expanded(wrapper)).toEqual(closed.map((v, i) => (i === 2 ? 'true' : v)))

    await wrapper.get('#faq-q3').trigger('click')
    expect(expanded(wrapper)).toEqual(closed)
    expect(wrapper.findAll('.is-open')).toHaveLength(0)
  })
})

describe('FinalSection', () => {
  const { isOpen, closeRequestModal } = useRequestModal()
  afterEach(() => closeRequestModal())

  it('рендерит тёмный экран с якорем #final', () => {
    const section = mount(FinalSection).get('section#final')
    expect(section.classes()).toContain('theme-dark')
    expect(section.attributes('data-theme')).toBe('dark')
  })

  it('обе кнопки заявки открывают окно заявки', async () => {
    const wrapper = mount(FinalSection)
    for (const label of ['Оставить заявку на прототип', 'Оставить заявку']) {
      const button = wrapper.findAll('button').find((b) => b.text() === label)
      expect(button).toBeTruthy()
      await button?.trigger('click')
      expect(isOpen.value).toBe(true)
      closeRequestModal()
    }
  })
})
