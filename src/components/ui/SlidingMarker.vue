<script setup lang="ts">
/**
 * Бегунок сегментированного переключателя (режимы, объём памяти) — единственное
 * место, где заданы его вид и движение. Родитель кнопок — position: relative,
 * у кнопок — relative z-1, чтобы текст был поверх бегунка.
 *
 *   const activeButton = computed(() => buttons.value?.find(…) ?? null)
 *   <div class="relative …">
 *     <SlidingMarker :target="activeButton" />
 *     <button class="relative z-1 …" …>
 *
 * Обводка — цвет акцента темы экрана (на тёмных экранах он совпадает с cyan).
 */
import { toRef } from 'vue'
import { useSlidingMarker } from '@/composables/useSlidingMarker'

const props = defineProps<{ target: HTMLElement | null }>()

const { markerStyle } = useSlidingMarker(toRef(props, 'target'))
</script>

<template>
  <!-- бегунок едет от кнопки к кнопке: позиция из фактической геометрии -->
  <span
    class="pointer-events-none absolute top-0 left-0 h-0 w-0 rounded-ui bg-cyan/10 inset-ring inset-ring-accent [transition:transform_.44s_cubic-bezier(.22,1,.36,1),width_.28s_ease,height_.28s_ease]"
    :style="markerStyle"
    aria-hidden="true"
  ></span>
</template>
