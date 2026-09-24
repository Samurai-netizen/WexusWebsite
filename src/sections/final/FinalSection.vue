<script setup lang="ts">
/**
 * Экран 7 — ВОПРОСЫ, СТАТУС ПРОЕКТА, ФИНАЛЬНЫЙ CTA и подвал.
 * Слева: заголовок, честный статус проекта (вместо отзывов и логотипов,
 * которых у проекта нет) и повтор главного действия. Справа — вопросы.
 * Внизу экрана — подвал сайта (SiteFooter).
 *
 * Классы экрана (комментарий здесь, а не в шаблоне: HTML-комментарий перед
 * корневым элементом в режиме разработки превращает компонент в фрагмент):
 * - justify-between + gap: вопросы занимают свободную высоту, подвал прижат к низу;
 * - lg:pb-s4: снизу экрана подвал, поэтому поле меньше обычного. На узком экране
 *   остаётся общее поле ленты — там снизу нужен запас под липкую панель.
 *   Верхнее поле не трогаем: его задаёт общий .screen (запас под липкую шапку).
 */
import ScreenSection from '@/components/layout/ScreenSection.vue'
import { useRequestModal } from '@/composables/useRequestModal'
import FaqAccordion from './FaqAccordion.vue'
import SiteFooter from './SiteFooter.vue'
import { STATUS_ROWS } from './final.data'

const { openRequestModal } = useRequestModal()
</script>

<template>
  <ScreenSection id="final" class="justify-between gap-s4 lg:pb-s4 shorter:gap-s3">
    <div
      class="wrap grid flex-1 grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] content-center items-center gap-s6 max-xl:gap-s5 max-lg:grid-cols-[minmax(0,1fr)]"
    >
      <div>
        <h2 class="title-screen mb-s3">Часто задаваемые вопросы</h2>

        <div class="my-s4 grid gap-[7px] border-t border-hair pt-s3">
          <div
            v-for="row in STATUS_ROWS"
            :key="row.label"
            class="grid grid-cols-[15ch_1fr] gap-s2 text-[13.5px] text-fg-dim max-lg:grid-cols-[12ch_1fr]"
          >
            <span>{{ row.label }}</span>
            <b class="font-mono font-medium text-fg">{{ row.value }}</b>
          </div>
        </div>

        <p class="lede text-fg">Заинтересовал проект? Получи свой прототип WX-1TB</p>
        <!-- mb-s2 (на узком экране mb-s4): в исходнике под кнопкой стоял пустой абзац
             с отступом s2 — его место сохраняется, иначе колонка сместится по высоте -->
        <div class="mt-s3 mb-s2 flex flex-wrap items-center gap-s4 max-lg:mb-s4 max-sm:gap-s3">
          <button class="btn" type="button" @click="openRequestModal($event, 'final')">
            Оставить заявку на прототип
          </button>
        </div>
      </div>

      <FaqAccordion />
    </div>

    <SiteFooter />
  </ScreenSection>
</template>
