<script setup lang="ts">
/**
 * Форма заявки: поля, проверка с понятными подсказками вместо системных окон,
 * согласие по 152-ФЗ и отправка. Итог отправки уходит родителю событием result —
 * экран «заявка ушла / не получилось» показывает RequestModal.
 */
import { computed, reactive, ref, useTemplateRef, watch } from 'vue'

import RequestConsent from './RequestConsent.vue'
import { SEGMENT_OPTIONS, submitHint, submitLabel } from './request.data'
import {
  collectRequestData,
  isEmailValid,
  isNameValid,
  resolvePageUrl,
  sendRequest,
  type RequestFields,
  type RequestResult,
} from '@/services/requestForm'

const emit = defineEmits<{
  result: [result: RequestResult]
}>()

const EMPTY: RequestFields = { name: '', email: '', segment: '', note: '' }

const fields = reactive<RequestFields>({ ...EMPTY })
/** поля с ошибкой (подсветка и текст ошибки) */
const bad = reactive({ name: false, email: false })
const consent = ref(false)
const sending = ref(false)

const nameInput = useTemplateRef<HTMLInputElement>('nameInput')
const emailInput = useTemplateRef<HTMLInputElement>('emailInput')
const consentBlock = useTemplateRef<InstanceType<typeof RequestConsent>>('consentBlock')
const submitButton = useTemplateRef<HTMLButtonElement>('submitButton')

const hint = computed(() => submitHint(sending.value, consent.value))

/* Проверка: при уходе с поля, а если поле уже красное — на каждый ввод,
   чтобы ошибка гасла сразу, как только значение стало верным. */
function check(key: 'name' | 'email'): boolean {
  const ok = key === 'name' ? isNameValid(fields.name) : isEmailValid(fields.email)
  bad[key] = !ok
  return ok
}
watch(
  () => fields.name,
  () => bad.name && check('name'),
)
watch(
  () => fields.email,
  () => bad.email && check('email'),
)

function reset() {
  Object.assign(fields, EMPTY)
  bad.name = false
  bad.email = false
  consent.value = false
}

async function trySend() {
  // повторное нажатие, пока заявка в пути, ничего не делает
  if (sending.value) return
  const okName = check('name')
  const okMail = check('email')
  if (!okName || !okMail || !consent.value) {
    if (!okName) nameInput.value?.focus()
    else if (!okMail) emailInput.value?.focus()
    else consentBlock.value?.focus()
    return
  }

  const data = collectRequestData(fields)
  sending.value = true
  try {
    await sendRequest(data, { pageUrl: resolvePageUrl(location.protocol, location.href) })
  } catch (err) {
    sending.value = false
    console.warn('Заявка не ушла через FormSubmit:', err)
    emit('result', { ok: false, data })
    return
  }
  sending.value = false
  reset()
  emit('result', { ok: true, data })
}

defineExpose({
  /** фокус на первое поле при открытии окна */
  focusName: () => nameInput.value?.focus({ preventScroll: true }),
  /** «Попробовать снова»: фокус на кнопку и повторная отправка тех же данных */
  retry: () => {
    // с прокруткой: кнопка «Отправляем…» внизу длинной формы
    submitButton.value?.focus()
    void trySend()
  },
})
</script>

<template>
  <form id="requestForm" class="grid gap-s3" novalidate @submit.prevent="trySend">
    <label class="field grid gap-[6px]" :class="{ 'is-bad': bad.name }">
      <span class="text-[13.5px] text-fg-dim">Как к тебе обращаться</span>
      <input
        id="fName"
        ref="nameInput"
        v-model="fields.name"
        class="field__control"
        type="text"
        name="name"
        autocomplete="name"
        required
        maxlength="80"
        placeholder="Имя"
        @blur="check('name')"
      />
      <span class="field__error">Пожалуйста, впиши своё имя.</span>
    </label>

    <label class="field grid gap-[6px]" :class="{ 'is-bad': bad.email }">
      <span class="text-[13.5px] text-fg-dim">Впиши свою почту</span>
      <input
        id="fMail"
        ref="emailInput"
        v-model="fields.email"
        class="field__control"
        type="email"
        name="email"
        autocomplete="email"
        required
        maxlength="120"
        placeholder="name@mail.ru"
        @blur="check('email')"
      />
      <span class="field__error">Проверь адрес: нужен формат name@mail.ru.</span>
    </label>

    <label class="field grid gap-[6px]">
      <span class="text-[13.5px] text-fg-dim">
        Как планируешь использовать устройство
        <span class="text-[12px] opacity-70">необязательно</span>
      </span>
      <select v-model="fields.segment" class="field__control" name="segment">
        <option value="">Не выбрано</option>
        <option v-for="option in SEGMENT_OPTIONS" :key="option">{{ option }}</option>
      </select>
    </label>

    <label class="field grid gap-[6px]">
      <span class="text-[13.5px] text-fg-dim">
        Что хочешь проверить <span class="text-[12px] opacity-70">необязательно</span>
      </span>
      <textarea
        v-model="fields.note"
        class="field__control"
        name="note"
        rows="3"
        maxlength="600"
        placeholder="Например: автономность на выезде и одновременная работа трёх устройств"
      ></textarea>
    </label>

    <RequestConsent ref="consentBlock" v-model="consent" :disabled="sending" />

    <div class="mt-s2 flex flex-wrap items-center gap-s3">
      <!-- пока заявка в пути, кнопка не выключается, а помечается aria-disabled:
           так фокус не теряется -->
      <button
        id="formSubmit"
        ref="submitButton"
        class="btn"
        type="submit"
        :disabled="!consent"
        :aria-disabled="sending ? 'true' : undefined"
      >
        {{ submitLabel(sending) }}
      </button>
      <p id="formHint" class="note min-w-[180px] flex-1" aria-live="polite">{{ hint }}</p>
    </div>

    <!-- разделитель под кнопкой, как в исходнике (там это пустой .form__disclaimer) -->
    <div class="border-t border-hair pt-s2" aria-hidden="true"></div>
  </form>
</template>

<style scoped>
/* Поля ввода. Общий класс для input/select/textarea: у них один вид и одни состояния,
   а красная рамка ошибки должна перебивать и наведение, и фокус. */
.field__control {
  width: 100%;
  min-height: 46px;
  padding: 11px var(--spacing-s3);
  font-family: var(--font-sans);
  font-size: 15px;
  color: var(--fg);
  background: var(--panel);
  border: 1px solid var(--hair);
  border-radius: var(--radius-ui);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}
textarea.field__control {
  min-height: 82px;
  resize: vertical;
  line-height: 1.5;
}
.field__control:hover {
  border-color: var(--fg-dim);
}
.field__control:focus {
  border-color: var(--color-cyan);
  outline: none;
  background: rgba(0, 194, 184, 0.05);
}
.field__control::placeholder {
  color: rgba(var(--quartz-rgb), 0.46);
}
.is-bad input.field__control,
.is-bad select.field__control {
  border-color: var(--color-danger);
}

/* текст ошибки выезжает под полем, только когда поле красное */
.field__error {
  max-height: 0;
  overflow: hidden;
  font-size: 12.5px;
  color: var(--color-danger);
  opacity: 0;
  transition:
    max-height 0.25s ease,
    opacity 0.2s ease;
}
.is-bad .field__error {
  max-height: 40px;
  opacity: 1;
}
</style>
