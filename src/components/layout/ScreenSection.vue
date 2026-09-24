<script setup lang="ts">
/**
 * Обёртка экрана ленты: <section> с id, фоном и темой из src/content/sections.ts.
 * Внутри темы работают утилиты text-fg, text-fg-dim, border-hair, bg-panel, text-accent.
 *
 *   <ScreenSection id="problem">
 *     <div class="wrap">…</div>
 *   </ScreenSection>
 *
 * Дополнительные классы (class="…") добавляются к <section>.
 * Сам элемент <section> доступен родителю через ref: `screenRef.value?.root`.
 */
import { computed, useTemplateRef } from 'vue'
import { getSection, themeClassOf, toneOf, type SectionId } from '@/content/sections'

const props = defineProps<{ id: SectionId }>()

const section = computed(() => getSection(props.id))
const tone = computed(() => toneOf(section.value.background))

// явная ссылка вместо $el: $el ломается в dev, если корень шаблона станет фрагментом
const root = useTemplateRef<HTMLElement>('root')
defineExpose({ root })
</script>

<template>
  <section
    :id="id"
    ref="root"
    class="screen"
    :class="[`screen-${section.background}`, themeClassOf(tone)]"
    :data-theme="tone"
  >
    <slot />
  </section>
</template>
