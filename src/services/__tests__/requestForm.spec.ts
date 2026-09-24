import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { REQUEST_SUBJECT, SEND_URL, TEAM_EMAIL } from '@/config'
import {
  buildLetter,
  buildMailtoHref,
  buildPayload,
  collectRequestData,
  isEmailValid,
  isNameValid,
  resolvePageUrl,
  sendRequest,
  type RequestData,
} from '../requestForm'

const data: RequestData = {
  name: 'Анна',
  email: 'anna@mail.ru',
  segment: 'Фото и видеосъёмка',
  note: 'Автономность',
  date: '21.09.2026',
}
type FetchImpl = (url: string, init: RequestInit) => Promise<Response>

const empty: RequestData = { ...data, segment: '', note: '' }

/** Ответ сервера, как его вернул бы fetch */
function reply(body: unknown, status = 200): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })
}

describe('проверка полей', () => {
  it('имя: пустое и из пробелов — ошибка', () => {
    expect(isNameValid('Анна')).toBe(true)
    expect(isNameValid('')).toBe(false)
    expect(isNameValid('   ')).toBe(false)
  })

  it('почта: формат name@mail.ru', () => {
    expect(isEmailValid('name@mail.ru')).toBe(true)
    expect(isEmailValid(' name@mail.ru ')).toBe(true)
    expect(isEmailValid('a@b')).toBe(true) // как у браузера: домен без точки допустим
    expect(isEmailValid('name@почта.рф')).toBe(true)
    expect(isEmailValid('')).toBe(false)
    expect(isEmailValid('name')).toBe(false)
    expect(isEmailValid('name@')).toBe(false)
    expect(isEmailValid('@mail.ru')).toBe(false)
    expect(isEmailValid('na me@mail.ru')).toBe(false)
    expect(isEmailValid('name@-mail.ru')).toBe(false)
  })

  it('заявка из полей: пробелы обрезаны, дата по-русски', () => {
    const result = collectRequestData(
      { name: ' Анна ', email: ' anna@mail.ru ', segment: '', note: '  ' },
      new Date(2026, 8, 21),
    )
    expect(result).toEqual({
      name: 'Анна',
      email: 'anna@mail.ru',
      segment: '',
      note: '',
      date: '21.09.2026',
    })
  })
})

describe('buildLetter', () => {
  it('собирает текст письма', () => {
    expect(buildLetter(data)).toBe(
      REQUEST_SUBJECT +
        '\n\nИмя: Анна\nПочта для ответа: anna@mail.ru\nСценарий: Фото и видеосъёмка\n' +
        'Что хочет проверить: Автономность\n\n' +
        'Согласие на обработку персональных данных дано в форме на сайте 21.09.2026.',
    )
  })

  it('пустые необязательные поля — «не указан / не указано»', () => {
    const text = buildLetter(empty)
    expect(text).toContain('Сценарий: не указан\n')
    expect(text).toContain('Что хочет проверить: не указано\n')
  })
})

describe('buildMailtoHref', () => {
  it('кодирует тему и текст', () => {
    const href = buildMailtoHref('Строка 1\nИмя & почта?')
    expect(href).toBe(
      'mailto:' +
        TEAM_EMAIL +
        '?subject=' +
        encodeURIComponent(REQUEST_SUBJECT) +
        '&body=%D0%A1%D1%82%D1%80%D0%BE%D0%BA%D0%B0%201%0A%D0%98%D0%BC%D1%8F%20%26%20%D0%BF%D0%BE%D1%87%D1%82%D0%B0%3F',
    )
    expect(decodeURIComponent(href.split('&body=')[1] ?? '')).toBe('Строка 1\nИмя & почта?')
  })
})

describe('resolvePageUrl', () => {
  it('на сайте — адрес страницы, с диска — SITE_URL или ничего', () => {
    expect(resolvePageUrl('https:', 'https://wexus.ru/#final', '')).toBe('https://wexus.ru/#final')
    expect(resolvePageUrl('http:', 'http://localhost:5173/', '')).toBe('http://localhost:5173/')
    expect(resolvePageUrl('file:', 'file:///x.html', 'https://wexus.ru/')).toBe('https://wexus.ru/')
    expect(resolvePageUrl('file:', 'file:///x.html', '')).toBeUndefined()
  })
})

describe('buildPayload', () => {
  it('поля FormSubmit и русские подписи в нужном порядке', () => {
    const payload = buildPayload(data, 'https://wexus.ru/')
    expect(payload).toEqual({
      _subject: REQUEST_SUBJECT,
      _template: 'table',
      _url: 'https://wexus.ru/',
      _replyto: 'anna@mail.ru',
      email: 'anna@mail.ru',
      Имя: 'Анна',
      Сценарий: 'Фото и видеосъёмка',
      'Что хочет проверить': 'Автономность',
      'Согласие на обработку ПД': 'дано в форме на сайте 21.09.2026',
    })
    expect(Object.keys(payload)).toEqual([
      '_subject',
      '_template',
      '_url',
      '_replyto',
      'email',
      'Имя',
      'Сценарий',
      'Что хочет проверить',
      'Согласие на обработку ПД',
    ])
  })

  it('без адреса страницы _url не отправляется, пустые поля подписаны', () => {
    const payload = buildPayload(empty)
    expect(payload).not.toHaveProperty('_url')
    expect(payload['Сценарий']).toBe('не указан')
    expect(payload['Что хочет проверить']).toBe('не указано')
  })
})

describe('sendRequest', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('успех: POST JSON на SEND_URL', async () => {
    const fetchImpl = vi.fn<FetchImpl>(async () => reply({ success: 'true', message: 'ok' }))
    await expect(sendRequest(data, { fetchImpl, pageUrl: 'https://wexus.ru/' })).resolves.toBe(
      undefined,
    )
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(url).toBe(SEND_URL)
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    })
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(JSON.parse(init.body as string)).toEqual(buildPayload(data, 'https://wexus.ru/'))
  })

  it('success как булево true тоже успех', async () => {
    const fetchImpl = vi.fn<FetchImpl>(async () => reply({ success: true }))
    await expect(sendRequest(data, { fetchImpl })).resolves.toBe(undefined)
  })

  it('адрес ещё не подтверждён — заявка считается принятой', async () => {
    const fetchImpl = vi.fn<FetchImpl>(async () =>
      reply({
        success: 'false',
        message: 'This form needs Activation. We have sent you an email.',
      }),
    )
    await expect(sendRequest(data, { fetchImpl })).resolves.toBe(undefined)
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(TEAM_EMAIL))
  })

  it('сервис ответил ошибкой — текст ошибки из ответа', async () => {
    const fetchImpl = vi.fn<FetchImpl>(async () =>
      reply({ success: 'false', message: 'Spam detected' }),
    )
    await expect(sendRequest(data, { fetchImpl })).rejects.toThrow('Spam detected')
  })

  it('HTTP-ошибка без JSON — «HTTP <код>»', async () => {
    const fetchImpl = vi.fn<FetchImpl>(async () => reply('<html>Bad gateway</html>', 502))
    await expect(sendRequest(data, { fetchImpl })).rejects.toThrow('HTTP 502')
  })

  it('HTTP-ошибка даже при success: "true" — не успех', async () => {
    const fetchImpl = vi.fn<FetchImpl>(async () => reply({ success: 'true' }, 500))
    await expect(sendRequest(data, { fetchImpl })).rejects.toThrow('HTTP 500')
  })

  it('сетевая ошибка пробрасывается', async () => {
    const fetchImpl = vi.fn<FetchImpl>(async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(sendRequest(data, { fetchImpl })).rejects.toThrow('Failed to fetch')
  })

  it('тайм-аут обрывает запрос', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn<FetchImpl>(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('The operation was aborted.', 'AbortError')),
          )
        }),
    )
    // ошибку ловим сразу, чтобы промис не считался необработанным, пока идут таймеры
    const caught = sendRequest(data, { fetchImpl, timeoutMs: 15000 }).catch((err: unknown) => err)
    await vi.advanceTimersByTimeAsync(14999)
    expect(fetchImpl.mock.calls[0]?.[1].signal?.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    const err = await caught
    expect(err).toBeInstanceOf(DOMException)
    expect((err as DOMException).name).toBe('AbortError')
  })

  it('после ответа таймер снят', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn<FetchImpl>(async () => reply({ success: 'true' }))
    await sendRequest(data, { fetchImpl })
    expect(vi.getTimerCount()).toBe(0)
  })
})
