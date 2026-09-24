<script setup lang="ts">
/**
 * Знак WEXUS: узел с тремя подключёнными устройствами.
 * Центр всегда cyan, спутники и линии — currentColor (цвет текста родителя).
 * Размер задаётся классом снаружи: <BrandMark class="h-[17px] w-5" />.
 * С label знак читается скринридером как картинка, без label — скрыт от него.
 */
defineProps<{ label?: string }>()
</script>

<template>
  <!-- viewBox обрезан по краям самого знака: иначе он визуально «висит»
       выше строчной надписи при выравнивании по центру -->
  <svg
    viewBox="14.8 10.8 70.4 60.4"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  >
    <circle cx="50" cy="50" r="9" fill="#00C2B8" />
    <circle cx="50" cy="14" r="3.2" fill="currentColor" />
    <circle cx="82" cy="68" r="3.2" fill="currentColor" />
    <circle cx="18" cy="68" r="3.2" fill="currentColor" />
    <line x1="50" y1="50" x2="50" y2="18" stroke="currentColor" stroke-width="2.4" />
    <line x1="50" y1="50" x2="79" y2="66" stroke="currentColor" stroke-width="2.4" />
    <line x1="50" y1="50" x2="21" y2="66" stroke="currentColor" stroke-width="2.4" />
  </svg>
</template>
