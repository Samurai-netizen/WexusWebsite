<script setup lang="ts">
/**
 * Три цифры итога: подписка за срок, окупаемость, экономия.
 * На ширине ≤ 560 px встают строками: подпись слева, значение справа.
 */
import type { StatsView } from './economics'

defineProps<{ stats: StatsView }>()

/* общие классы одной цифры: колонка с линией слева, на телефоне — строка с линией сверху */
const statClass =
  "econ-rise grid min-w-0 content-start gap-[4px] border-l border-hair px-s3 first:border-l-0 first:pl-0 max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-x-s2 max-sm:border-t max-sm:border-l-0 max-sm:px-0 max-sm:py-s2 max-sm:[grid-template-areas:'label_value'_'sub_value'] max-sm:first:border-t-0 max-sm:first:pt-0"
const dtClass = 'text-[13px] text-fg-dim max-sm:[grid-area:label]'
const valueClass =
  'flex items-center gap-[10px] font-display text-[length:clamp(22px,2.1vw,30px)] leading-[1.15] font-semibold tracking-[-0.01em] whitespace-nowrap text-fg max-sm:[grid-area:value] max-sm:self-center max-sm:text-[22px]'
const subClass = 'text-[12.5px] leading-[1.4] text-fg-dim opacity-80 max-sm:[grid-area:sub]'
</script>

<template>
  <dl class="m-0 grid grid-cols-3 max-sm:grid-cols-1">
    <div :class="statClass">
      <dt :class="dtClass">Подписка за {{ stats.horizon }}</dt>
      <dd :class="valueClass">{{ stats.total }}</dd>
      <dd :class="subClass">{{ stats.totalSub }}</dd>
    </div>
    <div :class="[statClass, '[--rise-delay:.08s]']">
      <dt :class="dtClass">Окупаемость</dt>
      <dd :class="valueClass">
        <!-- узел окупаемости: горит, только когда покупка отбивается в пределах срока -->
        <i
          class="stat-node size-2 shrink-0 rounded-full"
          :class="stats.hasPayback ? 'is-on bg-accent' : 'bg-fg/28'"
          aria-hidden="true"
        ></i
        ><span>{{ stats.payback }}</span>
      </dd>
      <dd :class="subClass">{{ stats.paybackSub }}</dd>
    </div>
    <div :class="[statClass, '[--rise-delay:.16s]']">
      <dt :class="dtClass">{{ stats.saveLabel }}</dt>
      <dd :class="valueClass">{{ stats.save }}</dd>
      <dd :class="subClass">{{ stats.saveSub }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.stat-node.is-on {
  animation: econ-ping 2.2s ease-out infinite;
}
@keyframes econ-ping {
  from {
    box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.45);
  }
  to {
    box-shadow: 0 0 0 10px rgba(var(--accent-rgb), 0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .stat-node.is-on {
    animation: none !important;
  }
}
</style>
