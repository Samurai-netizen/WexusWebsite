import { describe, expect, it } from 'vitest'

import { isEdgeSection, latestActiveId } from '../useSectionTracking'
import { SECTIONS } from '@/content/sections'

describe('latestActiveId', () => {
  it('берёт последний экран, пересёкший линию', () => {
    expect(
      latestActiveId([
        { id: 'hero', isIntersecting: false },
        { id: 'problem', isIntersecting: true },
      ]),
    ).toBe('problem')
    // быстрая прокрутка: в одной пачке прошли два экрана подряд
    expect(
      latestActiveId([
        { id: 'problem', isIntersecting: true },
        { id: 'problem', isIntersecting: false },
        { id: 'modes', isIntersecting: true },
      ]),
    ).toBe('modes')
  })

  it('не меняет экран, если никто не вошёл или id чужой', () => {
    expect(latestActiveId([{ id: 'hero', isIntersecting: false }])).toBeUndefined()
    expect(latestActiveId([{ id: 'unknown', isIntersecting: true }])).toBeUndefined()
    expect(latestActiveId([])).toBeUndefined()
  })
})

describe('isEdgeSection', () => {
  it('первый и последний экраны из SECTIONS — края, остальные нет', () => {
    const ids = SECTIONS.map((s) => s.id)
    expect(isEdgeSection(ids[0]!)).toBe(true)
    expect(isEdgeSection(ids[ids.length - 1]!)).toBe(true)
    for (const id of ids.slice(1, -1)) expect(isEdgeSection(id)).toBe(false)
  })
})
