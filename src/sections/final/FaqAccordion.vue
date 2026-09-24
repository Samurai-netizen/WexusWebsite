<script setup lang="ts">
/**
 * Аккордеон вопросов: раскрыт всегда один ответ; раскрытие анимирует ExpandPanel.
 * Тексты — из src/content/faq.ts (из них же собирается FAQPage для поисковиков).
 * Страница загружается со всеми свёрнутыми ответами, но текст ответов
 * есть в пререндеренном HTML — поисковики его видят.
 */
import { ref } from 'vue'

import ExpandPanel from '@/components/ui/ExpandPanel.vue'
import { FAQ } from '@/content/faq'
import { faqAnswerId, faqQuestionId, nextOpenIndex } from './faqAccordion'

/** Номер раскрытого вопроса; null — все свёрнуты. */
const openIndex = ref<number | null>(null)

function toggle(index: number) {
  openIndex.value = nextOpenIndex(openIndex.value, index)
}
</script>

<template>
  <div id="faq" class="grid">
    <div v-for="(item, index) in FAQ" :key="item.question" class="relative border-b border-hair">
      <!-- переходы и состояния (наведение, фокус, раскрыт) — в <style scoped> ниже -->
      <button
        :id="faqQuestionId(index)"
        class="faq-q relative flex min-h-[54px] w-full items-center justify-between gap-s3 py-[14px] text-left font-sans text-[15px] leading-[1.35] text-fg-dim"
        type="button"
        :aria-expanded="openIndex === index ? 'true' : 'false'"
        :aria-controls="faqAnswerId(index)"
        @click="toggle(index)"
      >
        <!-- узловая точка слева — тот же язык, что у знака: наведённый вопрос «подключается» -->
        <span
          class="faq-node absolute top-1/2 left-0 mt-[-3.5px] size-[7px] rounded-full bg-cyan"
          aria-hidden="true"
        />
        <span>{{ item.question }}</span>
        <!-- плюс: у раскрытого вопроса вертикальная черта (.v) схлопывается — выходит минус -->
        <svg
          class="faq-sign size-[14px] shrink-0 overflow-visible"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <line class="h" x1="2.5" y1="8" x2="13.5" y2="8" />
          <line class="v" x1="8" y1="2.5" x2="8" y2="13.5" />
        </svg>
      </button>

      <ExpandPanel
        :id="faqAnswerId(index)"
        role="region"
        :aria-labelledby="faqQuestionId(index)"
        :open="openIndex === index"
      >
        <p
          v-for="paragraph in item.answer"
          :key="paragraph"
          class="mb-s3 max-w-[60ch] pl-[20px] text-[14px] leading-[1.55] text-fg-dim"
        >
          {{ paragraph }}
        </p>
      </ExpandPanel>
    </div>
  </div>
</template>

<style scoped>
/* При prefers-reduced-motion все переходы гасит глобальное правило в main.css —
   состояния переключаются мгновенно, без анимации. */

/* ---- Вопрос: наведённый, в фокусе или раскрытый сдвигается вправо,
   освобождая место узловой точке, и становится ярче ---- */
.faq-q {
  transition:
    color 0.22s ease,
    padding-left 0.34s cubic-bezier(0.22, 1, 0.36, 1);
}
.faq-q:hover,
.faq-q:focus-visible,
.faq-q[aria-expanded='true'] {
  color: var(--fg);
  padding-left: 20px;
}

/* ---- Узловая точка: появляется с лёгким «перелётом» (кривая > 1) ---- */
.faq-node {
  opacity: 0;
  transform: scale(0.2);
  transition:
    opacity 0.22s ease,
    transform 0.34s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.faq-q:hover .faq-node,
.faq-q:focus-visible .faq-node {
  opacity: 0.55;
  transform: scale(1);
}
/* стоит после правила наведения: у раскрытого вопроса точка горит в полную силу */
.faq-q[aria-expanded='true'] .faq-node {
  opacity: 1;
  transform: scale(1);
}

/* ---- Знак плюс/минус ---- */
.faq-sign {
  transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}
.faq-sign line {
  stroke: currentColor;
  stroke-width: 1.3;
  transform-origin: 8px 8px;
  transition:
    transform 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s ease;
}
.faq-q:hover .faq-sign {
  color: var(--color-cyan);
  transform: scale(1.18);
}
.faq-q[aria-expanded='true'] .faq-sign {
  transform: rotate(180deg);
  color: var(--color-cyan);
}
.faq-q[aria-expanded='true'] .faq-sign .v {
  transform: scaleY(0);
  opacity: 0;
}
</style>
