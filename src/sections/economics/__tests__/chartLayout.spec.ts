import { describe, expect, it } from 'vitest'
import { makeTarget, toState } from '../economics'
import { layoutChart, monthToX, placeTip, valueToY, xToMonth } from '../chartLayout'

/** Моноширинная «линейка»: 7 px на символ — достаточно для проверки геометрии. */
const measure = (text: string) => text.length * 7

function layout(fee: number, price: number, years: number, width = 800, height = 300) {
  const t = makeTarget(fee, price, years)
  return layoutChart({ shown: toState(t), target: t, width, height, reveal: 1, measure })
}

describe('layoutChart', () => {
  it('без размера холста ничего не рисует (пререндер)', () => {
    expect(layout(299, 7990, 5, 0, 0)).toBeNull()
  })

  it('по умолчанию есть клин экономии, узел окупаемости и плашка', () => {
    const l = layout(299, 7990, 5)!
    expect(l.wash).not.toBeNull()
    expect(l.breakEven).not.toBeNull()
    expect(l.pill?.text).toBe('окупается · 27-й мес')
    expect(l.pill?.later).toBe(false)
    expect(l.ends.map((e) => e.kind)).toEqual(['sub', 'own'])
  })

  it('подписи оси времени делят горизонт без остатка, последняя — с «мес»', () => {
    const l = layout(299, 7990, 5)!
    const labels = l.xTicks.map((t) => t.text)
    expect(labels[0]).toBe('0')
    expect(labels[labels.length - 1]).toBe('60 мес')
    expect(l.xTicks[0]!.anchor).toBe('start')
    expect(l.xTicks[l.xTicks.length - 1]!.anchor).toBe('end')
  })

  it('ось ₽ начинается с базовой линии', () => {
    const l = layout(299, 7990, 5)!
    expect(l.yTicks[0]!.base).toBe(true)
    expect(l.yTicks[0]!.y).toBe(l.BY)
  })

  it('окупаемость позже срока — приглушённая плашка, без клина', () => {
    const l = layout(299, 7990, 1)!
    expect(l.wash).toBeNull()
    expect(l.breakEven).toBeNull()
    expect(l.pill?.later).toBe(true)
    expect(l.pill?.text).toBe('окупится на 27-м мес →')
  })

  it('окупаемость дольше 10 лет', () => {
    const l = layout(50, 7990, 1)!
    expect(l.pill?.text).toBe('не окупится за 10 лет')
  })

  it('без цены — нет линии покупки и плашки', () => {
    const l = layout(299, 0, 5)!
    expect(l.ownPath).toBeNull()
    expect(l.pill).toBeNull()
    expect(l.ends).toHaveLength(1)
  })

  it('на узком графике суммы уходят внутрь поля', () => {
    const l = layout(299, 7990, 5, 360, 240)!
    for (const e of l.ends) expect(e.label.anchor).toBe('end')
    expect(l.washNote).toBeNull()
  })

  it('перевод координат туда и обратно', () => {
    const l = layout(299, 7990, 5)!
    expect(xToMonth(l, monthToX(l, 27))).toBe(27)
    expect(valueToY(l, 0)).toBe(l.BY)
  })

  it('прочерчивание: при reveal 0 клип почти нулевой', () => {
    const t = makeTarget(299, 7990, 5)
    const l0 = layoutChart({
      shown: toState(t),
      target: t,
      width: 800,
      height: 300,
      reveal: 0,
      measure,
    })!
    const l1 = layoutChart({
      shown: toState(t),
      target: t,
      width: 800,
      height: 300,
      reveal: 1,
      measure,
    })!
    expect(l0.revealWidth).toBeLessThan(l0.ML)
    expect(l1.revealWidth).toBeGreaterThan(800)
  })
})

describe('placeTip', () => {
  it('справа от перекрестия, если есть место', () => {
    expect(
      placeTip({ x: 100, ys: 100, yo: 200, tipW: 180, tipH: 80, width: 800, height: 300 }),
    ).toEqual({
      left: 116,
      top: 110,
    })
  })
  it('слева, если справа тесно', () => {
    expect(
      placeTip({ x: 700, ys: 100, yo: 200, tipW: 180, tipH: 80, width: 800, height: 300 }).left,
    ).toBe(504)
  })
  it('на узком графике — над точками', () => {
    const p = placeTip({ x: 150, ys: 150, yo: 200, tipW: 184, tipH: 80, width: 300, height: 300 })
    expect(p).toEqual({ left: 58, top: 56 })
  })
})
