<script setup lang="ts">
/**
 * Согласие на обработку персональных данных (152-ФЗ) — отдельный блок формы заявки.
 * Галочка не предзаполнена: без неё отправка недоступна. Полный текст согласия
 * раскрывается прямо у формы. Тексты меняются только по просьбе владельца.
 */
import { ref, useTemplateRef } from 'vue'

import ExpandPanel from '@/components/ui/ExpandPanel.vue'
import { TEAM_EMAIL, TEAM_MEMBERS } from '@/config'

defineProps<{
  /** пока заявка в пути, согласие заморожено: отозвать его на лету уже нельзя */
  disabled?: boolean
}>()

/** отмечено ли согласие */
const checked = defineModel<boolean>({ required: true })

const isOpen = ref(false)
const input = useTemplateRef<HTMLInputElement>('input')

defineExpose({
  focus: () => input.value?.focus(),
})
</script>

<template>
  <div class="mt-s2 grid gap-s2 rounded-ui border border-hair bg-panel p-s3">
    <!-- СОГЛАСИЕ. Галочка не предзаполнена: без неё отправка недоступна -->
    <label class="grid cursor-pointer grid-cols-[auto_1fr] items-start gap-s2">
      <input
        id="fConsent"
        ref="input"
        v-model="checked"
        class="consent__input absolute m-0 size-[22px] cursor-pointer opacity-0"
        type="checkbox"
        name="consent"
        required
        :disabled="disabled"
      />
      <span
        class="consent__box flex size-[22px] items-center justify-center rounded-[6px] border border-fg-dim"
        aria-hidden="true"
      >
        <svg class="size-3.5" viewBox="0 0 14 14">
          <polyline points="2.5,7.5 5.8,10.6 11.5,3.8" />
        </svg>
      </span>
      <span class="text-[13.5px] leading-[1.5] text-fg">
        Я даю согласие на обработку моих персональных данных на условиях, указанных ниже.
      </span>
    </label>

    <button
      class="justify-self-start border-b border-hair px-0 pt-[4px] pb-[6px] font-sans text-[13px] text-fg-dim transition-[color,border-color] duration-200 ease-[ease] hover:border-cyan hover:text-fg"
      type="button"
      :aria-expanded="isOpen ? 'true' : 'false'"
      aria-controls="consentText"
      @click="isOpen = !isOpen"
    >
      {{ isOpen ? 'Свернуть условия' : 'Прочитать условия обработки' }}
    </button>
    <!-- размер и цвет текста наследуются абзацами внутри панели -->
    <ExpandPanel
      id="consentText"
      class="text-[12.5px] leading-[1.55] text-fg-dim [&_p]:mb-s1"
      :open="isOpen"
    >
      <p>
        Оператор — команда проекта WEXUS ({{ TEAM_MEMBERS }}), контактные данные оператора —
        {{ TEAM_EMAIL }}.
      </p>
      <p>
        Перечень данных: имя, адрес электронной почты, а также сведения, которые ты добровольно
        напишешь в полях «как планируешь использовать» и «что хочешь проверить».
      </p>
      <p>
        Цель: связаться с тобой по заявке на тест прототипа и вести список участников испытаний. Для
        других целей, включая рассылки и рекламу, данные не используются.
      </p>
      <p>
        Действия с данными: сбор, запись, хранение, уточнение, использование, передача, удаление.
        Заявка доставляется на почту команды через сервис отправки форм FormSubmit (formsubmit.co);
        другим третьим лицам данные не передаются. Автоматизированного принятия решений не
        предусмотрено.
      </p>
      <p>
        Срок: до достижения цели или до отзыва согласия. Отозвать согласие можно письмом на тот же
        адрес — {{ TEAM_EMAIL }}; после отзыва данные удаляются.
      </p>
      <p>
        Согласие даётся свободно, своей волей и в своём интересе. Отказ от согласия ничего не меняет
        в доступе к сайту — форма просто не отправится.
      </p>
    </ExpandPanel>
    <p class="m-0 text-[12.5px] leading-[1.5] text-fg-dim">
      <!-- когда политика будет опубликована, замените span на <a href="/privacy"> -->
      <span class="border-b border-dashed border-hair text-fg"
        >Политика обработки персональных данных</span
      >
      и текст согласия отдельным документом — [скоро появится]
    </p>
  </div>
</template>

<style scoped>
/* квадрат галочки: заливается бирюзой, а сама галочка прочерчивается штрихом */
.consent__box {
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}
.consent__box svg {
  fill: none;
  stroke: var(--color-deep);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 18;
  stroke-dashoffset: 18;
  transition: stroke-dashoffset 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.consent__input:checked + .consent__box {
  background: var(--color-cyan);
  border-color: var(--color-cyan);
}
.consent__input:checked + .consent__box svg {
  stroke-dashoffset: 0;
}
/* сам чекбокс прозрачный — видимый фокус рисуем на квадрате */
.consent__input:focus-visible + .consent__box {
  outline: 2px solid var(--color-cyan);
  outline-offset: 3px;
}
</style>
