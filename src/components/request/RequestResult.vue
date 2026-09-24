<script setup lang="ts">
/**
 * Экран после отправки: «заявка ушла» или запасной путь — «не получилось,
 * отправь письмом»: готовый текст письма, ссылка mailto, копирование и повтор.
 */
import { computed, onBeforeUnmount, ref, useTemplateRef } from 'vue'

import { COPY_FEEDBACK_MS, COPY_LABEL } from './request.data'
import { TEAM_EMAIL } from '@/config'
import { buildLetter, buildMailtoHref, type RequestResult } from '@/services/requestForm'

const props = defineProps<{
  /** итог последней отправки; null — отправок ещё не было */
  result: RequestResult | null
}>()

const emit = defineEmits<{
  close: []
  retry: []
}>()

const ok = computed(() => props.result?.ok ?? true)
const letter = computed(() =>
  props.result && !props.result.ok ? buildLetter(props.result.data) : '',
)
const text = computed(() => {
  if (!props.result) return ''
  return props.result.ok
    ? 'Спасибо! Заявка принята — свяжемся с тобой по адресу ' + props.result.data.email + '.'
    : 'Не получилось отправить заявку через сайт. Отправь её обычным письмом на ' +
        TEAM_EMAIL +
        ' — текст уже собран.'
})

const title = useTemplateRef<HTMLHeadingElement>('title')
const mailArea = useTemplateRef<HTMLTextAreaElement>('mailArea')

/* Копирование: сначала execCommand — он работает и без HTTPS, и в старых
   браузерах; если не вышло — Clipboard API (ждём ответа: он может отказать).
   Не вышло совсем — просим скопировать вручную: текст в поле уже выделен. */
const copyLabel = ref(COPY_LABEL)
let copyTimer: ReturnType<typeof setTimeout> | undefined
async function copyLetter() {
  const area = mailArea.value
  if (!area) return
  area.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }
  if (!copied && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(area.value)
      copied = true
    } catch {
      copied = false
    }
  }
  copyLabel.value = copied ? 'Текст скопирован' : 'Скопируй вручную'
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => (copyLabel.value = COPY_LABEL), COPY_FEEDBACK_MS)
}
onBeforeUnmount(() => clearTimeout(copyTimer))

defineExpose({
  /** фокус на заголовок итога: экранный диктор прочтёт его и описание */
  focusTitle: () => title.value?.focus({ preventScroll: true }),
})
</script>

<template>
  <div id="formDone" class="form-done grid justify-items-start gap-s3" :class="{ 'is-error': !ok }">
    <!-- состояние после отправки: «заявка ушла» или «не получилось — отправь письмом» -->
    <div class="form-done__node" aria-hidden="true"></div>
    <h3
      id="doneTitle"
      ref="title"
      class="m-0 text-[22px] focus:outline-none"
      tabindex="-1"
      aria-describedby="doneText"
    >
      {{ ok ? 'Заявка отправлена' : 'Не получилось отправить' }}
    </h3>
    <p id="doneText" class="note">{{ text }}</p>
    <textarea
      v-if="!ok"
      id="doneMail"
      ref="mailArea"
      class="w-full resize-y rounded-ui border border-hair bg-panel p-s3 font-mono text-[12.5px] leading-[1.6] text-fg"
      rows="7"
      readonly
      aria-label="Текст письма"
      :value="letter"
    ></textarea>
    <div class="flex flex-wrap items-center gap-s4">
      <template v-if="!ok">
        <a id="mailtoLink" class="btn" :href="buildMailtoHref(letter)">Открыть в почте</a>
        <button class="link-quiet" type="button" @click="copyLetter">
          {{ copyLabel }}
        </button>
        <button id="retrySend" class="link-quiet" type="button" @click="emit('retry')">
          Попробовать снова
        </button>
      </template>
      <button v-else id="doneClose" class="link-quiet" type="button" @click="emit('close')">
        Закрыть
      </button>
    </div>
  </div>
</template>

<style scoped>
/* узел сигнала: заявка ушла — от него расходится ореол, как у индикаторов на странице */
.form-done__node {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-cyan);
  box-shadow: 0 0 0 0 rgba(0, 194, 184, 0.5);
  animation: halo-node 2s ease-out infinite;
}
/* не дошло: узел гаснет и становится красным, как у ошибки поля */
.is-error .form-done__node {
  background: var(--color-danger);
  box-shadow: none;
  animation: none;
}
@keyframes halo-node {
  to {
    box-shadow: 0 0 0 18px rgba(0, 194, 184, 0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .form-done__node {
    transition: none;
    animation: none;
  }
}
</style>
