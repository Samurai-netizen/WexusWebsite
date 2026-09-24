<script setup lang="ts">
/**
 * Связи одного режима схемы и «пакеты» на них. Элементы только рисуются здесь
 * и отдаются движку (useDataFlowAnimation) через функции-рефы по номеру связи —
 * положение, размер и прозрачность пакетов меняет он.
 *
 *   <SchemeLinks mode="local" v-bind="linkRefs" />
 */
import type { Mode } from './modes.data'
import { TAIL, linksOfMode, pathStart } from './dataFlow'
import type { ElementRef } from './useDataFlowAnimation'

const props = defineProps<{
  mode: Mode
  pathRefs: ElementRef[]
  headRefs: ElementRef[]
  tailRefs: ElementRef[][]
}>()

/* До первого запуска пакеты стоят в начале связи с нулевым радиусом — иначе они
   лежали бы в углу системы координат и растягивали границы svg */
const links = linksOfMode(props.mode).map((l) => ({ ...l, start: pathStart(l.d) }))
</script>

<template>
  <g
    stroke="#00C2B8"
    stroke-width="1.4"
    fill="none"
    stroke-dasharray="5 5"
    opacity="0.9"
    stroke-linecap="round"
  >
    <path
      v-for="link in links"
      :key="link.index"
      :ref="pathRefs[link.index]"
      class="link"
      :d="link.d"
    />
    <template v-for="link in links" :key="link.index">
      <circle
        v-for="(_, k) in TAIL"
        :key="k"
        :ref="tailRefs[link.index]![k]"
        class="pkt"
        fill="#00C2B8"
        r="0"
        :cx="link.start.x.toFixed(2)"
        :cy="link.start.y.toFixed(2)"
      />
      <circle
        :ref="headRefs[link.index]"
        class="pkt"
        fill="#00C2B8"
        r="0"
        :cx="link.start.x.toFixed(2)"
        :cy="link.start.y.toFixed(2)"
      />
    </template>
  </g>
</template>

<style scoped>
/* «пакеты»: положение, размер и прозрачность считает скрипт */
.pkt {
  opacity: 0;
  pointer-events: none;
  stroke: none;
}
</style>
