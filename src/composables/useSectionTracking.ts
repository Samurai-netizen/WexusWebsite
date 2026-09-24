import { readonly, ref } from 'vue'
import { SECTIONS, getSection, toneOf, type SectionId, type ScreenTone } from '@/content/sections'

/**
 * Где сейчас пользователь. Прокрутку не перехватываем: только подсвечиваем
 * текущий экран в рейке, перекрашиваем рейку и шапку под его тон,
 * показываем/прячем мини-шапку и двигаем полосу прогресса (узкие экраны).
 *
 * Запускается один раз из App.vue (startSectionTracking), компоненты читают
 * состояние через useSectionState().
 */
const activeId = ref<SectionId>(SECTIONS[0].id)
const activeTone = ref<ScreenTone>(toneOf(SECTIONS[0].background))
const barVisible = ref(false)
/** Доля прокрутки страницы, 0…1 */
const progress = ref(0)

export function useSectionState() {
  return {
    activeId: readonly(activeId),
    activeTone: readonly(activeTone),
    barVisible: readonly(barVisible),
    progress: readonly(progress),
  }
}

/** Мобильная раскладка: лента не скроллится сама, прокручивается страница.
    Та же граница, что у @media (max-width: 900px) для .deck в main.css — менять вместе. */
const MOBILE_QUERY = '(max-width: 900px)'

const FIRST_ID: SectionId = SECTIONS[0].id
const LAST_ID = SECTIONS.at(-1)?.id

/** Первый или последний экран: там мини-шапка не нужна — на первом действие
    и так на виду, на последнем — тем более. */
export function isEdgeSection(id: SectionId): boolean {
  return id === FIRST_ID || id === LAST_ID
}

/**
 * Какой экран стал активным по пачке событий наблюдателя. Берём последний
 * пересёкший линию: в одной пачке уходящий и приходящий экраны идут по порядку.
 * undefined — активный экран не сменился.
 *
 *   latestActiveId([{ id: 'hero', isIntersecting: false }, { id: 'problem', isIntersecting: true }]) // 'problem'
 */
export function latestActiveId(
  entries: readonly { id: string; isIntersecting: boolean }[],
): SectionId | undefined {
  let result: SectionId | undefined
  for (const entry of entries) {
    if (!entry.isIntersecting) continue
    const section = SECTIONS.find((s) => s.id === entry.id)
    if (section) result = section.id
  }
  return result
}

/** Запустить наблюдение. Возвращает функцию остановки. Только в браузере (onMounted). */
export function startSectionTracking(deck: HTMLElement): () => void {
  const mobile = window.matchMedia(MOBILE_QUERY)
  // исключение из правила «только template refs»: экраны — разные компоненты,
  // проще найти их <section> по id из SECTIONS, чем пробрасывать ссылки
  const screens = SECTIONS.map((s) => document.getElementById(s.id)).filter(
    (el): el is HTMLElement => el !== null,
  )

  // 1. Активный экран — тот, что пересекает линию посередине окна.
  //    Не порог видимости (intersectionRatio): экран выше ~1.8 окна (телефон,
  //    особенно в альбомной ориентации) никогда не набирает 55 % своей площади.
  //    Линия от высоты экрана не зависит. На экранах в одно окно это то же,
  //    что «видно больше половины».
  const screenObserver = new IntersectionObserver(
    (entries) => {
      const id = latestActiveId(
        entries.map((e) => ({ id: e.target.id, isIntersecting: e.isIntersecting })),
      )
      if (!id) return
      activeId.value = id
      activeTone.value = toneOf(getSection(id).background)
      // полоса браузера идёт за экраном: иначе над светлым экраном висит тёмная планка
      const el = screens.find((s) => s.id === id)
      if (el) {
        document
          .querySelector('meta[name="theme-color"]')
          ?.setAttribute('content', getComputedStyle(el).backgroundColor)
      }
      updateBarOnSectionChange()
    },
    { rootMargin: '-50% 0px -49% 0px', threshold: 0 },
  )
  screens.forEach((el) => screenObserver.observe(el))

  // 2. Мини-шапка живёт между первым и последним экраном (isEdgeSection)
  function updateBarOnSectionChange() {
    const atEdge = isEdgeSection(activeId.value)
    if (mobile.matches) {
      // на мобильном панель показывается только при прокрутке вверх (см. onScroll)
      if (atEdge) barVisible.value = false
    } else {
      barVisible.value = !atEdge
    }
  }

  // 3. Прокрутка. Скроллером может быть либо лента, либо сама страница —
  //    зависит от ширины экрана, поэтому слушаем оба.
  function scroller(): Element {
    return deck.scrollHeight - deck.clientHeight > 4
      ? deck
      : (document.scrollingElement ?? document.documentElement)
  }

  function updateProgress() {
    const el = scroller()
    const max = el.scrollHeight - el.clientHeight
    progress.value = max > 0 ? el.scrollTop / max : 0
  }

  // на мобильном панель не висит поверх контента постоянно:
  // скрывается при прокрутке вниз, возвращается при прокрутке вверх
  let lastY = 0
  function updateBarOnScroll() {
    if (!mobile.matches) return
    const y = scroller().scrollTop
    if (y > lastY + 6) barVisible.value = false
    else if (y < lastY - 6 && !isEdgeSection(activeId.value)) barVisible.value = true
    lastY = y
  }

  function onScroll() {
    updateBarOnScroll()
    updateProgress()
  }

  deck.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', updateProgress)
  updateProgress()

  return () => {
    screenObserver.disconnect()
    deck.removeEventListener('scroll', onScroll)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', updateProgress)
  }
}
