<script setup lang="ts">
/**
 * Окно заявки на тест прототипа (нативный <dialog>).
 * Открывается любой кнопкой заявки через useRequestModal(); здесь — только
 * оболочка: появление/закрытие, фокус и переключение «форма ↔ итог отправки».
 *
 * Требования 152-ФЗ, учтённые в форме: чекбокс согласия не предзаполнен,
 * без него кнопка неактивна, текст согласия раскрывается прямо у формы
 * и содержит оператора, цель, перечень данных, действия, срок и порядок
 * отзыва. Согласие оформлено отдельным блоком, а не строчкой в оферте.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import RequestForm from './RequestForm.vue'
import RequestResult from './RequestResult.vue'
import { useRequestModal } from '@/composables/useRequestModal'
import type { RequestResult as SendResult } from '@/services/requestForm'

/** сколько длится анимация закрытия, прежде чем окно убирается, мс */
const CLOSE_DELAY_MS = 220
/** фокус в окно — после того, как карточка почти доехала, мс */
const FOCUS_DELAY_MS = 260

const { isOpen, closeRequestModal, getOpener } = useRequestModal()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const card = useTemplateRef<HTMLElement>('card')
const form = useTemplateRef<InstanceType<typeof RequestForm>>('form')
const resultView = useTemplateRef<InstanceType<typeof RequestResult>>('resultView')

/** класс is-open: запускает появление карточки и сигнальной линии */
const isShownClass = ref(false)
/** что показано в окне: форма или итог отправки */
const view = ref<'form' | 'done'>('form')
const result = ref<SendResult | null>(null)

/** окно открыто и не закрывается прямо сейчас */
let shown = false
/** итог отправки пришёл, пока окно было закрыто: покажем его при следующем открытии */
let unseen = false
let opener: HTMLElement | null = null
let closeTimer: ReturnType<typeof setTimeout> | undefined
let focusTimer: ReturnType<typeof setTimeout> | undefined

function show() {
  const el = dialog.value
  if (!el || typeof el.showModal !== 'function') return
  // окно открыли снова, пока оно закрывалось, — закрытие отменяем
  clearTimeout(closeTimer)
  opener = getOpener()
  shown = true
  const showResult = unseen
  unseen = false
  if (!showResult) view.value = 'form'
  if (!el.open) el.showModal()
  /* класс ставим следующим кадром — иначе переход не проигрывается */
  requestAnimationFrame(() => {
    if (shown) isShownClass.value = true
  })
  clearTimeout(focusTimer)
  focusTimer = setTimeout(() => {
    if (showResult) resultView.value?.focusTitle()
    else form.value?.focusName()
  }, FOCUS_DELAY_MS)
}

function hide() {
  shown = false
  isShownClass.value = false
  clearTimeout(focusTimer)
  clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    dialog.value?.close()
    opener?.focus()
  }, CLOSE_DELAY_MS)
}

watch(isOpen, (open) => (open ? show() : hide()))
onMounted(() => {
  // кнопку заявки нажали раньше, чем страница ожила
  if (isOpen.value) show()
})
onBeforeUnmount(() => {
  clearTimeout(closeTimer)
  clearTimeout(focusTimer)
})

/* Клик по затемнению вокруг карточки закрывает окно. Только если и нажатие
   началось на затемнении: когда выделение текста в поле тянут за край карточки,
   браузер шлёт click самому <dialog> — окно не должно закрываться
   (иначе пропадёт и готовое письмо, которое посетитель как раз копирует). */
let downOnBackdrop = false
function onDialogPointerDown(event: PointerEvent) {
  downOnBackdrop = event.target === dialog.value
}
function onDialogClick(event: MouseEvent) {
  if (downOnBackdrop && event.target === dialog.value) closeRequestModal()
  downOnBackdrop = false
}
/* браузер может закрыть окно сам (например, повторный Esc) — синхронизируем состояние,
   иначе кнопки заявки перестанут его открывать */
function onDialogClose() {
  if (isOpen.value) closeRequestModal()
}

/* итог: «заявка принята» или запасной путь — письмо с готовым текстом */
async function onResult(next: SendResult) {
  result.value = next
  view.value = 'done'
  /* окно закрыли, пока заявка была в пути: итог покажем при следующем открытии.
     Фокус — на заголовок итога: экранный диктор прочтёт его и описание */
  const visible = shown
  unseen = !visible
  await nextTick()
  if (card.value) card.value.scrollTop = 0
  if (visible) resultView.value?.focusTitle()
}

async function onRetry() {
  view.value = 'form'
  await nextTick()
  form.value?.retry()
}
</script>

<template>
  <dialog
    id="requestModal"
    ref="dialog"
    class="modal m-auto max-h-[min(88vh,860px)] w-[min(640px,calc(100vw_-_2_*_var(--spacing-s4)))] overflow-visible border-none bg-transparent p-0 text-quartz max-sm:m-0 max-sm:mt-auto max-sm:max-h-[92vh] max-sm:w-screen max-sm:max-w-[100vw]"
    :class="{ 'is-open': isShownClass }"
    aria-labelledby="modalTitle"
    @pointerdown="onDialogPointerDown"
    @click="onDialogClick"
    @cancel.prevent="closeRequestModal"
    @close="onDialogClose"
  >
    <div
      ref="card"
      class="modal__card theme-raised relative max-h-[inherit] overflow-y-auto rounded-ui border border-quartz/14 bg-ink px-s5 pt-s5 pb-s4 shadow-[0_30px_80px_rgba(0,0,0,0.5)] max-sm:rounded-b-none max-sm:px-s3 max-sm:pt-s4 max-sm:pb-s3"
    >
      <span class="modal__wire" aria-hidden="true"></span>
      <button
        class="absolute top-s3 right-s3 flex size-9 items-center justify-center rounded-ui border border-hair text-fg-dim transition-[color,border-color,rotate] duration-200 ease-[ease] hover:rotate-90 hover:border-fg-dim hover:text-fg"
        type="button"
        aria-label="Закрыть окно заявки"
        @click="closeRequestModal"
      >
        <svg
          class="size-3.5"
          viewBox="0 0 16 16"
          stroke="currentColor"
          stroke-width="1.4"
          aria-hidden="true"
        >
          <line x1="3" y1="3" x2="13" y2="13" />
          <line x1="13" y1="3" x2="3" y2="13" />
        </svg>
      </button>

      <h2 id="modalTitle" class="mb-s2 text-[clamp(22px,2.4vw,28px)] leading-[1.12]">
        Заявка на тест прототипа
      </h2>
      <p class="note mb-s4">
        Это не покупка и не предзаказ. Мы собираем список тех, кому вышлем устройство на испытание,
        когда соберём первую партию прототипов.
      </p>

      <RequestForm ref="form" :hidden="view !== 'form'" @result="onResult" />
      <RequestResult
        ref="resultView"
        :hidden="view !== 'done'"
        :result="result"
        @close="closeRequestModal"
        @retry="onRetry"
      />
    </div>
  </dialog>
</template>

<style scoped>
.modal::backdrop {
  background: rgba(6, 8, 16, 0.72);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.modal[open]::backdrop {
  opacity: 1;
}

/* Карточка всегда тёмная, где бы ни открылась: цвета темы задаёт класс
   theme-raised (main.css) — рамки чуть тише, чем на тёмных экранах. */
.modal__card {
  opacity: 0;
  transform: translateY(14px) scale(0.985);
  transition:
    opacity 0.28s ease,
    transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}
.is-open .modal__card {
  opacity: 1;
  transform: none;
}

/* соединение установлено: по верхней кромке прочерчивается сигнальная линия */
.modal__wire {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--color-cyan);
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.12s;
}
.is-open .modal__wire {
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .modal__card,
  .modal__wire {
    transition: none;
    animation: none;
  }
  .modal__card {
    opacity: 1;
    transform: none;
  }
  .modal__wire {
    width: 100%;
  }
}
</style>
