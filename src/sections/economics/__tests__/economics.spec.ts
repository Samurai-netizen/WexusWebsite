import { describe, expect, it } from 'vitest'
import {
  breakEvenMonth,
  focusMonth,
  formatNumber,
  formatRub,
  inputWidth,
  lerpState,
  makeTarget,
  monthForKey,
  monthReadout,
  monthWord,
  niceStep,
  parseAmount,
  paybackMonth,
  plural,
  span,
  statsView,
  stepAmount,
  summary,
  toState,
  yearWord,
} from '../economics'
import { FEE_FIELD, PRICE_FIELD, TERM_YEARS, termSrSuffix } from '../economics.data'

/** неразрывный пробел — разделитель групп в ru-RU */
const NB = '\u00a0'

describe('plural / yearWord / monthWord', () => {
  it.each([
    [1, 'год'],
    [2, 'года'],
    [3, 'года'],
    [4, 'года'],
    [5, 'лет'],
    [7, 'лет'],
    [10, 'лет'],
    [11, 'лет'],
    [12, 'лет'],
    [13, 'лет'],
    [14, 'лет'],
    [21, 'год'],
    [22, 'года'],
    [25, 'лет'],
    [101, 'год'],
    [111, 'лет'],
    [112, 'лет'],
  ])('%i → %s', (n, word) => {
    expect(yearWord(n)).toBe(word)
  })

  it('месяцы: 1 месяц, 3 месяца, 11 месяцев', () => {
    expect(monthWord(1)).toBe('месяц')
    expect(monthWord(3)).toBe('месяца')
    expect(monthWord(11)).toBe('месяцев')
    expect(monthWord(0)).toBe('месяцев')
  })

  it('plural — общий для любых слов', () => {
    expect(plural(14, 'a', 'b', 'c')).toBe('c')
    expect(plural(34, 'a', 'b', 'c')).toBe('b')
  })

  it('скрытые подписи вариантов срока', () => {
    expect(TERM_YEARS.map(termSrSuffix)).toEqual([' год', ' года', ' года', ' лет', ' лет', ' лет'])
  })
})

describe('span', () => {
  it('годы и месяцы', () => {
    expect(span(27)).toBe('2 года 3 месяца')
    expect(span(12)).toBe('1 год')
    expect(span(11)).toBe('11 месяцев')
    expect(span(1)).toBe('1 месяц')
    expect(span(61)).toBe('5 лет 1 месяц')
    expect(span(120)).toBe('10 лет')
  })
  it('ноль — пустая строка', () => {
    expect(span(0)).toBe('')
  })
})

describe('форматирование', () => {
  it('ru-RU с неразрывным пробелом и округлением', () => {
    expect(formatNumber(17940)).toBe(`17${NB}940`)
    expect(formatNumber(133.17)).toBe('133')
    expect(formatNumber(999)).toBe('999')
    expect(formatRub(9950)).toBe(`9${NB}950 ₽`)
  })
  it('ширина поля по числу символов', () => {
    expect(inputWidth('299')).toBe('calc(3.4ch + var(--spacing-s3))')
    expect(inputWidth('')).toBe('calc(1.4ch + var(--spacing-s3))')
  })
})

describe('ввод', () => {
  it('parseAmount: пустое и мусор — 0, выход за пределы зажимается', () => {
    expect(parseAmount('', 0, 99999)).toBe(0)
    expect(parseAmount('abc', 0, 99999)).toBe(0)
    expect(parseAmount('-50', 0, 99999)).toBe(0)
    expect(parseAmount('150000', 0, 99999)).toBe(99999)
    expect(parseAmount('299', 0, 99999)).toBe(299)
  })

  it('stepAmount встаёт на сетку шага', () => {
    expect(stepAmount('299', 1, FEE_FIELD)).toBe(300)
    expect(stepAmount('299', -1, FEE_FIELD)).toBe(290)
    expect(stepAmount('300', 1, FEE_FIELD)).toBe(310)
    expect(stepAmount('7990', 1, PRICE_FIELD)).toBe(8000)
    expect(stepAmount('7990', -1, PRICE_FIELD)).toBe(7500)
  })

  it('stepAmount у пределов возвращает null', () => {
    expect(stepAmount('0', -1, FEE_FIELD)).toBeNull()
    expect(stepAmount('99999', 1, FEE_FIELD)).toBeNull()
    expect(stepAmount('99995', 1, FEE_FIELD)).toBe(99999)
    expect(stepAmount('', 1, FEE_FIELD)).toBe(10)
  })
})

describe('модель', () => {
  it('niceStep: 1 / 2 / 2,5 / 5 × 10ⁿ', () => {
    expect(niceStep(17940)).toBe(10000)
    expect(niceStep(1000)).toBe(500)
    expect(niceStep(7000)).toBe(2000)
    expect(niceStep(8000)).toBe(2500)
  })

  it('makeTarget: горизонт, шаг и верх оси', () => {
    const t = makeTarget(299, 7990, 5)
    expect(t).toEqual({ fee: 299, price: 7990, months: 60, step: 10000, top: 20000 })
  })

  it('makeTarget: при нулях ось не схлопывается (минимум 1000)', () => {
    const t = makeTarget(0, 0, 1)
    expect(t.months).toBe(12)
    expect(t.top).toBeGreaterThanOrEqual(1000)
  })

  it.each([
    [1, 12],
    [2, 24],
    [3, 36],
    [5, 60],
    [7, 84],
    [10, 120],
  ])('срок %i лет — %i месяцев, верх оси покрывает итог подписки', (years, months) => {
    const t = makeTarget(299, 7990, years)
    expect(t.months).toBe(months)
    expect(t.top).toBeGreaterThanOrEqual(299 * months)
    expect(t.top).toBeGreaterThanOrEqual(7990)
  })

  it('lerpState: концы и середина', () => {
    const a = toState(makeTarget(100, 1000, 1))
    const b = toState(makeTarget(300, 3000, 2))
    expect(lerpState(a, b, 0)).toEqual(a)
    expect(lerpState(a, b, 1)).toEqual(b)
    expect(lerpState(a, b, 0.5).fee).toBe(200)
  })

  it('paybackMonth: округление вверх и крайние случаи', () => {
    expect(paybackMonth(299, 7990)).toBe(27)
    expect(paybackMonth(100, 1000)).toBe(10)
    expect(paybackMonth(0, 7990)).toBe(Infinity)
    expect(paybackMonth(299, 0)).toBe(Infinity)
  })

  it('breakEvenMonth: дробный месяц для графика, paybackMonth — он же, округлённый вверх', () => {
    expect(breakEvenMonth(299, 7990)).toBeCloseTo(26.72, 2)
    expect(breakEvenMonth(0, 7990)).toBe(Infinity)
    expect(paybackMonth(299, 7990)).toBe(Math.ceil(breakEvenMonth(299, 7990)))
  })
})

describe('statsView', () => {
  const view = (fee: number, price: number, years: number) => {
    const t = makeTarget(fee, price, years)
    return statsView(t, t)
  }

  it('значения по умолчанию совпадают с исходной разметкой', () => {
    const v = view(299, 7990, 5)
    expect(v.horizon).toBe('5 лет')
    expect(v.total).toBe(`17${NB}940 ₽`)
    expect(v.totalSub).toBe('299 ₽ × 60 мес')
    expect(v.payback).toBe('27-й месяц')
    expect(v.paybackSub).toBe('через 2 года 3 месяца')
    expect(v.saveLabel).toBe('Экономия за 5 лет')
    expect(v.save).toBe(`9${NB}950 ₽`)
    expect(v.saveSub).toBe('остаётся у тебя')
    expect(v.hasPayback).toBe(true)
    expect(v.perMonthSub).toBe('299 ₽')
    expect(v.perMonthOwn).toBe('133 ₽')
    expect(v.perMonthSubWidth).toBe('100.0%')
    expect(v.perMonthOwnWidth).toBe('44.5%')
  })

  it('итог подписки за каждый срок', () => {
    expect(TERM_YEARS.map((y) => view(299, 7990, y).total)).toEqual([
      `3${NB}588 ₽`,
      `7${NB}176 ₽`,
      `10${NB}764 ₽`,
      `17${NB}940 ₽`,
      `25${NB}116 ₽`,
      `35${NB}880 ₽`,
    ])
  })

  it('окупаемость позже срока: «Разница», минус и подписка дешевле', () => {
    const v = view(299, 7990, 2)
    expect(v.payback).toBe('27-й месяц')
    expect(v.paybackSub).toBe('позже выбранного срока')
    expect(v.saveLabel).toBe('Разница за 2 года')
    expect(v.save).toBe(`−814 ₽`)
    expect(v.saveSub).toBe('на этом сроке подписка дешевле')
    expect(v.hasPayback).toBe(false)
  })

  it('окупаемость позже 10 лет', () => {
    const v = view(50, 7990, 10)
    expect(v.payback).toBe('позже 10 лет')
    expect(v.paybackSub).toBe('дольше среднего срока службы накопителя')
  })

  it('нулевой тариф', () => {
    const v = view(0, 7990, 5)
    expect(v.total).toBe('—')
    expect(v.totalSub).toBe('укажи свой тариф')
    expect(v.payback).toBe('—')
    expect(v.paybackSub).toBe('нужны обе цифры')
    expect(v.save).toBe('—')
    expect(v.saveSub).toBe('\u00a0')
    expect(v.hasPayback).toBe(false)
  })

  it('нулевая цена', () => {
    const v = view(299, 0, 5)
    expect(v.payback).toBe('—')
    expect(v.paybackSub).toBe('подставь цену WEXUS')
    expect(v.saveLabel).toBe('Экономия за 5 лет')
    expect(v.save).toBe('—')
    expect(v.perMonthOwnWidth).toBe('0.0%')
  })

  it('окупаемость ровно в последний месяц срока считается успевшей', () => {
    const v = view(100, 1200, 1)
    expect(v.payback).toBe('12-й месяц')
    expect(v.paybackSub).toBe('через 1 год')
    expect(v.save).toBe('0 ₽')
    expect(v.hasPayback).toBe(true)
  })
})

describe('summary', () => {
  it('без тарифа', () => {
    expect(summary(makeTarget(0, 7990, 5))).toBe(
      'Укажи, сколько стоит твой тариф сейчас, — страница пересчитает расходы за выбранный срок.',
    )
  })
  it('без цены', () => {
    expect(summary(makeTarget(299, 0, 1))).toBe(
      `За 1 год подписка по 299 ₽ в месяц обойдётся в 3${NB}588 ₽. Подставь цену WEXUS, чтобы увидеть точку окупаемости.`,
    )
  })
  it('окупается в срок', () => {
    expect(summary(makeTarget(299, 7990, 5))).toBe(
      `За 5 лет подписка по 299 ₽ в месяц обойдётся в 17${NB}940 ₽. Разовая покупка за 7${NB}990 ₽ окупается на 27-м месяце, экономия за срок — 9${NB}950 ₽. В пересчёте на месяц это 133 ₽ против 299 ₽.`,
    )
  })
  it('окупается позже срока', () => {
    expect(summary(makeTarget(299, 7990, 2))).toContain(
      'окупается на 27-м месяце — это позже выбранного срока, на нём подписка дешевле на 814 ₽.',
    )
  })
  it('окупается позже 10 лет', () => {
    expect(summary(makeTarget(50, 7990, 10))).toContain(
      'окупается позже 10 лет — дольше среднего срока службы накопителя.',
    )
  })
})

describe('осмотр месяца', () => {
  it('focusMonth: точка окупаемости, иначе конец срока', () => {
    expect(focusMonth(makeTarget(299, 7990, 5))).toBe(27)
    expect(focusMonth(makeTarget(299, 7990, 1))).toBe(12)
    expect(focusMonth(makeTarget(0, 7990, 3))).toBe(36)
  })

  it('monthForKey: стрелки, Shift, Home/End, Escape, чужие клавиши', () => {
    expect(monthForKey('ArrowRight', false, null, 60)).toEqual({ month: 1 })
    expect(monthForKey('ArrowRight', true, 10, 60)).toEqual({ month: 22 })
    expect(monthForKey('ArrowLeft', true, 5, 60)).toEqual({ month: 0 })
    expect(monthForKey('ArrowRight', true, 55, 60)).toEqual({ month: 60 })
    expect(monthForKey('Home', false, 30, 60)).toEqual({ month: 0 })
    expect(monthForKey('End', false, 3, 60)).toEqual({ month: 60 })
    expect(monthForKey('Escape', false, 3, 60)).toEqual({ month: null })
    expect(monthForKey('a', false, 3, 60)).toBeNull()
  })

  it('monthReadout: день покупки, экономия и «до окупаемости»', () => {
    const s = toState(makeTarget(299, 7990, 5))
    const start = monthReadout(s, 0)
    expect(start.title).toBe('день покупки')
    expect(start.diffLabel).toBe('до окупаемости')
    expect(start.diff).toBe(`7${NB}990 ₽`)

    const later = monthReadout(s, 30)
    expect(later.title).toBe('30-й месяц')
    expect(later.sub).toBe(`8${NB}970 ₽`)
    expect(later.diffLabel).toBe('экономия')
    expect(later.diff).toBe('980 ₽')

    expect(monthReadout(s, 999).month).toBe(60)
  })
})
