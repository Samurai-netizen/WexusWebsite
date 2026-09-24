/**
 * Геометрия графика «подписка против покупки» — чистая функция без DOM.
 * OwnershipChart.vue рисует по ней SVG декларативно: координаты здесь,
 * цвета — классами в его <style scoped>.
 *
 * Ширину подписей считает переданная функция measure (в браузере — canvas
 * с настоящим шрифтом): по ней считаются поля и коллизии подписей.
 */
import {
  breakEvenMonth,
  easeInOut,
  formatNumber,
  formatRub,
  LIFE_MONTHS,
  paybackMonth,
  r1,
  span,
  type CalcState,
} from './economics'

/** Шрифты подписей — те же, что у .ch-tick / .ch-end / .ch-note и .ch-pill text
 *  (ChartDrawing.vue; плашка меряется F_NOTE) — менять вместе. */
export const F_TICK = '11px "IBM Plex Mono", monospace'
export const F_END = '500 12.5px "IBM Plex Sans", sans-serif'
export const F_NOTE = '12px "IBM Plex Sans", sans-serif'

export type MeasureText = (text: string, font: string) => number

export interface ChartInput {
  /** что нарисовано сейчас (догоняет цель) */
  shown: CalcState
  /** куда идём: шаг и верх оси, горизонт подписей */
  target: CalcState & { step: number }
  width: number
  height: number
  /** доля прочерченного графика при первом показе, 0…1 */
  reveal: number
  measure: MeasureText
}

type Anchor = 'start' | 'middle' | 'end'

interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface ChartText {
  x: number
  y: number
  anchor: Anchor
  text: string
}

export interface ChartPill {
  x: number
  y: number
  w: number
  h: number
  textX: number
  textY: number
  text: string
  /** приглушённая: окупаемость за пределами срока */
  later: boolean
}

export interface ChartEnd {
  kind: 'sub' | 'own'
  /** точка на конце линии */
  cx: number
  cy: number
  label: ChartText
}

/** Всё, что нужно для рисования и для осмотра месяца. */
export interface ChartLayout {
  width: number
  height: number
  /** левое поле, ширина поля графика, верх и низ поля графика */
  ML: number
  PW: number
  MT: number
  BY: number
  /** горизонт и верх оси, по которым посчитана геометрия (нужны перекрестию) */
  months: number
  top: number
  /** ширина прямоугольника clipPath «прочерчивания» */
  revealWidth: number
  yTicks: { y: number; x1: number; x2: number; base: boolean; label: ChartText }[]
  xTicks: ChartText[]
  /** клин экономии между линиями после точки окупаемости */
  wash: string | null
  washNote: ChartText | null
  subLine: { x1: number; y1: number; x2: number; y2: number }
  /** линия покупки: один платёж и дальше ровно */
  ownPath: string | null
  /** узел окупаемости */
  breakEven: { x: number; y: number; guideY1: number; baseY: number } | null
  pill: ChartPill | null
  ends: ChartEnd[]
}

/** Горизонт → X и сумма → Y (нужны и для перекрестия). */
export function monthToX(layout: ChartLayout, m: number): number {
  return layout.ML + (m / layout.months) * layout.PW
}

export function valueToY(layout: ChartLayout, v: number): number {
  return layout.BY - (v / layout.top) * (layout.BY - layout.MT)
}

/** Координата указателя по X (от левого края svg) → ближайший месяц. */
export function xToMonth(layout: ChartLayout, x: number): number {
  return Math.round(((x - layout.ML) / layout.PW) * layout.months)
}

/** Шаг подписей оси времени делит горизонт без остатка. */
const X_STEPS = [3, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60]

export function layoutChart(input: ChartInput): ChartLayout | null {
  const { shown: s, target: t, width: W, height: H, measure } = input
  if (!W || !H) return null
  const fee = s.fee
  const price = s.price
  const months = s.months
  const total = fee * months

  /* поля: слева — по самой длинной подписи оси ₽, справа — по суммам на концах линий;
     на узком графике суммы уходят внутрь поля, чтобы не отнимать ширину */
  const narrow = W < 480
  const yValues: number[] = []
  for (let v = 0; v <= t.top + 1e-6; v += t.step) yValues.push(v)
  const ML = 14 + Math.max(...yValues.map((v) => measure(formatNumber(v), F_TICK)))
  const MR = narrow
    ? 8
    : 22 +
      Math.max(
        measure(formatRub(t.fee * t.months), F_END),
        measure(formatRub(t.price), F_END),
        measure(formatRub(fee * months), F_END),
        measure(formatRub(price), F_END),
      )
  const MT = 12
  const MB = 30
  const PW = W - ML - MR
  const PH = H - MT - MB
  const BY = MT + PH
  const X = (m: number) => ML + (m / months) * PW
  const Y = (v: number) => BY - (v / s.top) * PH

  const revealWidth = r1(ML - 8 + (W - ML + 16) * easeInOut(input.reveal))

  /* сетка и подписи оси ₽ */
  const yTicks: ChartLayout['yTicks'] = []
  for (const v of yValues) {
    const y = r1(Y(v))
    if (y < MT - 1) continue
    yTicks.push({
      y,
      x1: r1(ML),
      x2: r1(ML + PW),
      base: v === 0,
      label: { x: r1(ML - 10), y: r1(y + 3.5), anchor: 'end', text: formatNumber(v) },
    })
  }

  /* подписи оси времени: шаг делит горизонт без остатка, одна подпись на ~60 px ширины */
  const maxTicks = Math.max(2, Math.min(7, Math.floor(PW / 60)))
  let xStep = t.months
  for (const st of X_STEPS) {
    if (t.months % st === 0 && t.months / st <= maxTicks) {
      xStep = st
      break
    }
  }
  const xTicks: ChartText[] = []
  for (let m = 0; m <= t.months; m += xStep) {
    if (m > months + 0.01) break
    const last = m === t.months
    xTicks.push({
      x: r1(X(m)),
      y: r1(BY + 20),
      anchor: m === 0 ? 'start' : last ? 'end' : 'middle',
      text: m + (last ? ' мес' : ''),
    })
  }

  const yP = Y(price)
  const yT = Y(total)
  const xE = X(months)
  const bmf = breakEvenMonth(fee, price) /* дробный: узел стоит между делениями */
  const xB = X(bmf)
  const pays = bmf <= months
  const slope = (BY - yT) / PW /* наклон линии подписки, px на px */

  /* ——— вспомогательное: подпись не должна лежать на линии, на узле или на другой подписи ——— */
  const taken: Box[] = [] /* уже занятые прямоугольники */
  const segHit = (b: Box, x1: number, y1: number, x2: number, y2: number) => {
    const xa = Math.max(b.x, Math.min(x1, x2))
    const xb = Math.min(b.x + b.w, Math.max(x1, x2))
    if (xa > xb) return false
    const k = (y2 - y1) / (x2 - x1 || 1e-6)
    const ya = y1 + k * (xa - x1)
    const yb = y1 + k * (xb - x1)
    return !(Math.min(ya, yb) > b.y + b.h || Math.max(ya, yb) < b.y)
  }
  const boxHit = (a: Box, b: Box) =>
    !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y)
  const free = (b: Box, gutter = false) => {
    if (b.x < ML - 2 || b.y < MT - 8 || b.y + b.h > BY - 2) return false
    if (b.x + b.w > ML + PW + (gutter ? MR - 10 : 2)) return false
    if (segHit(b, ML, BY, xE, yT)) return false /* линия подписки */
    if (price > 0 && segHit(b, ML, yP, xE, yP)) return false /* линия покупки */
    if (pays && xB >= b.x - 6 && xB <= b.x + b.w + 6 && yP >= b.y - 6 && yP <= b.y + b.h + 6)
      return false /* узел */
    return !taken.some((o) => boxHit(b, o))
  }

  /* ——— суммы на концах линий ——— */
  interface EndDraft {
    y: number
    v: number
    kind: 'sub' | 'own'
    sloped: boolean
    lx: number
    ly: number | null
    anchor: Anchor
  }
  const ends: EndDraft[] = [
    { y: yT, v: total, kind: 'sub', sloped: true, lx: 0, ly: null, anchor: 'start' },
  ]
  if (price > 0)
    ends.push({ y: yP, v: price, kind: 'own', sloped: false, lx: 0, ly: null, anchor: 'start' })
  let hi = ends[0]!
  let lo: EndDraft | null = null
  if (ends.length === 2) {
    hi = ends[0]!.y <= ends[1]!.y ? ends[0]! : ends[1]!
    lo = hi === ends[0] ? ends[1]! : ends[0]!
  }
  if (narrow) {
    /* внутри поля: сначала над своей линией, иначе под ней — с поправкой на наклон,
       чтобы линия не перечёркивала цифры */
    for (const p of [hi, lo]) {
      if (!p) continue
      const w = measure(formatRub(p.v), F_END)
      /* у конца линии, а если там тесно — левее по своей же линии, где зазор шире */
      const spots: [number, number][] = []
      for (const dx of [0, 0.2 * PW, 0.4 * PW]) {
        const ly = p.sloped ? p.y + slope * dx : p.y /* своя линия в этой точке */
        const above = ly - 10
        const below = ly + 17 + (p.sloped ? slope * (w + 8) : 0)
        spots.push([dx, p === hi ? above : below], [dx, p === hi ? below : above])
      }
      let dxUsed = 0
      for (const [dx, base] of spots) {
        const b = { x: xE - 9 - dx - w, y: base - 14, w: w + 6, h: 19 }
        if (free(b)) {
          dxUsed = dx
          p.ly = base
          taken.push(b)
          break
        }
      }
      if (p.ly == null) {
        /* свободного места нет — прижимаем к своей линии сверху */
        dxUsed = 0
        p.ly = Math.min(Math.max(p.y - 10, MT + 11), BY - 2)
        taken.push({ x: xE - 9 - w, y: p.ly - 14, w: w + 6, h: 19 })
      }
      p.lx = xE - 6 - dxUsed
      p.anchor = 'end'
    }
  } else {
    /* на поле справа: близкие подписи разводим по вертикали */
    for (const p of ends) {
      p.lx = xE + 12
      p.ly = p.y + 4.5
      p.anchor = 'start'
    }
    if (lo && hi.ly != null && lo.ly != null) {
      if (lo.ly - hi.ly < 18) {
        const mid = (hi.y + lo.y) / 2 + 4.5
        hi.ly = mid - 9
        lo.ly = mid + 9
      }
      const dn = Math.max(0, lo.ly - (BY + 2))
      const up = Math.max(0, MT + 8 - hi.ly)
      hi.ly += up - dn
      lo.ly += up - dn
    }
    for (const p of ends) {
      taken.push({ x: p.lx - 3, y: (p.ly ?? 0) - 14, w: measure(formatRub(p.v), F_END) + 6, h: 19 })
    }
  }

  /* ——— экономия: клин между линиями после точки окупаемости ——— */
  let wash: string | null = null
  let washNote: ChartText | null = null
  if (pays) {
    wash = `${r1(xB)},${r1(yP)} ${r1(xE)},${r1(yT)} ${r1(xE)},${r1(yP)}`
    const note = 'экономия ' + formatRub(total - price)
    const nw = measure(note, F_NOTE)
    const nx = xE - 12
    const ny = yP - 10
    const nb = { x: nx - nw - 3, y: ny - 14, w: nw + 6, h: 19 }
    /* подпись клина — только если целиком помещается между линиями */
    if (!narrow && nb.x > xB + 16 && free(nb)) {
      washNote = { x: r1(nx), y: r1(ny), anchor: 'end', text: note }
      taken.push(nb)
    }
  }

  /* ——— линии: подписка растёт без остановки, покупка — один платёж и дальше ровно ——— */
  const subLine = { x1: r1(ML), y1: r1(BY), x2: r1(xE), y2: r1(yT) }
  const ownPath = price > 0 ? `M${r1(ML)} ${r1(BY)}V${r1(yP)}H${r1(xE)}` : null

  /* ——— плашка окупаемости: первое место, где она никому не мешает; иначе её нет ——— */
  const pillAt = (
    text: string,
    spots: [number, number, Anchor][],
    later: boolean,
  ): ChartPill | null => {
    const w = measure(text, F_NOTE) + 24
    const h = 24
    for (const [sx, sy, anchor] of spots) {
      const b = { x: sx - (anchor === 'end' ? w : 0), y: sy, w, h }
      if (free(b, !narrow)) {
        taken.push(b)
        return {
          x: r1(b.x),
          y: r1(b.y),
          w: r1(w),
          h,
          textX: r1(b.x + w / 2),
          textY: r1(b.y + 16),
          text,
          later,
        }
      }
    }
    return null /* месяц окупаемости всё равно есть в цифрах слева */
  }

  let breakEven: ChartLayout['breakEven'] = null
  let pill: ChartPill | null = null
  if (pays) {
    breakEven = { x: r1(xB), y: r1(yP), guideY1: r1(yP + 8), baseY: r1(BY) }
    pill = pillAt(
      'окупается · ' + paybackMonth(fee, price) + '-й мес',
      [
        [xB - 12, yP - 12 - 24, 'end'] /* над узлом слева — там обычно пусто */,
        [xB + 12, yP + 12, 'start'] /* под узлом справа */,
        [xB + 12, yP - 12 - 24, 'start'] /* над узлом справа */,
        [xB - 12, yP + 12, 'end'] /* под узлом слева */,
        [ML + 6, MT - 6, 'start'] /* верхний левый угол поля */,
      ],
      false,
    )
  } else if (bmf < Infinity) {
    /* окупаемость за пределами срока — приглушённая плашка у правого края */
    const bm = paybackMonth(fee, price)
    const later =
      bm <= LIFE_MONTHS ? 'окупится на ' + bm + '-м мес →' : 'не окупится за ' + span(LIFE_MONTHS)
    pill = pillAt(
      later,
      [
        [xE - 8, yP - 12 - 24, 'end'] /* над линией покупки */,
        [xE - 8, yP + 12, 'end'] /* под линией покупки */,
        [ML + 6, MT - 6, 'start'],
      ],
      true,
    )
  }

  return {
    width: W,
    height: H,
    ML,
    PW,
    MT,
    BY,
    months,
    top: s.top,
    revealWidth,
    yTicks,
    xTicks,
    wash,
    washNote,
    subLine,
    ownPath,
    breakEven,
    pill,
    ends: ends.map((p) => ({
      kind: p.kind,
      cx: r1(xE),
      cy: r1(p.y),
      label: { x: r1(p.lx), y: r1(p.ly ?? 0), anchor: p.anchor, text: formatRub(p.v) },
    })),
  }
}

/**
 * Где встать подсказке: сбоку от перекрестия, где есть место;
 * на узком графике — над точками или под ними.
 */
export function placeTip(p: {
  x: number
  ys: number
  yo: number
  tipW: number
  tipH: number
  width: number
  height: number
}): { left: number; top: number } {
  const { x, ys, yo, tipW: w, tipH: th, width: W, height: H } = p
  let left: number
  let top: number
  if (x + 16 + w <= W || x - 16 - w >= 0) {
    left = x + 16 + w <= W ? x + 16 : x - 16 - w
    top = Math.max(0, Math.min((ys + yo) / 2 - th / 2, H - th))
  } else {
    left = Math.max(0, Math.min(x - w / 2, W - w))
    top = Math.min(ys, yo) - th - 14
    if (top < 0) top = Math.min(Math.max(ys, yo) + 14, H - th)
  }
  return { left: Math.round(left), top: Math.round(top) }
}
