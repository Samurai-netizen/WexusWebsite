import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Metrika = typeof import('../metrika')

/* У сервиса состояние на модуль (номер счётчика, отправленные параметры):
   каждый тест получает свежий модуль и чистую страницу. */
async function freshModule(): Promise<Metrika> {
  vi.resetModules()
  return import('../metrika')
}

/** Вызовы, скопившиеся в очереди ym до загрузки tag.js. */
function queued(): unknown[][] {
  return window.ym?.a ?? []
}

beforeEach(() => {
  delete window.ym
  document.head.innerHTML = ''
})
afterEach(() => {
  vi.useRealTimers()
})

describe('запуск счётчика', () => {
  it('ставит очередь, подключает tag.js и инициализирует счётчик', async () => {
    const m = await freshModule()
    m.initMetrika(42)
    const scripts = document.head.querySelectorAll('script')
    expect(scripts).toHaveLength(1)
    expect(scripts[0]!.src).toContain('mc.yandex.ru/metrika/tag.js?id=42')
    expect(scripts[0]!.async).toBe(true)
    expect(queued()[0]!.slice(0, 2)).toEqual([42, 'init'])
  })

  it('повторный запуск и номер 0 ничего не делают', async () => {
    const m = await freshModule()
    m.initMetrika(0)
    expect(window.ym).toBeUndefined()
    m.initMetrika(42)
    m.initMetrika(42)
    expect(document.head.querySelectorAll('script')).toHaveLength(1)
  })
})

describe('цели и параметры', () => {
  it('без счётчика ничего не отправляют и не падают', async () => {
    const m = await freshModule()
    expect(() => {
      m.reachGoal('request_open', { source: 'hero' })
      m.sendParamsOnce({ faq: 'Вопрос' })
      m.trackAction('calc_used')
    }).not.toThrow()
    expect(window.ym).toBeUndefined()
  })

  it('цель уходит в счётчик с параметрами', async () => {
    const m = await freshModule()
    m.initMetrika(42)
    m.reachGoal('request_open', { source: 'hero' })
    expect(queued().at(-1)).toEqual([42, 'reachGoal', 'request_open', { source: 'hero' }])
  })

  it('одинаковый параметр визита отправляется один раз', async () => {
    const m = await freshModule()
    m.initMetrika(42)
    m.trackAction('mode_switch')
    m.trackAction('mode_switch')
    m.trackAction('capacity_select')
    const params = queued().filter((call) => call[1] === 'params')
    expect(params).toEqual([
      [42, 'params', { action: { mode_switch: 1 } }],
      [42, 'params', { action: { capacity_select: 1 } }],
    ])
  })
})

describe('учёт экранов', () => {
  it('экран засчитывается после задержки, один раз', async () => {
    vi.useFakeTimers()
    const m = await freshModule()
    const report = vi.fn<(id: string) => void>()
    const screens = m.createScreenReporter(report, 1000)
    screens.enter('modes')
    vi.advanceTimersByTime(999)
    expect(report).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(report).toHaveBeenCalledWith('modes')
    screens.enter('device')
    vi.advanceTimersByTime(1000)
    screens.enter('modes')
    vi.advanceTimersByTime(1000)
    expect(report.mock.calls).toEqual([['modes'], ['device']])
  })

  it('пролёт по ссылке рейки не засчитывает промежуточные экраны', async () => {
    vi.useFakeTimers()
    const m = await freshModule()
    const report = vi.fn<(id: string) => void>()
    const screens = m.createScreenReporter(report, 1000)
    for (const id of ['problem', 'modes', 'device', 'compare', 'economics']) {
      screens.enter(id)
      vi.advanceTimersByTime(150)
    }
    screens.enter('final')
    vi.advanceTimersByTime(1000)
    expect(report.mock.calls).toEqual([['final']])
  })

  it('stop отменяет ожидающий экран', async () => {
    vi.useFakeTimers()
    const m = await freshModule()
    const report = vi.fn<(id: string) => void>()
    const screens = m.createScreenReporter(report, 1000)
    screens.enter('modes')
    screens.stop()
    vi.advanceTimersByTime(2000)
    expect(report).not.toHaveBeenCalled()
  })
})
