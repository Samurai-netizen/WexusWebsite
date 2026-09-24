/**
 * Калькулятор владения: чистая математика и тексты (без Vue и DOM).
 *
 * Считает по числам пользователя. Никаких зашитых «экономий»: цена устройства
 * не определена, её вводит сам посетитель. Срок использования тоже выбирает
 * посетитель: окупаемость от него не зависит, а итог за срок — зависит.
 *
 * Геометрия графика — в chartLayout.ts, компоненты только вызывают эти функции.
 */

/** Срок использования — отдельный ввод; дольше среднего срока службы накопителя не предлагаем. */
export const LIFE_MONTHS = 120

/** Цифры и график догоняют новые числа за это время (мс). */
export const TWEEN_MS = 480
/** Первый показ: линии прочерчиваются слева направо за это время (мс). */
export const REVEAL_MS = 1100
/** Итог для скринридера — без дребезга при наборе. */
export const ANNOUNCE_DELAY_MS = 700

/** Что нарисовано сейчас: при смене чисел эти поля плавно догоняют цель. */
export interface CalcState {
  /** тариф облака, ₽ в месяц */
  fee: number
  /** цена WEXUS, ₽ разово */
  price: number
  /** горизонт графика, месяцев (срок × 12) */
  months: number
  /** верх оси ₽ */
  top: number
}

/** Куда идём: то же плюс шаг оси ₽ (он не анимируется). */
export interface CalcTarget extends CalcState {
  step: number
}

/* ——— числа и слова ——— */

/** 17940 → «17 940» (разделитель групп — неразрывный пробел, как у ru-RU). */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('ru-RU')
}

/** 17940 → «17 940 ₽» */
export function formatRub(n: number): string {
  return formatNumber(n) + ' ₽'
}

/** Округление до десятых — для координат SVG. */
export function r1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Русская форма слова после числа: 1 год, 2 года, 5 лет, 11–14 лет. */
export function plural(n: number, one: string, few: string, many: string): string {
  const t = n % 100
  const d = n % 10
  if (t >= 11 && t <= 14) return many
  if (d === 1) return one
  if (d >= 2 && d <= 4) return few
  return many
}

export function yearWord(n: number): string {
  return plural(n, 'год', 'года', 'лет')
}

export function monthWord(n: number): string {
  return plural(n, 'месяц', 'месяца', 'месяцев')
}

/** 27 → «2 года 3 месяца» */
export function span(m: number): string {
  const y = Math.floor(m / 12)
  const r = m % 12
  const s: string[] = []
  if (y) s.push(y + ' ' + yearWord(y))
  if (r) s.push(r + ' ' + monthWord(r))
  return s.join(' ')
}

export function easeOut(p: number): number {
  return 1 - Math.pow(1 - p, 3)
}

export function easeInOut(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/* ——— ввод ——— */

/** Текст поля → число в допустимых пределах (пустое и нечисловое — 0). */
export function parseAmount(raw: string, min: number, max: number): number {
  return clamp(+raw || 0, min, max)
}

/**
 * Шаг степпера: значение встаёт на сетку шага (299 → 300 вверх, 290 вниз).
 * null — упёрлись в предел, менять нечего.
 */
export function stepAmount(
  raw: string,
  dir: 1 | -1,
  field: { step: number; min: number; max: number },
): number | null {
  const st = field.step || 1
  const cur = +raw || 0
  let next = dir > 0 ? Math.floor(cur / st) * st + st : Math.ceil(cur / st) * st - st
  next = clamp(next, field.min, field.max)
  return next === cur ? null : next
}

/** Поле по ширине числа: единица стоит вплотную к цифрам. */
export function inputWidth(value: string): string {
  return 'calc(' + (Math.max(1, value.length) + 0.4) + 'ch + var(--spacing-s3))'
}

/* ——— модель ——— */

/** «Круглый» шаг оси ₽: 3–5 делений по 1, 2, 2,5 или 5 × 10ⁿ. */
export function niceStep(max: number): number {
  const raw = max / 3.5
  const mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10))
  const n = raw / mag
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag
}

/** Цель по числам пользователя: горизонт, шаг и верх оси ₽. */
export function makeTarget(fee: number, price: number, termYears: number): CalcTarget {
  const months = termYears * 12
  const max = Math.max(fee * months, price, 1000)
  const step = niceStep(max)
  return { fee, price, months, step, top: Math.ceil(max / step - 1e-9) * step }
}

/** Только анимируемые поля (шаг оси берётся всегда у цели). */
export function toState(t: CalcState): CalcState {
  return { fee: t.fee, price: t.price, months: t.months, top: t.top }
}

/** Промежуточный кадр перехода: k от 0 (from) до 1 (to). */
export function lerpState(from: CalcState, to: CalcState, k: number): CalcState {
  return {
    fee: from.fee + (to.fee - from.fee) * k,
    price: from.price + (to.price - from.price) * k,
    months: from.months + (to.months - from.months) * k,
    top: from.top + (to.top - from.top) * k,
  }
}

/**
 * Точка окупаемости — единственное место, где записано правило окупаемости.
 * Дробный месяц (нужен графику: узел стоит между делениями) или Infinity,
 * если одной из цифр нет.
 */
export function breakEvenMonth(fee: number, price: number): number {
  return fee > 0 && price > 0 ? price / fee : Infinity
}

/** Месяц окупаемости целым числом — для текстов: «27-й месяц». */
export function paybackMonth(fee: number, price: number): number {
  return Math.ceil(breakEvenMonth(fee, price))
}

/* ——— три цифры и месячная стоимость ——— */

export interface StatsView {
  /** «5 лет» */
  horizon: string
  total: string
  totalSub: string
  payback: string
  paybackSub: string
  saveLabel: string
  save: string
  saveSub: string
  /** покупка отбивается в пределах срока — узел окупаемости горит */
  hasPayback: boolean
  /** в пересчёте на месяц: подписка и покупка / срок */
  perMonthSub: string
  perMonthOwn: string
  /** ширины полосок, «44.5%» */
  perMonthSubWidth: string
  perMonthOwnWidth: string
}

/**
 * Тексты трёх цифр и полосок. Суммы берутся у анимируемого состояния
 * (они «перетекают»), выводы — у цели (они не должны мигать на полпути).
 */
export function statsView(shown: CalcState, target: CalcState): StatsView {
  const s = shown
  const t = target
  const years = t.months / 12
  const hz = years + ' ' + yearWord(years)
  const total = s.fee * s.months
  const hasFee = t.fee > 0
  const both = hasFee && t.price > 0
  const bmT = paybackMonth(t.fee, t.price)
  const pays = bmT <= t.months

  /* месяц окупаемости от срока не зависит — срок решает только, успеет ли покупка окупиться */
  let payback: string
  let paybackSub: string
  if (!both) {
    payback = '—'
    paybackSub = hasFee ? 'подставь цену WEXUS' : 'нужны обе цифры'
  } else if (bmT > LIFE_MONTHS) {
    payback = 'позже ' + span(LIFE_MONTHS)
    paybackSub = 'дольше среднего срока службы накопителя'
  } else {
    payback = bmT + '-й месяц'
    paybackSub = pays ? 'через ' + span(bmT) : 'позже выбранного срока'
  }

  const diff = total - s.price
  const signed = (diff < 0 ? '−' : '') + formatRub(Math.abs(diff))
  let saveLabel: string
  let save: string
  let saveSub: string
  if (both && !pays) {
    saveLabel = 'Разница за ' + hz
    save = signed
    saveSub = 'на этом сроке подписка дешевле'
  } else {
    saveLabel = 'Экономия за ' + hz
    save = both ? signed : '—'
    saveSub = both ? 'остаётся у тебя' : '\u00a0'
  }

  const own = s.months > 0 ? s.price / s.months : 0
  const mx = Math.max(s.fee, own, 1)

  return {
    horizon: hz,
    total: hasFee ? formatRub(total) : '—',
    totalSub: hasFee
      ? formatRub(s.fee) + ' × ' + Math.round(s.months) + ' мес'
      : 'укажи свой тариф',
    payback,
    paybackSub,
    saveLabel,
    save,
    saveSub,
    hasPayback: pays,
    perMonthSub: formatRub(s.fee),
    perMonthOwn: formatRub(own),
    perMonthSubWidth: ((s.fee / mx) * 100).toFixed(1) + '%',
    perMonthOwnWidth: ((own / mx) * 100).toFixed(1) + '%',
  }
}

/** Итог одной фразой — для скринридера (aria-live). */
export function summary(t: CalcState): string {
  if (t.fee <= 0) {
    return 'Укажи, сколько стоит твой тариф сейчас, — страница пересчитает расходы за выбранный срок.'
  }
  const years = t.months / 12
  const total = t.fee * t.months
  let s =
    'За ' +
    years +
    ' ' +
    yearWord(years) +
    ' подписка по ' +
    formatNumber(t.fee) +
    ' ₽ в месяц обойдётся в ' +
    formatNumber(total) +
    ' ₽. '
  if (t.price <= 0) return s + 'Подставь цену WEXUS, чтобы увидеть точку окупаемости.'
  const bm = paybackMonth(t.fee, t.price)
  const buy = 'Разовая покупка за ' + formatNumber(t.price) + ' ₽ '
  if (bm <= t.months) {
    s +=
      buy +
      'окупается на ' +
      bm +
      '-м месяце, экономия за срок — ' +
      formatNumber(total - t.price) +
      ' ₽.'
  } else if (bm <= LIFE_MONTHS) {
    s +=
      buy +
      'окупается на ' +
      bm +
      '-м месяце — это позже выбранного срока, на нём подписка дешевле на ' +
      formatNumber(t.price - total) +
      ' ₽.'
  } else {
    s +=
      buy + 'окупается позже ' + span(LIFE_MONTHS) + ' — дольше среднего срока службы накопителя.'
  }
  return (
    s +
    ' В пересчёте на месяц это ' +
    formatNumber(t.price / t.months) +
    ' ₽ против ' +
    formatNumber(t.fee) +
    ' ₽.'
  )
}

/* ——— осмотр месяца на графике ——— */

/** Номер месяца в пределах горизонта. */
export function clampMonth(m: number, months: number): number {
  return clamp(m, 0, months)
}

/** С какого месяца начинать осмотр с клавиатуры: точка окупаемости, иначе конец срока. */
export function focusMonth(t: CalcState): number {
  return clampMonth(paybackMonth(t.fee, t.price), t.months)
}

/**
 * Клавиша на графике → действие.
 * Стрелки — по месяцам, Shift со стрелкой — по годам, Home/End — края, Escape — убрать.
 * null — клавиша не наша, событие не трогаем.
 */
export function monthForKey(
  key: string,
  shiftKey: boolean,
  current: number | null,
  months: number,
): { month: number | null } | null {
  let m = current ?? 0
  const st = shiftKey ? 12 : 1
  if (key === 'ArrowRight') m += st
  else if (key === 'ArrowLeft') m -= st
  else if (key === 'Home') m = 0
  else if (key === 'End') m = months
  else if (key === 'Escape') return { month: null }
  else return null
  return { month: clampMonth(m, months) }
}

export interface MonthReadout {
  /** месяц, округлённый и зажатый в нарисованный горизонт */
  month: number
  title: string
  sub: string
  own: string
  diffLabel: string
  diff: string
  /** накоплено подпиской к этому месяцу, ₽ */
  spent: number
}

/** Подсказка для месяца m: сколько ушло на подписку и сколько — на покупку. */
export function monthReadout(shown: CalcState, hoverMonth: number): MonthReadout {
  const m = Math.max(0, Math.min(Math.round(shown.months), hoverMonth))
  const spent = shown.fee * m
  const diff = spent - shown.price
  return {
    month: m,
    title: m === 0 ? 'день покупки' : m + '-й месяц',
    sub: formatRub(spent),
    own: formatRub(shown.price),
    diffLabel: diff >= 0 ? 'экономия' : 'до окупаемости',
    diff: formatRub(Math.abs(diff)),
    spent,
  }
}
