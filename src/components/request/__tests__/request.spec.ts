import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import RequestForm from '../RequestForm.vue'
import RequestResult from '../RequestResult.vue'
import { COPY_LABEL, submitHint } from '../request.data'
import { TEAM_EMAIL } from '@/config'
import type { RequestData } from '@/services/requestForm'

const sendRequest = vi.fn<(...args: unknown[]) => Promise<void>>()
vi.mock('@/services/requestForm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/requestForm')>()),
  sendRequest: (...args: unknown[]) => sendRequest(...args),
}))

const data: RequestData = {
  name: 'Анна',
  email: 'anna@mail.ru',
  segment: '',
  note: '',
  date: '21.09.2026',
}

describe('submitHint', () => {
  it('подсказка зависит от согласия и отправки', () => {
    expect(submitHint(false, false)).toBe('Кнопка станет активной, когда ты отметишь согласие.')
    expect(submitHint(false, true)).toBe('Заявка уйдёт письмом команде WEXUS.')
    expect(submitHint(true, true)).toBe('Отправляем заявку команде WEXUS…')
  })
})

describe('RequestForm', () => {
  beforeEach(() => {
    sendRequest.mockReset()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  async function fill(wrapper: ReturnType<typeof mount>) {
    await wrapper.find('#fName').setValue(' Анна ')
    await wrapper.find('#fMail').setValue('anna@mail.ru')
    await wrapper.find('#fConsent').setValue(true)
  }

  it('кнопка отправки выключена, пока нет согласия', async () => {
    const wrapper = mount(RequestForm)
    const submit = wrapper.find('#formSubmit')
    expect((wrapper.find('#fConsent').element as HTMLInputElement).checked).toBe(false)
    expect(submit.attributes('disabled')).toBeDefined()
    await wrapper.find('#fConsent').setValue(true)
    expect(submit.attributes('disabled')).toBeUndefined()
    expect(wrapper.find('#formHint').text()).toBe('Заявка уйдёт письмом команде WEXUS.')
  })

  it('ошибка поля появляется при уходе с поля и гаснет при вводе', async () => {
    const wrapper = mount(RequestForm)
    const mail = wrapper.find('#fMail')
    await mail.setValue('name')
    expect(mail.element.closest('.field')?.classList.contains('is-bad')).toBe(false)
    await mail.trigger('blur')
    expect(mail.element.closest('.field')?.classList.contains('is-bad')).toBe(true)
    await mail.setValue('name@mail.ru')
    expect(mail.element.closest('.field')?.classList.contains('is-bad')).toBe(false)
  })

  it('успех: состояние отправки, затем сброс формы и result ok', async () => {
    let resolve!: () => void
    sendRequest.mockReturnValue(new Promise<void>((r) => (resolve = r)))
    const wrapper = mount(RequestForm)
    await fill(wrapper)
    await wrapper.find('form').trigger('submit')

    const submit = wrapper.find('#formSubmit')
    expect(submit.attributes('aria-disabled')).toBe('true')
    expect(submit.text()).toBe('Отправляем…')
    expect(wrapper.find('#fConsent').attributes('disabled')).toBeDefined()
    // повторное нажатие не отправляет вторую заявку
    await wrapper.find('form').trigger('submit')
    expect(sendRequest).toHaveBeenCalledTimes(1)
    expect(sendRequest.mock.calls[0]?.[0]).toMatchObject({ name: 'Анна', email: 'anna@mail.ru' })

    resolve()
    await flushPromises()
    expect(wrapper.emitted('result')?.[0]?.[0]).toMatchObject({ ok: true })
    expect((wrapper.find('#fName').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('#fConsent').element as HTMLInputElement).checked).toBe(false)
    expect(submit.attributes('aria-disabled')).toBeUndefined()
  })

  it('ошибка отправки: форма не сбрасывается, result не ok', async () => {
    sendRequest.mockRejectedValue(new Error('HTTP 500'))
    const wrapper = mount(RequestForm)
    await fill(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('result')?.[0]?.[0]).toMatchObject({ ok: false })
    expect((wrapper.find('#fName').element as HTMLInputElement).value).toBe(' Анна ')
  })

  it('с пустыми полями не отправляет', async () => {
    const wrapper = mount(RequestForm)
    await wrapper.find('#fConsent').setValue(true)
    await wrapper.find('form').trigger('submit')
    expect(sendRequest).not.toHaveBeenCalled()
    expect(wrapper.findAll('.field.is-bad')).toHaveLength(2)
  })
})

describe('RequestResult', () => {
  it('успех: только кнопка «Закрыть»', () => {
    const wrapper = mount(RequestResult, { props: { result: { ok: true, data } } })
    expect(wrapper.find('#doneTitle').text()).toBe('Заявка отправлена')
    expect(wrapper.find('#doneText').text()).toContain('anna@mail.ru')
    expect(wrapper.find('#doneClose').exists()).toBe(true)
    expect(wrapper.find('#mailtoLink').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('is-error')
  })

  it('ошибка: готовое письмо, mailto, копирование и повтор', async () => {
    const wrapper = mount(RequestResult, { props: { result: { ok: false, data } } })
    expect(wrapper.classes()).toContain('is-error')
    expect(wrapper.find('#doneTitle').text()).toBe('Не получилось отправить')
    expect(wrapper.find('#doneText').text()).toContain(TEAM_EMAIL)
    expect((wrapper.find('#doneMail').element as HTMLTextAreaElement).value).toContain('Имя: Анна')
    expect(wrapper.find('#mailtoLink').attributes('href')).toMatch(/^mailto:/)
    expect(wrapper.find('#doneClose').exists()).toBe(false)
    await wrapper.find('#retrySend').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  describe('копирование письма', () => {
    afterEach(() => {
      vi.restoreAllMocks()
      Reflect.deleteProperty(navigator, 'clipboard')
    })

    /* execCommand не сработал — копирование решает Clipboard API */
    async function copyWith(writeText: () => Promise<void>) {
      document.execCommand = vi.fn<() => boolean>(() => false)
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
      const wrapper = mount(RequestResult, { props: { result: { ok: false, data } } })
      const button = wrapper.findAll('button').find((b) => b.text() === COPY_LABEL)
      await button?.trigger('click')
      await flushPromises()
      return button?.text()
    }

    it('Clipboard API скопировал — «Текст скопирован»', async () => {
      expect(await copyWith(() => Promise.resolve())).toBe('Текст скопирован')
    })

    it('Clipboard API отказал — просим скопировать вручную, а не врём об успехе', async () => {
      expect(await copyWith(() => Promise.reject(new Error('denied')))).toBe('Скопируй вручную')
    })
  })
})
