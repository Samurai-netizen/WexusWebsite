import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import CompareSection from '../CompareSection.vue'
import { COMPARE_COLUMNS, COMPARE_ROWS, compareCellKind, type CompareColumn } from '../compare.data'

describe('compareCellKind', () => {
  const columns: readonly CompareColumn[] = [
    { key: 'cloud', title: 'A' },
    { key: 'wexus', title: 'B', own: true },
    { key: 'ssd', title: 'C' },
  ]

  it('выделяет колонку продукта и отступает у соседней справа', () => {
    expect(compareCellKind(columns, 0)).toBe('plain')
    expect(compareCellKind(columns, 1)).toBe('own')
    expect(compareCellKind(columns, 2)).toBe('afterOwn')
  })

  it('номер за пределами списка — обычная колонка', () => {
    expect(compareCellKind(columns, -1)).toBe('plain')
    expect(compareCellKind(columns, 3)).toBe('plain')
  })

  it('в таблице лендинга WEXUS первая, облако сразу за ней', () => {
    expect(COMPARE_COLUMNS.map((_, i) => compareCellKind(COMPARE_COLUMNS, i))).toEqual([
      'own',
      'afterOwn',
      'plain',
    ])
  })
})

describe('compare.data', () => {
  it('колонка продукта ровно одна, ключи колонок не повторяются', () => {
    expect(COMPARE_COLUMNS.filter((c) => c.own)).toHaveLength(1)
    expect(new Set(COMPARE_COLUMNS.map((c) => c.key)).size).toBe(COMPARE_COLUMNS.length)
  })

  it('у каждой строки заполнены свойство и все колонки, свойства не повторяются', () => {
    for (const row of COMPARE_ROWS) {
      expect(row.property.trim()).not.toBe('')
      for (const column of COMPARE_COLUMNS) {
        expect(row.values[column.key].trim()).not.toBe('')
      }
    }
    expect(new Set(COMPARE_ROWS.map((r) => r.property)).size).toBe(COMPARE_ROWS.length)
  })

  it('последняя строка — та, где продукт проигрывает (без неё таблица выглядит рекламой)', () => {
    expect(COMPARE_ROWS[COMPARE_ROWS.length - 1]?.property).toBe('Если носитель потерян или сломан')
  })
})

describe('CompareSection', () => {
  const wrapper = mount(CompareSection)

  it('рендерит тёмный экран с якорем #compare', () => {
    const section = wrapper.get('section#compare')
    expect(section.classes()).toContain('theme-dark')
    expect(section.attributes('data-theme')).toBe('dark')
  })

  it('таблица доступна скринридеру: подпись и заголовки колонок и строк', () => {
    const table = wrapper.get('table')
    expect(table.get('caption').text()).toBe(
      'Сравнение WEXUS, облачного хранилища и традиционного внешнего SSD',
    )
    const headCells = table.findAll('thead th')
    expect(headCells).toHaveLength(COMPARE_COLUMNS.length + 1)
    for (const th of headCells) expect(th.attributes('scope')).toBe('col')
    expect(headCells[0]?.text()).toBe('Свойство')
    expect(headCells.slice(1).map((th) => th.text())).toEqual(COMPARE_COLUMNS.map((c) => c.title))
  })

  it('выводит все строки и значения из данных', () => {
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(COMPARE_ROWS.length)
    rows.forEach((tr, i) => {
      const data = COMPARE_ROWS[i]!
      const th = tr.get('th')
      expect(th.attributes('scope')).toBe('row')
      expect(th.text()).toBe(data.property)
      expect(tr.findAll('td').map((td) => td.text())).toEqual(
        COMPARE_COLUMNS.map((c) => data.values[c.key]),
      )
    })
  })

  it('колонка продукта отмечена в шапке и в каждой строке, маркер декоративный и вплотную к названию', () => {
    const ownIndex = COMPARE_COLUMNS.findIndex((c) => c.own)
    const ownHead = wrapper.findAll('thead th')[ownIndex + 1]!
    expect(ownHead.attributes('data-own')).toBe('true')
    expect(ownHead.get('span').attributes('aria-hidden')).toBe('true')
    expect(ownHead.element.textContent).toBe(COMPARE_COLUMNS[ownIndex]?.title)

    for (const tr of wrapper.findAll('tbody tr')) {
      const owns = tr.findAll('td').map((td) => td.attributes('data-own') === 'true')
      expect(owns).toEqual(COMPARE_COLUMNS.map((c) => c.own === true))
    }
  })
})
