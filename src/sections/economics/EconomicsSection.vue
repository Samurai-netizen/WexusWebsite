<script setup lang="ts">
/**
 * ЭКРАН 6 — ЭКОНОМИКА ВЛАДЕНИЯ
 * Цифр по цене нет, поэтому считает пользователь: свой тариф и свою гипотезу
 * цены. Никаких выдуманных «экономий до 70%».
 *
 * Шапка как у сравнения и устройства, под ней — один «прибор»: слева ввод,
 * справа итог и график. Причина и следствие на одной панели.
 *
 * Состояние чисел — useOwnershipModel, математика — economics.ts,
 * геометрия графика — chartLayout.ts.
 */
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import ScreenSection from '@/components/layout/ScreenSection.vue'
import { useRevealOnce } from '@/composables/useRevealOnce'
import OwnershipCalc from './OwnershipCalc.vue'
import OwnershipChart from './OwnershipChart.vue'
import OwnershipStats from './OwnershipStats.vue'
import { clamp, REVEAL_MS, statsView } from './economics'
import { useOwnershipModel } from './useOwnershipModel'
import { trackAction } from '@/services/metrika'

const { feeInput, priceInput, termYears, target, shown, announcement } = useOwnershipModel()
watch([feeInput, priceInput, termYears], () => trackAction('calc_used'))
const stats = computed(() => statsView(shown.value, target.value))

/* ——— первый показ: цифры поднимаются, линии прочерчиваются слева направо ———
   Когда начинать, решает useRevealOnce (классы is-pending / is-in на обёртке);
   поднимаются части по CSS ниже, а линии прочерчивает скрипт через reveal. */
const board = useTemplateRef<HTMLElement>('board')
const { state: revealState, revealClass } = useRevealOnce(board)

/** доля прочерченного графика, 0…1; без анимации (static) график нарисован целиком */
const reveal = ref(1)

let revealFrame = 0
function playReveal() {
  const t0 = performance.now()
  const frame = (now: number) => {
    reveal.value = clamp((now - t0) / REVEAL_MS, 0, 1)
    if (reveal.value < 1) revealFrame = requestAnimationFrame(frame)
  }
  revealFrame = requestAnimationFrame(frame)
}
onBeforeUnmount(() => cancelAnimationFrame(revealFrame))

watch(revealState, (state) => {
  if (state === 'pending') reveal.value = 0
  else if (state === 'in') playReveal()
})
</script>

<template>
  <ScreenSection id="economics">
    <div
      class="wrap econ grid grid-cols-[minmax(0,1fr)] gap-y-s4 max-xl:gap-y-s3"
      :class="revealClass"
    >
      <div
        class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-end gap-s6 max-xl:gap-s5 max-lg:grid-cols-[minmax(0,1fr)] max-lg:gap-y-s3"
      >
        <h2 class="title-screen">Аренда тратит бюджет вечно. Покупка&nbsp;— это инвестиция.</h2>
        <p class="lede">
          Цена версий ещё не определена — это открытый вопрос проекта. Поэтому цифры подставляешь
          ты: смоделируй свой тариф и свою гипотезу цены.
        </p>
      </div>

      <!-- панель-прибор: на тёмном экране утоплена, на светлом приподнята — см. --board -->
      <div
        ref="board"
        class="grid grid-cols-[minmax(300px,0.38fr)_minmax(0,1fr)] rounded-ui border border-hair bg-board shadow-[0_24px_60px_rgba(0,0,0,0.16)] max-lg:grid-cols-[minmax(0,1fr)]"
      >
        <!-- ввод: две цифры пользователя -->
        <OwnershipCalc
          v-model:fee="feeInput"
          v-model:price="priceInput"
          v-model:term="termYears"
          :per-month="stats"
        />

        <!-- итог: три цифры и график -->
        <div class="flex min-w-0 flex-col gap-s3 p-s4 max-lg:p-s3 shorter:p-s3">
          <OwnershipStats :stats="stats" />
          <p id="result" class="sr-only" aria-live="polite">{{ announcement }}</p>
          <OwnershipChart :shown="shown" :target="target" :reveal="reveal" />
        </div>
      </div>
    </div>
  </ScreenSection>
</template>

<style scoped>
/* появление: цифры и шкала поднимаются по очереди, линии прочерчивает скрипт.
   Поднимающиеся части помечены классом econ-rise, задержка — переменной --rise-delay
   (цифры 0 / .08 / .16 с, шкала .24 с, «в пересчёте на месяц» .3 с). */
.econ.is-pending :deep(.econ-rise) {
  opacity: 0;
}
.econ.is-in :deep(.econ-rise) {
  animation: econ-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) var(--rise-delay, 0s) both;
}
@keyframes econ-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .econ.is-pending :deep(.econ-rise) {
    opacity: 1;
  }
  .econ.is-in :deep(.econ-rise) {
    animation: none !important;
  }
}
</style>
