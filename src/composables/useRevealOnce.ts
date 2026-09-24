import { computed, onMounted, ref, watch, type Ref } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import { useInView } from '@/composables/useInView'

/**
 * Анимация «при первом появлении»: решает только КОГДА её запускать,
 * сами анимации описывает компонент в своих стилях.
 *
 *   const board = useTemplateRef<HTMLElement>('board')
 *   const { state, revealClass } = useRevealOnce(board)
 *   <div ref="board" :class="revealClass">   // .is-pending прячет части, .is-in запускает
 *
 * Состояния:
 *  - static  — анимации нет, всё видно сразу: пререндер и страница без JS,
 *              prefers-reduced-motion, нет IntersectionObserver, или элемент уже
 *              был на экране при загрузке;
 *  - pending — элемент ниже экрана, анимируемые части спрятаны (класс is-pending);
 *  - in      — элемент появился, части анимируются (класс is-in).
 */
export type RevealState = 'static' | 'pending' | 'in'

/** Пересекается ли прямоугольник элемента с окном по вертикали. */
export function isRectOnScreen(
  rect: { top: number; bottom: number },
  viewportHeight: number,
): boolean {
  return rect.top < viewportHeight && rect.bottom > 0
}

export function useRevealOnce(
  target: Readonly<Ref<HTMLElement | SVGElement | null>>,
  /** threshold — какая доля элемента должна показаться, чтобы анимация началась */
  options: { threshold?: number } = {},
) {
  const state = ref<RevealState>('static')
  const reducedMotion = usePreferredReducedMotion()
  const { isInView } = useInView(target, { threshold: options.threshold ?? 0.12, once: true })

  onMounted(() => {
    const el = target.value
    if (!el || reducedMotion.value === 'reduce') return
    // Без IntersectionObserver появление не заметить — части остались бы спрятанными навсегда.
    if (!('IntersectionObserver' in window)) return
    // Элемент уже на экране (перезагрузка посреди страницы, переход по якорю):
    // не прячем то, что человек уже видит, — пересборка выглядела бы миганием.
    if (isRectOnScreen(el.getBoundingClientRect(), window.innerHeight)) return
    state.value = 'pending'
  })

  watch(isInView, (visible) => {
    if (visible && state.value === 'pending') state.value = 'in'
  })

  /** Классы для корня: .is-pending прячет части, .is-in запускает анимацию. */
  const revealClass = computed(() => ({
    'is-pending': state.value === 'pending',
    'is-in': state.value === 'in',
  }))

  return { state, revealClass }
}
