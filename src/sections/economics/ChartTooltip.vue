<script setup lang="ts">
/**
 * Подсказка графика: расходы на выбранный месяц. Значение крупнее подписи.
 * Положение считает OwnershipChart (ему нужен размер этой плашки — см. defineExpose).
 */
import { useTemplateRef } from 'vue'
import ChartKey from './ChartKey.vue'
import type { MonthReadout } from './economics'

defineProps<{
  readout: MonthReadout | null
  left: number
  top: number
}>()

const root = useTemplateRef<HTMLDivElement>('root')
defineExpose({ root })

const rowClass = 'grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-s1 leading-[1.75]'
const valueClass = 'text-right font-mono font-medium text-fg'
</script>

<template>
  <!-- читалка прибора всегда тёмная — theme-raised даёт ей свои токены вместо токенов экрана -->
  <div
    ref="root"
    class="theme-raised pointer-events-none absolute top-0 left-0 z-2 min-w-[184px] rounded-ui border border-quartz/18 bg-graphite/96 px-s2 py-[10px] text-[12.5px] text-fg-dim shadow-[0_14px_34px_rgba(0,0,0,0.45)]"
    :style="{ transform: `translate(${left}px,${top}px)` }"
    aria-hidden="true"
    :hidden="!readout"
  >
    <template v-if="readout">
      <p class="mb-[6px] font-mono text-[11.5px] text-fg-dim">{{ readout.title }}</p>
      <div :class="rowClass">
        <ChartKey kind="sub" /><span>подписка</span><b :class="valueClass">{{ readout.sub }}</b>
      </div>
      <div :class="rowClass">
        <ChartKey kind="own" /><span>WEXUS</span><b :class="valueClass">{{ readout.own }}</b>
      </div>
      <div :class="[rowClass, 'mt-[4px] border-t border-hair pt-[4px]']">
        <i></i><span>{{ readout.diffLabel }}</span
        ><b :class="valueClass">{{ readout.diff }}</b>
      </div>
    </template>
  </div>
</template>
