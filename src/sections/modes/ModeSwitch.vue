<script setup lang="ts">
/**
 * Переключатель режимов (role="tablist"): две вкладки и скользящий бегунок.
 * Выбранный режим — v-model; панели с текстом и схема читают его в ModesSection.
 */
import { computed, useTemplateRef } from 'vue'
import SlidingMarker from '@/components/ui/SlidingMarker.vue'
import { MODES, panelId, tabId, type Mode } from './modes.data'

const mode = defineModel<Mode>({ required: true })

const buttons = useTemplateRef<HTMLButtonElement[]>('buttons')
const activeButton = computed(
  () => buttons.value?.find((b) => b.dataset.mode === mode.value) ?? null,
)

/* стрелки — штатная клавиатурная навигация для role="tablist" */
function onKeydown(event: KeyboardEvent, index: number) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  const shift = event.key === 'ArrowRight' ? 1 : -1
  const next = MODES[(index + shift + MODES.length) % MODES.length]!
  buttons.value?.find((b) => b.dataset.mode === next.id)?.focus()
  mode.value = next.id
}
</script>

<template>
  <div
    class="relative mt-s5 mb-s4 flex gap-s2 max-sm:flex-col"
    role="tablist"
    aria-label="Режимы работы"
  >
    <SlidingMarker :target="activeButton" />
    <button
      v-for="(item, index) in MODES"
      :id="tabId(item.id)"
      :key="item.id"
      ref="buttons"
      type="button"
      role="tab"
      :aria-controls="panelId(item.id)"
      :aria-selected="item.id === mode ? 'true' : 'false'"
      :data-mode="item.id"
      class="relative z-1 min-h-12 flex-1 rounded-ui border border-hair bg-transparent px-s3 font-sans text-[15px] font-medium text-fg-dim transition-[border-color,color] duration-200 ease-[ease] active:scale-[.99] aria-selected:border-transparent aria-selected:text-fg aria-[selected=false]:hover:border-fg-dim aria-[selected=false]:hover:text-fg"
      @click="mode = item.id"
      @keydown="onKeydown($event, index)"
    >
      {{ item.label }}
    </button>
  </div>
</template>
