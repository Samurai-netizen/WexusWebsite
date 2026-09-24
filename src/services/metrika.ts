/**
 * Яндекс Метрика: запуск счётчика, цели и параметры визитов.
 * Вся аналитика страницы идёт только через этот файл. Имя, почта и текст
 * из формы заявки в Метрику не отправляются — ни в целях, ни в параметрах.
 *
 * Цели (их идентификаторы заведены в интерфейсе Метрики) — только про заявку.
 * Всё остальное — параметры визитов: они появляются в отчёте «Параметры визитов»
 * без настройки в интерфейсе.
 *
 * Без запущенного счётчика (пререндер, тесты, npm run dev) функции ничего не делают.
 */

type Ym = ((id: number, method: string, ...args: unknown[]) => void) & {
  a?: unknown[][]
  l?: number
}

declare global {
  interface Window {
    ym?: Ym
  }
}

/** Цели, заведённые в интерфейсе Метрики (тип «JavaScript-событие», условие «совпадает»). */
export type MetrikaGoal = 'request_open' | 'request_sent' | 'request_failed'

/** Какая кнопка открыла окно заявки. */
export type RequestSource = 'topbar' | 'hero' | 'final' | 'footer'

/** Действия посетителя на экранах — параметр визита action. */
export type MetrikaAction = 'mode_switch' | 'capacity_select' | 'calc_used'

/** Экран засчитывается, если посетитель пробыл на нём столько, мс.
    Плавный переход по ссылке рейки пролетает промежуточные экраны быстрее. */
export const SCREEN_DWELL_MS = 2000

const TAG_URL = 'https://mc.yandex.ru/metrika/tag.js?id='

let counterId = 0
/** уже отправленные параметры: каждый — раз за загрузку страницы */
const sentOnce = new Set<string>()

/**
 * Запустить счётчик. Только в браузере. Повторный вызов ничего не делает.
 * Параметры init — из кода счётчика, выданного Метрикой (без ecommerce:
 * интернет-магазина на сайте нет). trackHash выключен по умолчанию: рейка
 * меняет #якорь, и каждая смена считалась бы отдельным просмотром.
 */
export function initMetrika(id: number): void {
  if (!id || window.ym) return
  // очередь: вызовы до загрузки tag.js копятся в ym.a, скрипт разберёт их сам
  const ym: Ym = (...args) => {
    ;(ym.a ??= []).push(args)
  }
  ym.l = Date.now()
  window.ym = ym
  counterId = id

  const script = document.createElement('script')
  script.async = true
  script.src = TAG_URL + id
  document.head.append(script)

  ym(id, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  })
}

/** Достигнута цель. */
export function reachGoal(goal: MetrikaGoal, params?: Record<string, string>): void {
  if (typeof window === 'undefined' || !window.ym || !counterId) return
  window.ym(counterId, 'reachGoal', goal, params)
}

/** Параметр визита — один раз за загрузку страницы (повтор не шлётся). */
export function sendParamsOnce(params: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.ym || !counterId) return
  const key = JSON.stringify(params)
  if (sentOnce.has(key)) return
  sentOnce.add(key)
  window.ym(counterId, 'params', params)
}

/** Действие на экране (переключил режим, выбрал объём, трогал калькулятор). */
export function trackAction(action: MetrikaAction): void {
  sendParamsOnce({ action: { [action]: 1 } })
}

/**
 * Учёт экранов с задержкой: enter(id) при каждой смене активного экрана,
 * report(id) — если посетитель задержался на экране SCREEN_DWELL_MS.
 * Каждый экран сообщается один раз.
 */
export function createScreenReporter(
  report: (id: string) => void,
  dwellMs: number = SCREEN_DWELL_MS,
) {
  const reported = new Set<string>()
  let timer: ReturnType<typeof setTimeout> | undefined

  return {
    enter(id: string) {
      clearTimeout(timer)
      if (reported.has(id)) return
      timer = setTimeout(() => {
        reported.add(id)
        report(id)
      }, dwellMs)
    },
    stop() {
      clearTimeout(timer)
    },
  }
}
