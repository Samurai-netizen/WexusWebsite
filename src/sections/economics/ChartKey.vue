<script setup lang="ts">
/**
 * Образец линии или заливки для легенды графика и подсказки.
 * Цвета берутся из токенов темы, поэтому в тёмной подсказке образец
 * подписки сам становится светлым (она переопределяет --fg-rgb).
 */
defineProps<{ kind: 'sub' | 'own' | 'wash' }>()

const KIND_CLASS = {
  sub: 'h-[2px] w-4 rounded-[1px] bg-[rgba(var(--fg-rgb),var(--sub-a,0.8))]',
  own: 'h-[2px] w-4 rounded-[1px] bg-accent',
  wash: 'size-3 rounded-[3px] bg-[linear-gradient(90deg,rgba(var(--accent-rgb),0.10),rgba(var(--accent-rgb),0.38))]',
} as const
</script>

<template>
  <i class="block shrink-0" :class="KIND_CLASS[kind]"></i>
</template>
