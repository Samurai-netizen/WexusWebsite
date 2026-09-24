/**
 * Данные калькулятора владения: два числовых поля и варианты срока.
 * Тексты — дословно из исходного лендинга.
 */
import { yearWord } from './economics'

export interface AmountField {
  /** id поля: на него ссылаются <label for> и aria-describedby */
  id: 'fee' | 'price'
  label: string
  /** единица справа от числа, «₽ в месяц» */
  unit: string
  hint: string
  /** начальное значение (попадает и в пререндер) */
  initial: number
  min: number
  max: number
  /** шаг степперов; значение встаёт на сетку шага */
  step: number
  decreaseLabel: string
  increaseLabel: string
}

export const FEE_FIELD: AmountField = {
  id: 'fee',
  label: 'Платишь за облако сейчас',
  unit: '₽ в месяц',
  hint: 'сумма, которая списывается каждый месяц',
  initial: 299,
  min: 0,
  max: 99999,
  step: 10,
  decreaseLabel: 'Уменьшить тариф',
  increaseLabel: 'Увеличить тариф',
}

export const PRICE_FIELD: AmountField = {
  id: 'price',
  label: 'Цена WEXUS',
  unit: '₽ разово',
  hint: 'подставь ту, которую считаешь реальной',
  initial: 7990,
  min: 0,
  max: 999999,
  step: 500,
  decreaseLabel: 'Уменьшить цену',
  increaseLabel: 'Увеличить цену',
}

/** Варианты срока, лет. Дольше среднего срока службы накопителя (10 лет) не предлагаем. */
export const TERM_YEARS = [1, 2, 3, 5, 7, 10] as const
export type TermYears = (typeof TERM_YEARS)[number]
export const DEFAULT_TERM: TermYears = 5

/** Подпись для скринридера после цифры: « год», « года», « лет». */
export function termSrSuffix(years: number): string {
  return ' ' + yearWord(years)
}
