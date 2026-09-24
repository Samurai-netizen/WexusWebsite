<script setup lang="ts">
/**
 * Схема экрана «Проблема»: твои устройства → интернет с разрывом → чужой
 * дата-центр, внизу — ежемесячные платежи. Статичная картинка, без анимации.
 * Координаты перенесены из исходного лендинга без изменений.
 */
import { PAYMENT_MARK_X } from './problem.data'

// Общие атрибуты подписей схемы (как в исходнике — атрибутами, а не классом):
// кегль 12.5 задан в единицах viewBox, на узком экране его поднимает CSS ниже.
// Подпись пишется одной строкой <text …>текст</text>: если текст окажется на
// отдельной строке, Vue оставит пробелы по краям, а с text-anchor="end" это
// сдвигает подпись. Общий тест src/__tests__/svgText.spec.ts это проверяет.
const LABEL = {
  'font-family': 'IBM Plex Sans, sans-serif',
  'font-size': '12.5',
  fill: '#12162B',
  opacity: '0.8',
} as const
</script>

<template>
  <svg
    class="block h-auto w-full"
    viewBox="0 0 480 322"
    role="img"
    aria-label="Схема: твои устройства обращаются к чужому дата-центру через интернет; связь может прерваться, а платёж идёт каждый месяц"
  >
    <!-- твои устройства -->
    <g fill="none" stroke="#12162B" stroke-width="1.1" opacity="0.75">
      <rect x="20" y="46" width="92" height="56" rx="5" />
      <rect x="25" y="51" width="82" height="46" rx="2" opacity="0.5" />
      <line x1="12" y1="107" x2="120" y2="107" stroke-width="1.1" />
      <rect x="42" y="132" width="44" height="68" rx="7" />
      <rect x="47" y="139" width="34" height="54" rx="2" opacity="0.5" />
      <rect x="26" y="230" width="80" height="58" rx="6" />
      <rect x="34" y="236" width="66" height="46" rx="2" opacity="0.5" />
    </g>
    <circle cx="30" cy="259" r="1.6" fill="#12162B" opacity="0.5" />
    <text x="20" y="34" v-bind="LABEL">твои устройства</text>

    <!-- сведение в один канал -->
    <g stroke="#12162B" stroke-width="1" opacity="0.45" fill="none">
      <path d="M 112 74 C 145 74, 150 160, 178 160" />
      <path d="M 86 166 L 178 161" />
      <path d="M 106 259 C 145 259, 150 162, 178 162" />
    </g>
    <circle cx="178" cy="161" r="3.4" fill="#12162B" opacity="0.6" />

    <!-- канал до чужого сервера: пунктир с разрывом -->
    <g stroke="#12162B" stroke-width="1.2" opacity="0.5">
      <line x1="182" y1="161" x2="232" y2="161" stroke-dasharray="4 4" />
      <line x1="262" y1="161" x2="308" y2="161" stroke-dasharray="4 4" />
      <line x1="240" y1="150" x2="254" y2="172" />
      <line x1="254" y1="150" x2="240" y2="172" />
    </g>
    <text x="196" y="192" v-bind="LABEL">интернет</text>

    <!-- чужой дата-центр -->
    <g fill="none" stroke="#12162B" stroke-width="1.1" opacity="0.75">
      <rect x="312" y="96" width="146" height="130" rx="10" />
      <line x1="330" y1="130" x2="440" y2="130" />
      <line x1="330" y1="161" x2="440" y2="161" />
      <line x1="330" y1="192" x2="440" y2="192" />
    </g>
    <g fill="#12162B" opacity="0.35">
      <circle cx="336" cy="115" r="3" />
      <circle cx="336" cy="146" r="3" />
      <circle cx="336" cy="177" r="3" />
    </g>
    <text x="458" y="84" text-anchor="end" v-bind="LABEL">чужой дата-центр</text>

    <!-- платёж каждый месяц: двенадцать отметок = год аренды -->
    <g fill="#12162B" opacity="0.32">
      <rect v-for="x in PAYMENT_MARK_X" :key="x" :x="x" y="262" width="6" height="16" rx="1" />
    </g>
    <text x="458" y="296" text-anchor="end" v-bind="LABEL">платежи каждый месяц</text>
  </svg>
</template>

<style scoped>
/* Подписи внутри схемы масштабируются вместе с svg — на узком экране
   поднимаем их кегль, иначе получается 6–7 px реального размера */
@media (max-width: 700px) {
  text {
    font-size: 19px;
  }
}
</style>
