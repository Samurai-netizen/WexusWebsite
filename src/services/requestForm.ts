/**
 * Заявка на тест прототипа: проверка полей, сборка письма и отправка в FormSubmit.
 * Чистый TS без Vue и DOM — fetch передаётся снаружи, поэтому всё покрыто тестами
 * (src/services/__tests__/requestForm.spec.ts). Окно заявки — src/components/request/.
 */
import { REQUEST_SUBJECT, SEND_TIMEOUT_MS, SEND_URL, SITE_URL, TEAM_EMAIL } from '@/config'

/** То, что посетитель ввёл в форму (как есть, до обрезки пробелов). */
export interface RequestFields {
  name: string
  email: string
  /** сценарий из списка; '' — «Не выбрано» */
  segment: string
  note: string
}

/** Готовая заявка: поля без лишних пробелов + дата согласия. */
export interface RequestData extends RequestFields {
  /** дата, когда в форме дано согласие на обработку ПД (ru-RU, «21.09.2026») */
  date: string
}

/** Итог отправки для экрана «заявка ушла / не получилось». */
export interface RequestResult {
  ok: boolean
  data: RequestData
}

/* ---------- проверка полей ---------- */

/** Имя обязательно. Строка из одних пробелов именем не считается. */
export function isNameValid(value: string): boolean {
  return value.trim() !== ''
}

/* Та же проверка, что у браузера для <input type="email"> (правило WHATWG):
   локальная часть из латиницы и спецсимволов, домен — метки через точку.
   Кириллический домен (почта.рф) браузер тоже пропускает — переводит его
   в punycode, поэтому здесь в метках домена разрешены и не-ASCII символы. */
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9\u0080-\uffff](?:[a-zA-Z0-9\u0080-\uffff-]{0,61}[a-zA-Z0-9\u0080-\uffff])?(?:\.[a-zA-Z0-9\u0080-\uffff](?:[a-zA-Z0-9\u0080-\uffff-]{0,61}[a-zA-Z0-9\u0080-\uffff])?)*$/

/** Почта обязательна и должна быть в формате name@mail.ru. */
export function isEmailValid(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

/** Заявка из полей формы: пробелы по краям убираются, дата — сегодняшняя. */
export function collectRequestData(fields: RequestFields, now: Date = new Date()): RequestData {
  return {
    name: fields.name.trim(),
    email: fields.email.trim(),
    segment: fields.segment,
    note: fields.note.trim(),
    date: now.toLocaleDateString('ru-RU'),
  }
}

/* ---------- письмо и запрос ---------- */

/** Текст для запасного пути — письма из почтового клиента посетителя. */
export function buildLetter(data: RequestData): string {
  return (
    REQUEST_SUBJECT +
    '\n\n' +
    'Имя: ' +
    data.name +
    '\n' +
    'Почта для ответа: ' +
    data.email +
    '\n' +
    'Сценарий: ' +
    (data.segment || 'не указан') +
    '\n' +
    'Что хочет проверить: ' +
    (data.note || 'не указано') +
    '\n\n' +
    'Согласие на обработку персональных данных дано в форме на сайте ' +
    data.date +
    '.'
  )
}

/** Ссылка «Открыть в почте»: письмо команде с готовой темой и текстом. */
export function buildMailtoHref(text: string): string {
  return (
    'mailto:' +
    TEAM_EMAIL +
    '?subject=' +
    encodeURIComponent(REQUEST_SUBJECT) +
    '&body=' +
    encodeURIComponent(text)
  )
}

/** Адрес страницы для письма; со страницы, открытой с диска, — адрес сайта из SITE_URL. */
export function resolvePageUrl(
  protocol: string,
  href: string,
  siteUrl: string = SITE_URL,
): string | undefined {
  return /^https?:$/.test(protocol) ? href : siteUrl || undefined
}

/** Тело запроса к FormSubmit. Русские ключи — это подписи строк в письме-таблице. */
export function buildPayload(data: RequestData, pageUrl?: string): Record<string, string> {
  const payload: Record<string, string> = {
    _subject: REQUEST_SUBJECT,
    _template: 'table',
  }
  // адрес страницы в письме; пустой не отправляем вовсе
  if (pageUrl) payload._url = pageUrl
  /* «Ответить» в почте пойдёт посетителю: сервис берёт адрес из email и _replyto */
  payload._replyto = data.email
  payload.email = data.email
  payload['Имя'] = data.name
  payload['Сценарий'] = data.segment || 'не указан'
  payload['Что хочет проверить'] = data.note || 'не указано'
  payload['Согласие на обработку ПД'] = 'дано в форме на сайте ' + data.date
  return payload
}

export interface SendOptions {
  /** реализация fetch; в тестах — заглушка */
  fetchImpl?: (input: string, init: RequestInit) => Promise<Response>
  /** через сколько мс оборвать запрос */
  timeoutMs?: number
  /** адрес страницы для письма (см. resolvePageUrl) */
  pageUrl?: string
  /** куда отправлять; по умолчанию SEND_URL из config.ts */
  url?: string
}

interface FormSubmitReply {
  success?: unknown
  message?: unknown
}

/**
 * Отправка: JSON на FormSubmit, в ответ { success: "true" | "false", message }.
 * Промис выполняется, если заявка принята (или ждёт подтверждения адреса),
 * и отклоняется с Error при любой другой ошибке, сетевой ошибке или тайм-ауте.
 */
export async function sendRequest(data: RequestData, options: SendOptions = {}): Promise<void> {
  const {
    fetchImpl = typeof fetch === 'function'
      ? (input: string, init: RequestInit) => fetch(input, init)
      : undefined,
    timeoutMs = SEND_TIMEOUT_MS,
    pageUrl,
    url = SEND_URL,
  } = options
  if (!fetchImpl) throw new Error('fetch недоступен')

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(buildPayload(data, pageUrl)),
      signal: ctrl.signal,
    })
    const body: FormSubmitReply = await res.json().catch(() => ({}))
    if (res.ok && String(body.success) === 'true') return
    const message = typeof body.message === 'string' ? body.message : ''
    /* адрес ещё не подтверждён: сервис просит активировать форму,
       но заявку сохраняет и доставит сразу после подтверждения */
    if (/needs activation/i.test(message)) {
      console.warn(
        'FormSubmit: подтвердите адрес ' +
          TEAM_EMAIL +
          ' по ссылке «Activate Form» из письма сервиса.',
      )
      return
    }
    throw new Error(message || 'HTTP ' + res.status)
  } finally {
    clearTimeout(timer)
  }
}
