<script setup lang="ts">
/**
 * Индикатор положения справа (широкие экраны) и полоса прогресса сверху
 * (≤ 1180 px, где рейка не помещается). Не меню: узлы на одной линии —
 * тот же nodal-язык, что у знака. Активный узел горит акцентом темы.
 * Класс темы — по тону текущего экрана: цвет линии и узлов берётся из --fg / --accent.
 */
import { SECTIONS, themeClassOf } from '@/content/sections'
import { useSectionState } from '@/composables/useSectionTracking'

const { activeId, activeTone, progress } = useSectionState()
</script>

<template>
  <nav
    class="fixed top-1/2 right-4 z-50 flex -translate-y-1/2 flex-col gap-s3 px-s2 py-s3 before:absolute before:top-s3 before:bottom-s3 before:left-1/2 before:w-px before:bg-current before:opacity-25 before:content-[''] max-xl:hidden"
    :class="themeClassOf(activeTone)"
    aria-label="Разделы страницы"
  >
    <a
      v-for="section in SECTIONS"
      :key="section.id"
      :href="`#${section.id}`"
      class="group relative flex items-center justify-end text-inherit no-underline"
      :aria-current="section.id === activeId ? 'true' : 'false'"
    >
      <!-- подпись выведена из потока: ширина рейки = точка, поэтому она не давит
           на контент. Появляется только при наведении или фокусе — как подсказка -->
      <span
        class="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] -translate-y-1/2 rounded-ui px-[9px] py-[5px] text-xs leading-none whitespace-nowrap opacity-0 transition-opacity duration-150 ease-linear group-hover:opacity-100 group-focus-visible:opacity-100"
        :class="activeTone === 'dark' ? 'bg-deep/92' : 'bg-paper/94'"
      >
        {{ section.label }}
      </span>
      <span
        class="relative z-1 size-[9px] shrink-0 rounded-full border border-current"
        :class="section.id === activeId ? 'border-accent bg-accent' : 'bg-transparent'"
      />
    </a>
  </nav>

  <div class="fixed inset-x-0 top-0 z-50 hidden h-0.5 max-xl:block" aria-hidden="true">
    <span class="block h-full bg-cyan" :style="{ width: `${progress * 100}%` }" />
  </div>
</template>
