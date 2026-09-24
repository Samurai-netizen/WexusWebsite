<script setup lang="ts">
/**
 * Липкая мини-шапка. Появляется после первого экрана: на длинной странице
 * действие должно быть в руке всегда. Не навигация — меню на лендинге
 * снижает конверсию. На мобильном уезжает вниз, в зону большого пальца.
 * Когда показывать и какой тон — решает useSectionTracking.
 */
import BrandMark from '@/components/ui/BrandMark.vue'
import { useRequestModal } from '@/composables/useRequestModal'
import { useSectionState } from '@/composables/useSectionTracking'

const { barVisible, activeTone } = useSectionState()
const { openRequestModal } = useRequestModal()
</script>

<template>
  <header
    class="bar fixed inset-x-0 top-0 z-55 flex items-center justify-between gap-s3 px-(--padX) py-s2 backdrop-blur-[10px] max-lg:top-auto max-lg:bottom-0 shorter:py-s1"
    :class="[activeTone === 'dark' ? 'bar-dark' : 'bar-light', { 'is-on': barVisible }]"
  >
    <a
      href="#hero"
      class="flex items-center gap-s2 font-display text-[17px] font-semibold tracking-[-0.015em] text-inherit no-underline"
    >
      <BrandMark class="h-[17px] w-5" />
      <span>wexus</span>
    </a>
    <button
      class="btn btn-sm max-lg:min-h-11 shorter:min-h-[34px]"
      type="button"
      @click="openRequestModal($event)"
    >
      Оставить заявку
    </button>
  </header>
</template>

<style scoped>
/* спрятана за верхним краем; visibility — чтобы кнопка не ловила фокус */
.bar {
  transform: translateY(-100%);
  visibility: hidden;
  transition:
    transform 0.28s ease,
    visibility 0s linear 0.28s;
}
.bar.is-on {
  transform: none;
  visibility: visible;
  transition:
    transform 0.28s ease,
    visibility 0s;
}

.bar-dark {
  background: rgba(var(--deep-rgb), 0.84);
  color: var(--color-quartz);
  border-bottom: 1px solid rgba(var(--quartz-rgb), 0.14);
}
.bar-light {
  background: rgba(242, 241, 236, 0.88);
  color: var(--color-graphite);
  border-bottom: 1px solid rgba(18, 22, 43, 0.12);
}

@media (max-width: 900px) {
  /* на мобильном прячется за нижний край, линия — сверху */
  .bar:not(.is-on) {
    transform: translateY(100%);
  }
  .bar-dark {
    border-bottom: none;
    border-top: 1px solid rgba(var(--quartz-rgb), 0.14);
  }
  .bar-light {
    border-bottom: none;
    border-top: 1px solid rgba(18, 22, 43, 0.12);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar,
  .bar.is-on {
    transition: none;
  }
}
</style>
