import { readonly, ref } from 'vue'

import { reachGoal, type RequestSource } from '@/services/metrika'

/**
 * Глобальное состояние окна заявки. Любая кнопка «Оставить заявку»
 * на странице вызывает openRequestModal, окно (RequestModal.vue) слушает isOpen.
 * Второй аргумент — откуда открыли: уходит в Метрику с целью request_open.
 *
 *   const { openRequestModal } = useRequestModal()
 *   <button class="btn" type="button" @click="openRequestModal($event, 'hero')">…</button>
 */
const isOpen = ref(false)
/** Кнопка, которая открыла окно: после закрытия фокус возвращается на неё. */
let opener: HTMLElement | null = null

export function useRequestModal() {
  function openRequestModal(event?: Event, source?: RequestSource) {
    const target = event?.currentTarget
    opener = target instanceof HTMLElement ? target : null
    isOpen.value = true
    reachGoal('request_open', source ? { source } : undefined)
  }

  function closeRequestModal() {
    isOpen.value = false
  }

  return {
    isOpen: readonly(isOpen),
    openRequestModal,
    closeRequestModal,
    getOpener: () => opener,
  }
}
