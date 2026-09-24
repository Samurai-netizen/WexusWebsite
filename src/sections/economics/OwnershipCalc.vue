<script setup lang="ts">
/**
 * Левая половина прибора — ввод: тариф, цена, срок и «в пересчёте на месяц».
 * Числа — v-model (текст полей и срок), полоски — готовые тексты из statsView.
 */
import AmountInput from './AmountInput.vue'
import { FEE_FIELD, PRICE_FIELD, TERM_YEARS, termSrSuffix, type TermYears } from './economics.data'
import type { StatsView } from './economics'

defineProps<{
  perMonth: Pick<StatsView, 'perMonthSub' | 'perMonthOwn' | 'perMonthSubWidth' | 'perMonthOwnWidth'>
}>()

const fee = defineModel<string>('fee', { required: true })
const price = defineModel<string>('price', { required: true })
const term = defineModel<TermYears>('term', { required: true })
</script>

<template>
  <!-- на узком экране прибор складывается: ввод сверху, поля в два столбца -->
  <div
    class="flex flex-col gap-s3 border-r border-hair p-s4 max-lg:grid max-lg:grid-cols-2 max-lg:border-r-0 max-lg:border-b max-lg:p-s3 max-sm:grid-cols-1 shorter:p-s3"
  >
    <AmountInput v-model="fee" :field="FEE_FIELD" />
    <AmountInput v-model="price" :field="PRICE_FIELD" />

    <!-- срок задаёт сам пользователь: окупаемость от него не зависит, а итог — зависит -->
    <fieldset class="m-0 min-w-0 border-0 p-0 max-lg:col-span-full" aria-describedby="termHint">
      <legend class="mb-s1 p-0 text-[13.5px] text-fg-dim">Сколько лет будешь пользоваться</legend>
      <!-- сегменты на одной подложке — тот же язык, что у выбора объёма -->
      <div class="grid grid-cols-6 rounded-ui border border-hair bg-panel">
        <label
          v-for="years in TERM_YEARS"
          :key="years"
          class="group relative block cursor-pointer border-hair not-first:border-l"
        >
          <input
            v-model="term"
            class="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
            type="radio"
            name="term"
            :value="years"
          />
          <span
            class="flex min-h-11 items-center justify-center rounded-[calc(var(--radius-ui)-1px)] font-mono text-[15px] font-medium text-fg-dim transition-[color,background-color,box-shadow] duration-200 ease-[ease] group-hover:text-fg peer-checked:bg-cyan/10 peer-checked:text-fg peer-checked:inset-ring peer-checked:inset-ring-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
            >{{ years }}<i class="sr-only">{{ termSrSuffix(years) }}</i></span
          >
        </label>
      </div>
      <p id="termHint" class="mt-s1 text-[12.5px] leading-[1.4] text-fg-dim opacity-75">
        накопитель в среднем служит 10&nbsp;лет
      </p>
    </fieldset>

    <!-- месяц владения: подписка против цены, разделённой на выбранный срок -->
    <div
      class="econ-rise grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-s2 gap-y-s1 border-t border-hair pt-s3 [--rise-delay:.3s] max-lg:col-span-full lg:mt-auto"
    >
      <p class="col-span-full text-[13.5px] text-fg-dim">В пересчёте на месяц</p>
      <span class="min-w-[8ch] text-[13px] text-fg-dim">подписка</span>
      <i class="block h-[6px] overflow-hidden rounded-[3px] bg-fg/10">
        <span
          class="block h-full rounded-[3px] bg-fg/62"
          :style="{ width: perMonth.perMonthSubWidth }"
        ></span>
      </i>
      <b class="text-right font-mono text-[13.5px] font-medium text-fg">{{
        perMonth.perMonthSub
      }}</b>
      <span class="min-w-[8ch] text-[13px] text-fg-dim">WEXUS</span>
      <i class="block h-[6px] overflow-hidden rounded-[3px] bg-fg/10">
        <span
          class="block h-full rounded-[3px] bg-accent"
          :style="{ width: perMonth.perMonthOwnWidth }"
        ></span>
      </i>
      <b class="text-right font-mono text-[13.5px] font-medium text-fg">{{
        perMonth.perMonthOwn
      }}</b>
    </div>
  </div>
</template>
