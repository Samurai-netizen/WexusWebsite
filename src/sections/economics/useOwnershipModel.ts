import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useDocumentVisibility, usePreferredReducedMotion, watchDebounced } from '@vueuse/core'
import {
  ANNOUNCE_DELAY_MS,
  clamp,
  easeOut,
  lerpState,
  makeTarget,
  parseAmount,
  summary,
  toState,
  TWEEN_MS,
  type CalcState,
} from './economics'
import { DEFAULT_TERM, FEE_FIELD, PRICE_FIELD, type TermYears } from './economics.data'

/**
 * Состояние калькулятора владения.
 *
 *  - feeInput / priceInput — текст полей как есть (пустое поле — пустая строка);
 *  - termYears — выбранный срок;
 *  - target — куда идём: числа пользователя в допустимых пределах;
 *  - shown — что нарисовано сейчас: при смене чисел цифры и график
 *    догоняют target за TWEEN_MS (при prefers-reduced-motion — сразу);
 *  - announcement — итог одной фразой для aria-live, с задержкой, чтобы не
 *    дребезжать при наборе.
 */
export function useOwnershipModel() {
  const feeInput = ref(String(FEE_FIELD.initial))
  const priceInput = ref(String(PRICE_FIELD.initial))
  const termYears = ref<TermYears>(DEFAULT_TERM)

  const target = computed(() =>
    makeTarget(
      parseAmount(feeInput.value, FEE_FIELD.min, FEE_FIELD.max),
      parseAmount(priceInput.value, PRICE_FIELD.min, PRICE_FIELD.max),
      termYears.value,
    ),
  )
  const shown = shallowRef<CalcState>(toState(target.value))
  const announcement = ref(summary(target.value))

  const reducedMotion = usePreferredReducedMotion()
  let tweenId = 0
  let frame = 0

  /* новые числа: цифры и график догоняют их за полсекунды */
  watch(target, (t) => {
    if (reducedMotion.value === 'reduce') {
      shown.value = toState(t)
      return
    }
    const from = shown.value
    const t0 = performance.now()
    const id = ++tweenId
    const step = (now: number) => {
      if (id !== tweenId) return
      const p = clamp((now - t0) / TWEEN_MS, 0, 1)
      shown.value = p < 1 ? lerpState(from, t, easeOut(p)) : toState(t)
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  })

  watchDebounced(target, (t) => (announcement.value = summary(t)), {
    debounce: ANNOUNCE_DELAY_MS,
  })

  /* пока вкладка скрыта, кадры анимации не идут — при возвращении показываем актуальные числа */
  const visibility = useDocumentVisibility()
  watch(visibility, (v) => {
    if (v === 'visible') shown.value = toState(target.value)
  })

  onBeforeUnmount(() => {
    tweenId++
    if (frame) cancelAnimationFrame(frame)
  })

  return { feeInput, priceInput, termYears, target, shown, announcement }
}
