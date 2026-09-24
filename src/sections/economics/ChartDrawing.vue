<script setup lang="ts">
/**
 * Рисунок графика по готовой геометрии (layoutChart) — без логики.
 * Рендерится внутри <svg> в OwnershipChart. Цвета — классами ниже,
 * координаты — из layout, поэтому здесь нечего считать.
 */
import { r1 } from './economics'
import type { ChartLayout } from './chartLayout'

defineProps<{
  layout: ChartLayout
  /** перекрестие осматриваемого месяца: x и высоты точек подписки и покупки */
  hover: { x: number; ys: number; yo: number } | null
  /** есть ли линия покупки (цена > 0) — тогда на перекрестии и её точка */
  showOwn: boolean
}>()
</script>

<template>
  <g>
    <defs>
      <linearGradient id="econWash" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" style="stop-color: var(--accent); stop-opacity: var(--wash-lo)" />
        <stop offset="1" style="stop-color: var(--accent); stop-opacity: var(--wash-hi)" />
      </linearGradient>
      <clipPath id="econReveal">
        <rect x="0" y="0" :height="layout.height" :width="layout.revealWidth" />
      </clipPath>
    </defs>

    <!-- сетка и подписи оси ₽ -->
    <template v-for="tick in layout.yTicks" :key="tick.label.text">
      <line
        :x1="tick.x1"
        :x2="tick.x2"
        :y1="tick.y"
        :y2="tick.y"
        :class="tick.base ? 'ch-base' : 'ch-grid'"
      />
      <text :x="tick.label.x" :y="tick.label.y" text-anchor="end" class="ch-tick">{{
        tick.label.text
      }}</text>
    </template>
    <!-- подписи оси времени -->
    <text
      v-for="tick in layout.xTicks"
      :key="tick.text"
      :x="tick.x"
      :y="tick.y"
      :text-anchor="tick.anchor"
      class="ch-tick"
      >{{ tick.text }}</text
    >

    <!-- всё, что «прочерчивается» при первом показе -->
    <g clip-path="url(#econReveal)">
      <polygon v-if="layout.wash" :points="layout.wash" class="ch-wash" />
      <text
        v-if="layout.washNote"
        :x="layout.washNote.x"
        :y="layout.washNote.y"
        text-anchor="end"
        class="ch-note"
        >{{ layout.washNote.text }}</text
      >
      <line v-bind="layout.subLine" class="ch-sub" />
      <path v-if="layout.ownPath" :d="layout.ownPath" class="ch-own" />
      <template v-if="layout.breakEven">
        <line
          :x1="layout.breakEven.x"
          :x2="layout.breakEven.x"
          :y1="layout.breakEven.guideY1"
          :y2="layout.breakEven.baseY"
          class="ch-guide"
        />
        <circle :cx="layout.breakEven.x" :cy="layout.breakEven.baseY" r="2.5" class="ch-dot--own" />
        <circle :cx="layout.breakEven.x" :cy="layout.breakEven.y" r="5" class="be-halo" />
        <circle :cx="layout.breakEven.x" :cy="layout.breakEven.y" r="5" class="ch-node" />
      </template>
      <g v-if="layout.pill" class="ch-pill" :class="{ 'ch-pill--later': layout.pill.later }">
        <rect
          :x="layout.pill.x"
          :y="layout.pill.y"
          :width="layout.pill.w"
          :height="layout.pill.h"
          rx="12"
        />
        <text :x="layout.pill.textX" :y="layout.pill.textY" text-anchor="middle">{{
          layout.pill.text
        }}</text>
      </g>
      <template v-for="end in layout.ends" :key="end.kind">
        <circle :cx="end.cx" :cy="end.cy" r="4" class="ch-dot" :class="`ch-dot--${end.kind}`" />
        <text :x="end.label.x" :y="end.label.y" :text-anchor="end.label.anchor" class="ch-end">{{
          end.label.text
        }}</text>
      </template>
    </g>
  </g>

  <!-- перекрестие — отдельным слоем, чтобы не трогать остальной график -->
  <g v-if="hover">
    <line :x1="hover.x" :x2="hover.x" :y1="layout.MT" :y2="r1(layout.BY)" class="ch-cross" />
    <circle v-if="showOwn" :cx="hover.x" :cy="r1(hover.yo)" r="4" class="ch-dot ch-dot--own" />
    <circle :cx="hover.x" :cy="r1(hover.ys)" r="4" class="ch-dot ch-dot--sub" />
  </g>
</template>

<style scoped>
/* элементы графика: цвета здесь, геометрию считает layoutChart */
.ch-grid {
  stroke: rgba(var(--fg-rgb), 0.09);
  stroke-width: 1;
}
.ch-base {
  stroke: rgba(var(--fg-rgb), 0.26);
  stroke-width: 1;
}
.ch-tick {
  /* кегль и шрифт дублируются в F_TICK/F_END/F_NOTE (chartLayout.ts) — менять вместе */
  font-family: var(--font-mono);
  font-size: 11px;
  fill: rgba(var(--fg-rgb), 0.62);
}
.ch-sub {
  stroke: rgba(var(--fg-rgb), var(--sub-a));
  stroke-width: 2;
  stroke-linecap: round;
}
.ch-own {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ch-wash {
  fill: url(#econWash);
}
.ch-note {
  /* кегль и шрифт дублируются в F_TICK/F_END/F_NOTE (chartLayout.ts) — менять вместе */
  font-family: var(--font-sans);
  font-size: 12px;
  fill: rgba(var(--fg-rgb), 0.85);
}
.ch-end {
  /* кегль и шрифт дублируются в F_TICK/F_END/F_NOTE (chartLayout.ts) — менять вместе */
  font-family: var(--font-sans);
  font-size: 12.5px;
  font-weight: 500;
  fill: var(--fg);
}
.ch-dot {
  stroke: var(--board);
  stroke-width: 2;
}
.ch-dot--sub {
  fill: var(--fg);
}
.ch-dot--own {
  fill: var(--accent);
}
.ch-guide {
  stroke: var(--accent);
  stroke-width: 1;
  stroke-dasharray: 2 4;
  opacity: 0.55;
}
.ch-node {
  fill: var(--accent);
  stroke: var(--board);
  stroke-width: 2;
}
.ch-pill rect {
  fill: var(--pill-bg);
  stroke: rgba(var(--accent-rgb), 0.45);
  stroke-width: 1;
}
.ch-pill text {
  /* кегль и шрифт дублируются в F_TICK/F_END/F_NOTE (chartLayout.ts) — менять вместе */
  font-family: var(--font-sans);
  font-size: 12px;
  fill: var(--fg);
}
.ch-pill--later rect {
  fill: var(--board);
  stroke: rgba(var(--fg-rgb), 0.26);
}
.ch-pill--later text {
  fill: rgba(var(--fg-rgb), 0.72);
}
.ch-cross {
  stroke: rgba(var(--fg-rgb), 0.5);
  stroke-width: 1;
}

/* точка окупаемости расходится волной — тот же сигнал, что у индикатора */
.be-halo {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.4;
  transform-box: fill-box;
  transform-origin: center;
  animation: halo 1.9s ease-out infinite;
}
@keyframes halo {
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(3.2);
  }
}
@media (prefers-reduced-motion: reduce) {
  .be-halo {
    animation: none !important;
  }
}
</style>
