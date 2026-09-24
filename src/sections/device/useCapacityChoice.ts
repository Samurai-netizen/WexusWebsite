import { computed, readonly, ref } from 'vue'
import { useTimeoutFn } from '@vueuse/core'
import {
  CAPACITY_OPTIONS,
  DEFAULT_CAPACITY_INDEX,
  ENGRAVE_SWAP_MS,
  type CapacityOption,
} from './device.data'

/**
 * Выбранный объём накопителя. Два индекса разведены намеренно:
 *  - selectedIndex меняется сразу — нажатая кнопка (aria-pressed) и бегунок;
 *  - shownIndex догоняет его через ENGRAVE_SWAP_MS — гравировка на чертеже
 *    и строка модели в таблице. Пока идёт пауза, isSwapping = true:
 *    старая гравировка гаснет, и новая появляется с коротким «перещёлкиванием».
 */
export function useCapacityChoice() {
  const selectedIndex = ref(DEFAULT_CAPACITY_INDEX)
  const shownIndex = ref(DEFAULT_CAPACITY_INDEX)
  const isSwapping = ref(false)

  // Таймер перезапускается при каждом нажатии: после серии быстрых кликов
  // показывается только последний выбор, без промежуточных надписей.
  const { start } = useTimeoutFn(
    () => {
      shownIndex.value = selectedIndex.value
      isSwapping.value = false
    },
    ENGRAVE_SWAP_MS,
    { immediate: false },
  )

  function select(index: number) {
    if (!CAPACITY_OPTIONS[index]) return
    selectedIndex.value = index
    isSwapping.value = true
    start()
  }

  /** Вариант, который сейчас выгравирован на чертеже и записан в таблице.
   *  Индекс всегда существует: select() пропускает только валидные. */
  const shown = computed<CapacityOption>(() => CAPACITY_OPTIONS[shownIndex.value]!)

  return {
    selectedIndex: readonly(selectedIndex),
    shown,
    isSwapping: readonly(isSwapping),
    select,
  }
}
