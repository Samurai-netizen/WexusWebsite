import { readonly, ref } from 'vue'

/**
 * Глобальное состояние окна заявки. Любая кнопка «Оставить заявку»
 * на странице вызывает openRequestModal, окно (RequestModal.vue) слушает isOpen.
 *
 *   const { openRequestModal } = useRequestModal()
 *   <button class="btn" type="button" @click="openRequestModal($event)">…</button>
 */
const isOpen = ref(false)
/** Кнопка, которая открыла окно: после закрытия фокус возвращается на неё. */
let opener: HTMLElement | null = null

export function useRequestModal() {
  function openRequestModal(event?: Event) {
    const target = event?.currentTarget
    opener = target instanceof HTMLElement ? target : null
    isOpen.value = true
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
