import { onMounted, ref, watch, type Ref } from 'vue'
import { useEventListener } from '@vueuse/core'

/**
 * Движок бегунка сегментированного переключателя: ставит бегунок на активную
 * кнопку по её фактической геометрии (работает в ряд, 2×2 и в столбик).
 * В секциях напрямую не вызывается — используйте компонент
 * <SlidingMarker :target="activeButton" /> (src/components/ui/SlidingMarker.vue).
 */
export function useSlidingMarker(activeButton: Ref<HTMLElement | null | undefined>) {
  const markerStyle = ref<Record<string, string>>({})
  let placed = false

  function updateMarker() {
    const button = activeButton.value
    if (!button) return
    markerStyle.value = {
      width: `${button.offsetWidth}px`,
      height: `${button.offsetHeight}px`,
      transform: `translate(${button.offsetLeft}px, ${button.offsetTop}px)`,
      // первая установка — без анимации: иначе после загрузки бегунок «вырастает» из угла
      ...(placed ? {} : { transition: 'none' }),
    }
    if (!placed) {
      placed = true
      requestAnimationFrame(() => requestAnimationFrame(updateMarker))
    }
  }

  watch(activeButton, updateMarker, { flush: 'post' })
  onMounted(() => {
    updateMarker()
    // шрифты догружаются позже — ширина кнопок после этого меняется
    document.fonts?.ready.then(updateMarker)
  })
  // без явного window: VueUse сам берёт его только в браузере (пререндер идёт в Node)
  useEventListener('resize', updateMarker)
  useEventListener('load', updateMarker)

  return { markerStyle, updateMarker }
}
