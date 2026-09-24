/**
 * Экраны лендинга — единственный источник правды о порядке секций.
 * Отсюда берут данные: App.vue (порядок экранов на странице), SectionRail (подписи точек),
 * ScreenSection (фон и тема), трекинг активного экрана (шапка и рейка
 * перекрашиваются под тон текущего экрана).
 */

/** Фон экрана: deep — тёмно-синий, paper и quartz — два светлых тона. */
export type ScreenBackground = 'deep' | 'paper' | 'quartz'

/** Тон экрана: от него зависят цвета текста, линий и панелей внутри. */
export type ScreenTone = 'dark' | 'light'

export interface SectionInfo {
  /** id якоря в URL (#hero) и id элемента <section> */
  id: string
  /** подпись в правой рейке-индикаторе */
  label: string
  background: ScreenBackground
}

export const SECTIONS = [
  { id: 'hero', label: 'Обзор', background: 'deep' },
  { id: 'problem', label: 'Проблема', background: 'paper' },
  { id: 'modes', label: 'Как работает', background: 'deep' },
  { id: 'device', label: 'Устройство', background: 'quartz' },
  { id: 'compare', label: 'Сравнение', background: 'deep' },
  { id: 'economics', label: 'Экономика', background: 'quartz' },
  { id: 'final', label: 'Вопросы', background: 'deep' },
] as const satisfies readonly SectionInfo[]

export type SectionId = (typeof SECTIONS)[number]['id']

export function toneOf(background: ScreenBackground): ScreenTone {
  return background === 'deep' ? 'dark' : 'light'
}

/** Класс темы для тона: от него зависят text-fg, border-hair, text-accent и т. д. (main.css). */
export function themeClassOf(tone: ScreenTone): 'theme-dark' | 'theme-light' {
  return tone === 'dark' ? 'theme-dark' : 'theme-light'
}

export function getSection(id: SectionId): SectionInfo {
  const section = SECTIONS.find((s) => s.id === id)
  if (!section) throw new Error(`Неизвестная секция: ${id}`)
  return section
}
