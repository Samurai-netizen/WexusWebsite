import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

import RequestModal from '../RequestModal.vue'
import { useRequestModal } from '@/composables/useRequestModal'

/* Поведение окна заявки: гонки открытия/закрытия и итог отправки,
   пришедший, пока окно было закрыто. Задержки окна (220 мс закрытие,
   260 мс фокус) прокручиваем поддельными таймерами. */

const sendRequest = vi.fn<(...args: unknown[]) => Promise<void>>()
vi.mock('@/services/requestForm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/requestForm')>()),
  sendRequest: (...args: unknown[]) => sendRequest(...args),
}))

/* В jsdom у <dialog> нет showModal/close — подменяем простыми версиями */
const showModal = vi.fn<(this: HTMLDialogElement) => void>(function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
})
const close = vi.fn<(this: HTMLDialogElement) => void>(function (this: HTMLDialogElement) {
  this.removeAttribute('open')
})

const { isOpen, openRequestModal, closeRequestModal } = useRequestModal()

/** больше любой задержки окна: закрытие 220 мс, фокус 260 мс */
const SETTLE_MS = 400

let wrapper: VueWrapper | undefined

async function settle() {
  await flushPromises()
  vi.advanceTimersByTime(SETTLE_MS)
  await flushPromises()
}

async function openModal() {
  openRequestModal()
  await settle()
}

async function closeModal() {
  closeRequestModal()
  await settle()
}

async function submitFilledForm(w: VueWrapper) {
  await w.get('#fName').setValue('Анна')
  await w.get('#fMail').setValue('anna@mail.ru')
  await w.get('#fConsent').setValue(true)
  await w.get('form').trigger('submit')
}

function dialogEl(w: VueWrapper) {
  return w.get('dialog').element as HTMLDialogElement
}

beforeEach(() => {
  // setImmediate не подделываем: на нём работает flushPromises
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
  })
  HTMLDialogElement.prototype.showModal = showModal
  HTMLDialogElement.prototype.close = close
  showModal.mockClear()
  close.mockClear()
  sendRequest.mockReset()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  wrapper = mount(RequestModal, { attachTo: document.body })
})

afterEach(async () => {
  closeRequestModal()
  await settle()
  wrapper?.unmount()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('RequestModal', () => {
  it('итог, пришедший при закрытом окне, показывается при следующем открытии и получает фокус', async () => {
    const w = wrapper!
    let resolve!: () => void
    sendRequest.mockReturnValue(new Promise<void>((r) => (resolve = r)))

    await openModal()
    await submitFilledForm(w)
    await closeModal()
    expect(dialogEl(w).open).toBe(false)

    resolve()
    await flushPromises()
    await openModal()

    expect(w.get('#requestForm').attributes('hidden')).toBeDefined()
    expect(w.get('#formDone').attributes('hidden')).toBeUndefined()
    expect(w.get('#doneTitle').text()).toBe('Заявка отправлена')
    expect(document.activeElement).toBe(w.get('#doneTitle').element)
  })

  it('повторное открытие во время закрытия отменяет закрытие', async () => {
    const w = wrapper!
    await openModal()
    closeRequestModal()
    await flushPromises()
    vi.advanceTimersByTime(100)
    openRequestModal()
    await settle()

    expect(close).not.toHaveBeenCalled()
    expect(dialogEl(w).open).toBe(true)
    expect(w.get('dialog').classes()).toContain('is-open')
  })

  it('браузер закрыл окно сам (событие close) — состояние сбрасывается, окно открывается снова', async () => {
    const w = wrapper!
    await openModal()
    const el = dialogEl(w)
    el.removeAttribute('open')
    el.dispatchEvent(new Event('close'))
    await settle()
    expect(isOpen.value).toBe(false)

    await openModal()
    expect(isOpen.value).toBe(true)
    expect(showModal).toHaveBeenCalledTimes(2)
    expect(el.open).toBe(true)
  })

  it('«Попробовать снова» после ошибки отправляет те же данные', async () => {
    const w = wrapper!
    sendRequest.mockRejectedValueOnce(new Error('HTTP 500')).mockResolvedValueOnce()

    await openModal()
    await submitFilledForm(w)
    await settle()
    expect(w.get('#doneTitle').text()).toBe('Не получилось отправить')

    await w.get('#retrySend').trigger('click')
    await settle()

    expect(sendRequest).toHaveBeenCalledTimes(2)
    expect(sendRequest.mock.calls[1]?.[0]).toEqual(sendRequest.mock.calls[0]?.[0])
    expect(sendRequest.mock.calls[0]?.[0]).toMatchObject({ name: 'Анна', email: 'anna@mail.ru' })
    expect(w.get('#doneTitle').text()).toBe('Заявка отправлена')
  })

  it('выделение текста, отпущенное над затемнением, не закрывает окно', async () => {
    const w = wrapper!
    await openModal()
    await w.get('#fName').trigger('pointerdown')
    await w.get('dialog').trigger('click')
    expect(isOpen.value).toBe(true)

    await w.get('dialog').trigger('pointerdown')
    await w.get('dialog').trigger('click')
    expect(isOpen.value).toBe(false)
  })
})
