import { ref, type MaybeRefOrGetter } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

/**
 * Попал ли элемент в зону видимости. Для анимаций «при первом показе»
 * передайте once: true — после первого появления флаг остаётся true.
 *
 *   const board = useTemplateRef<HTMLElement>('board')
 *   const { isInView } = useInView(board, { threshold: 0.12, once: true })
 *   <div ref="board" :class="{ 'is-in': isInView }">
 */
export function useInView(
  target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>,
  options: { threshold?: number; once?: boolean } = {},
) {
  const isInView = ref(false)

  const { stop } = useIntersectionObserver(
    target,
    (entries) => {
      // берём последнее событие: если поток был занят, в пачке может прийти
      // и «вошёл», и «вышел» — актуально только последнее
      const entry = entries[entries.length - 1]
      if (!entry) return
      isInView.value = entry.isIntersecting
      if (entry.isIntersecting && options.once) stop()
    },
    { threshold: options.threshold ?? 0 },
  )

  return { isInView, stop }
}
