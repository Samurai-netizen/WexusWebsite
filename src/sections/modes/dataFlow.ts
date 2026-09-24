/**
 * Живая схема обмена данными — данные связей и чистая математика анимации.
 * Здесь нет Vue и DOM: всё, что можно посчитать без браузера, считается тут
 * и покрыто тестами (__tests__/dataFlow.spec.ts). Сам «движок» кадров —
 * в useDataFlowAnimation.ts.
 */
import type { Mode } from './modes.data'

/* ------------------------------------------------------------
   Узлы и связи
   ------------------------------------------------------------ */

/** Диоды узлов схемы. В разметке у них id="led-<id>". */
export type LedId = 'wexus' | 'router' | 'c0' | 'c1' | 'c2'

export interface SchemeLink {
  /** в каком режиме связь видна */
  mode: Mode
  /** узел на старте пути (диод мигает при отправке «туда») */
  from: LedId
  /** узел на конце пути */
  to: LedId
  /** геометрия связи, координаты viewBox — перенесены из исходника как есть */
  d: string
}

/** Все связи в порядке документа: сначала режим «в домашней сети», затем «без интернета» */
export const SCHEME_LINKS: readonly SchemeLink[] = [
  // режим 1: через существующий Wi-Fi — всё идёт через роутер
  { mode: 'local', from: 'wexus', to: 'router', d: 'M 225 172 C 254 168, 262 118, 273 82' },
  { mode: 'local', from: 'router', to: 'c0', d: 'M 407 54 C 426 40, 444 42, 461 54' },
  { mode: 'local', from: 'router', to: 'c1', d: 'M 407 74 C 436 96, 444 152, 499 178' },
  { mode: 'local', from: 'router', to: 'c2', d: 'M 368 95 C 378 165, 404 252, 461 288' },
  // режим 2: собственная сеть устройства — клиенты напрямую к WEXUS
  { mode: 'solo', from: 'wexus', to: 'c0', d: 'M 292 158 C 386 152, 426 92, 461 68' },
  { mode: 'solo', from: 'wexus', to: 'c1', d: 'M 298 181 C 360 182, 430 182, 499 182' },
  { mode: 'solo', from: 'wexus', to: 'c2', d: 'M 292 200 C 356 244, 410 282, 461 292' },
]

/** Связь вместе с её номером в SCHEME_LINKS (номер — ключ для элементов в DOM) */
export interface IndexedLink extends SchemeLink {
  index: number
}

export function linksOfMode(mode: Mode): IndexedLink[] {
  return SCHEME_LINKS.map((link, index) => ({ ...link, index })).filter((l) => l.mode === mode)
}

/**
 * Какие диоды подтверждают, что связи режима поднялись, — в порядке документа.
 * Повторяет исходник буквально: там выбирались «диоды внутри группы режима
 * + диод корпуса». Диоды клиентов лежат вне групп режимов, поэтому в режиме
 * «без интернета» мигает только корпус, а в домашней сети — корпус и роутер.
 */
export function confirmLeds(mode: Mode): LedId[] {
  return mode === 'local' ? ['wexus', 'router'] : ['wexus']
}

/** Начальная точка пути «M x y …» — там пакеты «запаркованы» до первого запуска */
export function pathStart(d: string): { x: number; y: number } {
  const match = /^\s*M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/i.exec(d)
  if (!match) throw new Error(`Путь должен начинаться с M x y: ${d}`)
  return { x: Number(match[1]), y: Number(match[2]) }
}

/* ------------------------------------------------------------
   Пакеты
   ------------------------------------------------------------ */

export const MIN_SCALE = 1 /* базовый размер пакета */
export const MAX_SCALE = 2.5 /* самый крупный — в 2.5 раза больше */
export const BASE_R = 2.4 /* радиус при базовом размере, в единицах viewBox */
export const BASE_SPEED = 92 /* единиц в секунду при базовом размере */
export const FADE_LEN = 26 /* путь на появление и угасание, в единицах viewBox */
export const FADE_MAX = 0.3 /* но не больше этой доли короткой связи */
/** непрозрачность головы пакета на полном ходу */
export const HEAD_OPACITY = 0.92

/** Шлейф: две догоняющие точки меньшего размера — пакет читается как комета */
export const TAIL = [
  { lag: 0.045, radius: 0.66, opacity: 0.42 },
  { lag: 0.085, radius: 0.42, opacity: 0.2 },
] as const

/** Первая пауза перед пакетом на связи: 0…1800 мс */
export const FIRST_PAUSE_MAX = 1800
/** Случайные паузы между пакетами: 500…3900 мс */
export const PAUSE_MIN = 500
export const PAUSE_SPREAD = 3400

/**
 * Доля пути на появление и угасание. Короткая связь получает пропорционально
 * короткую зону, длинная — фиксированную: пакет не тлеет полпути и не
 * заезжает полупрозрачным на корпус устройства.
 */
export function fadeShare(len: number): number {
  return Math.min(FADE_MAX, FADE_LEN / len)
}

/** Масштаб пакета из случайного числа 0…1 */
export function packetScale(random: number): number {
  return MIN_SCALE + random * (MAX_SCALE - MIN_SCALE)
}

/** Длительность пролёта, мс: крупнее — медленнее */
export function packetDuration(len: number, scale: number): number {
  return (len / (BASE_SPEED / scale)) * 1000
}

/** Пауза до следующего пакета из случайного числа 0…1, мс */
export function nextPause(random: number): number {
  return PAUSE_MIN + random * PAUSE_SPREAD
}

/** Направление из случайного числа: пакеты ходят в обе стороны */
export function packetDirection(random: number): 1 | -1 {
  return random < 0.5 ? 1 : -1
}

/** Расстояние от начала пути при прогрессе t (0…1) и направлении dir */
export function distanceAlong(t: number, dir: 1 | -1, len: number): number {
  return dir > 0 ? t * len : (1 - t) * len
}

/** Плавное появление у отправителя и угасание у получателя: множитель 0…1 */
export function edgeFade(t: number, fade: number): number {
  return Math.min(1, t / fade, (1 - t) / fade)
}

/* ------------------------------------------------------------
   Прочерчивание связей при показе экрана и смене режима
   ------------------------------------------------------------ */

/*
  Связи сначала прочерчиваются сплошными — «канал поднялся», — держат
  короткую паузу и распадаются в пунктир: по каналу пошли данные.
  Период штриха при этом не меняется: просветы раскрываются все сразу,
  каждый на своём месте, поэтому линия не дробится рывками и короткая
  связь меняется так же, как длинная. Кривая — мягкая out-кривая:
  фирменная экспонента здесь съела бы всё изменение в первой трети.
*/
export const TRAIL_DRAW = 620
export const TRAIL_STEP = 90
export const TRAIL_HOLD = 120
export const TRAIL_MELT = 300
export const TRAIL_DRAW_EASE = 'cubic-bezier(.22,1,.36,1)'
export const TRAIL_EASE = 'cubic-bezier(.33,1,.68,1)'

/** Когда i-я связь режима начинает распадаться в пунктир, мс от запуска */
export function trailMeltAt(i: number): number {
  return TRAIL_DRAW + i * TRAIL_STEP + TRAIL_HOLD
}

/**
 * Когда на i-ю связь может выйти первый пакет, мс от запуска: не раньше,
 * чем она дорисована и стала пунктиром (+200 мс и случайные 0…1200 мс).
 */
export function firstPacketAt(i: number, random: number): number {
  return trailMeltAt(i) + TRAIL_MELT + 200 + random * 1200
}

/** Узлы по очереди подтверждают, что связь поднялась: задержка i-го диода, мс */
export function ledConfirmDelay(i: number): number {
  return 260 + i * 120
}

/** Пауза между первым прочерчиванием и запуском пакетов, мс */
export const PACKETS_START_DELAY = 700

/** Доля экрана, после которой схема «оживает» (и ниже которой засыпает) */
export const LIVE_THRESHOLD = 0.35
