<script setup lang="ts">
/**
 * Выбор объёма: одна подложка с бегунком вместо четырёх отдельных кнопок —
 * тот же язык, что у переключателя режимов. Кнопки-переключатели (aria-pressed)
 * в role="group": они меняют свойство устройства, а не открывают другую панель.
 * Что происходит после выбора (гравировка, модель), решает DeviceSection.
 */
import { computed, useTemplateRef } from 'vue'
import SlidingMarker from '@/components/ui/SlidingMarker.vue'
import { CAPACITY_OPTIONS } from './device.data'

const props = defineProps<{ selectedIndex: number }>()
const emit = defineEmits<{ select: [index: number] }>()

const buttons = useTemplateRef<HTMLButtonElement[]>('buttons')
// порядок элементов в ref-массиве v-for не гарантирован — ищем кнопку по data-cap
const activeButton = computed(() => {
  const cap = CAPACITY_OPTIONS[props.selectedIndex]?.engrave
  return buttons.value?.find((b) => b.dataset.cap === cap) ?? null
})
</script>

<template>
  <!-- на ≤ 560 px кнопки встают 2×2, бегунок следует за фактической геометрией -->
  <div
    class="relative mb-s2 grid grid-cols-[repeat(4,1fr)] rounded-ui border border-hair max-sm:grid-cols-[repeat(2,1fr)]"
    role="group"
    aria-label="Объём накопителя"
  >
    <SlidingMarker :target="activeButton" />
    <button
      v-for="(option, index) in CAPACITY_OPTIONS"
      :key="option.engrave"
      ref="buttons"
      type="button"
      :data-cap="option.engrave"
      :aria-pressed="index === selectedIndex ? 'true' : 'false'"
      class="relative z-1 min-h-[52px] px-s2 font-display text-[clamp(15px,1.3vw,18px)] font-semibold text-fg-dim transition-[color] duration-200 ease-[ease] hover:text-fg aria-pressed:text-fg"
      @click="emit('select', index)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
