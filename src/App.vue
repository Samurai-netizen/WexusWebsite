<script setup lang="ts">
/**
 * Каркас страницы: мини-шапка, рейка разделов, лента экранов и окно заявки.
 * Порядок экранов задаёт SECTIONS в src/content/sections.ts, здесь — только
 * какой компонент рисует каждый экран.
 */
import { onBeforeUnmount, onMounted, useTemplateRef, watch, type Component } from 'vue'
import { useHead } from '@unhead/vue'

import TopBar from '@/components/layout/TopBar.vue'
import SectionRail from '@/components/layout/SectionRail.vue'
import RequestModal from '@/components/request/RequestModal.vue'
import HeroSection from '@/sections/hero/HeroSection.vue'
import ProblemSection from '@/sections/problem/ProblemSection.vue'
import ModesSection from '@/sections/modes/ModesSection.vue'
import DeviceSection from '@/sections/device/DeviceSection.vue'
import CompareSection from '@/sections/compare/CompareSection.vue'
import EconomicsSection from '@/sections/economics/EconomicsSection.vue'
import FinalSection from '@/sections/final/FinalSection.vue'

import { startSectionTracking, useSectionState } from '@/composables/useSectionTracking'
import { SECTIONS, type SectionId } from '@/content/sections'
import { faqJsonLd, productJsonLd } from '@/content/structuredData'
import { createScreenReporter, sendParamsOnce } from '@/services/metrika'

// Структурированные данные для поисковиков попадают в пререндеренный HTML
useHead({
  // без этого пререндер ставит lang="en"
  htmlAttrs: { lang: 'ru' },
  script: [
    { type: 'application/ld+json', innerHTML: JSON.stringify(productJsonLd) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(faqJsonLd) },
  ],
})

// Record по SectionId: новый экран в SECTIONS без компонента здесь не пройдёт проверку типов
const SCREENS: Record<SectionId, Component> = {
  hero: HeroSection,
  problem: ProblemSection,
  modes: ModesSection,
  device: DeviceSection,
  compare: CompareSection,
  economics: EconomicsSection,
  final: FinalSection,
}

const deck = useTemplateRef<HTMLElement>('deck')
let stopTracking: (() => void) | undefined

/* Метрика: до какого экрана дошёл посетитель. Своя разметка, потому что на широком
   экране прокручивается лента, а не окно, — глубину прокрутки Метрика там не видит.
   Первый экран не шлём: с него начинается каждый визит. В отчёте «Параметры визитов»
   экраны подписаны номером и названием из рейки: «3. Как работает». */
const screens = createScreenReporter((id) => {
  const index = SECTIONS.findIndex((s) => s.id === id)
  if (index > 0) sendParamsOnce({ screen: { [`${index + 1}. ${SECTIONS[index]!.label}`]: 1 } })
})
const { activeId } = useSectionState()
watch(activeId, (id) => screens.enter(id))

onMounted(() => {
  if (deck.value) stopTracking = startSectionTracking(deck.value)
})
onBeforeUnmount(() => {
  stopTracking?.()
  screens.stop()
})
</script>

<template>
  <a class="skip" href="#modes">Перейти к описанию продукта</a>

  <TopBar />
  <SectionRail />

  <main ref="deck" class="deck">
    <component :is="SCREENS[section.id]" v-for="section in SECTIONS" :key="section.id" />
  </main>

  <RequestModal />
</template>
