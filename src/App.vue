<script setup lang="ts">
/**
 * Каркас страницы: мини-шапка, рейка разделов, лента экранов и окно заявки.
 * Порядок экранов задаёт SECTIONS в src/content/sections.ts, здесь — только
 * какой компонент рисует каждый экран.
 */
import { onBeforeUnmount, onMounted, useTemplateRef, type Component } from 'vue'
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

import { startSectionTracking } from '@/composables/useSectionTracking'
import { SECTIONS, type SectionId } from '@/content/sections'
import { faqJsonLd, productJsonLd } from '@/content/structuredData'

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

onMounted(() => {
  if (deck.value) stopTracking = startSectionTracking(deck.value)
})
onBeforeUnmount(() => stopTracking?.())
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
