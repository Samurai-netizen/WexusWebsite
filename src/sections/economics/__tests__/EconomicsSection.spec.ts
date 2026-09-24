import { beforeAll, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EconomicsSection from '../EconomicsSection.vue'

describe('EconomicsSection', () => {
  // в jsdom нет canvas: ширины подписей не измерить, график просто не рисуется
  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })

  it('рендерится с числами по умолчанию и нужными id', () => {
    const wrapper = mount(EconomicsSection)
    const html = wrapper.html()
    for (const id of [
      'economics',
      'fee',
      'price',
      'feeHint',
      'priceHint',
      'termHint',
      'result',
      'chartTitle',
    ]) {
      expect(wrapper.find(`#${id}`).exists()).toBe(true)
    }
    expect(wrapper.find<HTMLInputElement>('#fee').element.value).toBe('299')
    expect(wrapper.find<HTMLInputElement>('#price').element.value).toBe('7990')
    expect(wrapper.find<HTMLInputElement>('input[name="term"][value="5"]').element.checked).toBe(
      true,
    )
    expect(html).toContain('27-й месяц')
    expect(html).toContain('через 2 года 3 месяца')
    wrapper.unmount()
  })

  it('степпер меняет тариф по сетке шага', async () => {
    const wrapper = mount(EconomicsSection)
    await wrapper.find('button[aria-label="Увеличить тариф"]').trigger('click')
    expect(wrapper.find<HTMLInputElement>('#fee').element.value).toBe('300')
    wrapper.unmount()
  })

  it('выбор срока меняет итог', async () => {
    const wrapper = mount(EconomicsSection)
    await wrapper.find('input[name="term"][value="1"]').setValue(true)
    expect(wrapper.text()).toContain('Подписка за 1 год')
    wrapper.unmount()
  })
})
