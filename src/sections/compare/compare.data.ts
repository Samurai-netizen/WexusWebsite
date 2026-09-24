/**
 * Данные экрана «Сравнение»: колонки таблицы (WEXUS и две альтернативы)
 * и строки-свойства. Сравнение по свойствам, а не по цифрам: цены и скорости
 * зависят от конкретных моделей и тарифов.
 */

/** Ключ колонки. По нему строка находит своё значение в колонке. */
export type CompareColumnKey = 'wexus' | 'cloud' | 'ssd'

/** Колонка таблицы (кроме первой — с названиями свойств). */
export interface CompareColumn {
  key: CompareColumnKey
  /** заголовок колонки в шапке таблицы */
  title: string
  /**
   * Колонка продукта. Выделена подложкой и узловым маркером в шапке,
   * а не цветом текста. Такая колонка должна быть ровно одна.
   */
  own?: boolean
}

export const COMPARE_COLUMNS: readonly CompareColumn[] = [
  { key: 'wexus', title: 'WEXUS', own: true },
  { key: 'cloud', title: 'Облако' },
  { key: 'ssd', title: 'Внешний SSD' },
]

/** Строка таблицы: свойство и его значение в каждой колонке. */
export interface CompareRow {
  /** название свойства — заголовок строки (th scope="row") */
  property: string
  /** Record по всем ключам: TypeScript не даст забыть значение для какой-либо колонки */
  values: Record<CompareColumnKey, string>
}

/**
 * Последняя строка — там, где продукт проигрывает. Без неё таблица
 * выглядит рекламой, а не сравнением. Не убирать и не переносить вверх.
 */
export const COMPARE_ROWS: readonly CompareRow[] = [
  {
    property: 'Как платишь',
    values: {
      wexus: 'один раз при покупке',
      cloud: 'каждый месяц, пока нужны файлы',
      ssd: 'один раз при покупке',
    },
  },
  {
    property: 'Где физически лежат данные',
    values: {
      wexus: 'у тебя',
      cloud: 'на серверах провайдера',
      ssd: 'у тебя',
    },
  },
  {
    property: 'Доступ без интернета',
    values: {
      wexus: 'есть, по проводной и беспроводной сети',
      cloud: 'нет',
      ssd: 'есть, но только по кабелю',
    },
  },
  {
    property: 'Несколько устройств сразу',
    values: {
      wexus: 'да, по Wi-Fi',
      cloud: 'да',
      ssd: 'нет, по одному',
    },
  },
  {
    property: 'Объём',
    values: {
      wexus: 'фиксирован при покупке',
      cloud: 'растёт вместе с тарифом',
      ssd: 'фиксирован при покупке',
    },
  },
  {
    property: 'Если носитель потерян или сломан',
    values: {
      wexus: 'данные теряются, нужна вторая копия',
      cloud: 'доступ к данным пропадает',
      ssd: 'данные теряются',
    },
  },
]

/**
 * Как оформлять ячейки колонки:
 * - own      — колонка продукта (подложка, основной цвет текста, поле слева);
 * - afterOwn — колонка сразу за ней: у ячеек нет левого поля, поэтому её текст
 *              вплотную упирался бы в подложку — ей нужен отступ слева;
 * - plain    — обычная колонка.
 */
export type CompareCellKind = 'own' | 'afterOwn' | 'plain'

/** Вид ячеек колонки с номером `index` в списке `columns`. */
export function compareCellKind(columns: readonly CompareColumn[], index: number): CompareCellKind {
  if (columns[index]?.own) return 'own'
  if (index > 0 && columns[index - 1]?.own) return 'afterOwn'
  return 'plain'
}
