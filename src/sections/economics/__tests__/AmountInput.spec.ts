import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AmountInput from '../AmountInput.vue'
import { FEE_FIELD } from '../economics.data'

/* степпер тарифа: шаг 10, значение встаёт на сетку (299 → 300 → 310) */
function mountFee() {
  let value = '299'
  const wrapper = mount(AmountInput, {
    props: {
      field: FEE_FIELD,
      modelValue: value,
      'onUpdate:modelValue': (next: string) => {
        value = next
        void wrapper.setProps({ modelValue: next })
      },
    },
  })
  const plus = wrapper.get(`button[aria-label="${FEE_FIELD.increaseLabel}"]`)
  return { wrapper, plus, value: () => value }
}

describe('AmountInput: степпер', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'performance'] }))
  afterEach(() => vi.useRealTimers())

  it('нажатие мышью чуть короче автоповтора — ровно один шаг, click не добавляет второй', async () => {
    const { wrapper, plus, value } = mountFee()
    await plus.trigger('pointerdown', { pointerType: 'mouse' })
    vi.advanceTimersByTime(380)
    await plus.trigger('pointerup', { pointerType: 'mouse' })
    await plus.trigger('click')
    expect(value()).toBe('300')
    wrapper.unmount()
  })

  it('удержание — автоповтор, click после отпускания лишнего шага не даёт', async () => {
    const { wrapper, plus, value } = mountFee()
    await plus.trigger('pointerdown', { pointerType: 'mouse' })
    vi.advanceTimersByTime(420 + 70) /* задержка удержания + один шаг автоповтора */
    await plus.trigger('pointerup', { pointerType: 'mouse' })
    await plus.trigger('click')
    expect(value()).toBe('310')
    wrapper.unmount()
  })

  it('Enter/пробел (click без нажатия указателем) — один шаг', async () => {
    const { wrapper, plus, value } = mountFee()
    await plus.trigger('click')
    expect(value()).toBe('300')
    wrapper.unmount()
  })
})
