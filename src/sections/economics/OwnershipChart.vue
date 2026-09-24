<script setup lang="ts">
/**
 * График накопленных расходов: подписка растёт без остановки, покупка — один
 * платёж и дальше ровно. Клин между линиями после точки окупаемости — экономия.
 *
 * Геометрию считает layoutChart (chartLayout.ts), здесь — только отрисовка
 * по ней и осмотр месяца: мышь, касание и клавиатура.
 */
import { computed, onMounted, ref, shallowRef, triggerRef, useTemplateRef, watch } from 'vue'
import { defaultDocument, useEventListener, useResizeObserver } from '@vueuse/core'
import ChartDrawing from './ChartDrawing.vue'
import ChartKey from './ChartKey.vue'
import ChartTooltip from './ChartTooltip.vue'
import {
  clampMonth,
  focusMonth,
  monthForKey,
  monthReadout,
  r1,
  type CalcState,
  type CalcTarget,
} from './economics'
import { layoutChart, monthToX, placeTip, valueToY, xToMonth } from './chartLayout'

const props = defineProps<{
  shown: CalcState
  target: CalcTarget
  /** доля прочерченного графика при первом показе, 0…1 */
  reveal: number
}>()

const canvas = useTemplateRef<HTMLDivElement>('canvas')
const chart = useTemplateRef<SVGSVGElement>('chart')
const tooltip = useTemplateRef<InstanceType<typeof ChartTooltip>>('tooltip')

/* ——— размер холста: график рисуется в пикселях холста, viewBox = его размер ——— */
const width = ref(0)
const height = ref(0)
function readSize() {
  if (!canvas.value) return
  width.value = canvas.value.clientWidth
  height.value = canvas.value.clientHeight
}
useResizeObserver(canvas, readSize)

/* ——— ширина подписи по настоящему шрифту: по ней считаются поля и коллизии ———
   canvas есть только в браузере, поэтому контекст появляется в onMounted.
   Он реактивный (shallowRef): layout пересчитывается, когда контекст появился
   и когда догрузились веб-шрифты (triggerRef). */
const ctx = shallowRef<CanvasRenderingContext2D | null>(null)
function measure(text: string, font: string): number {
  if (!ctx.value) return 0
  ctx.value.font = font
  return ctx.value.measureText(text).width
}
onMounted(() => {
  ctx.value = document.createElement('canvas').getContext('2d')
  readSize()
  // ширины подписей изменились — пересчитать layout
  document.fonts?.ready.then(() => triggerRef(ctx))
})

const layout = computed(() => {
  if (!ctx.value) return null
  return layoutChart({
    shown: props.shown,
    target: props.target,
    width: width.value,
    height: height.value,
    reveal: props.reveal,
    measure,
  })
})

/* ——— осмотр месяца: перекрестие и подсказка ——— */
const hoverMonth = ref<number | null>(null)

/* Текст <title> — одной строкой: переносы из шаблона попали бы в подсказку браузера */
const CHART_TITLE =
  'График накопленных расходов: подписка против разовой покупки. С клавиатуры: стрелки влево и вправо — по месяцам, Shift со стрелкой — по годам.'

const hover = computed(() => {
  const l = layout.value
  if (hoverMonth.value == null || !l || props.reveal < 1) return null
  const readout = monthReadout(props.shown, hoverMonth.value)
  return {
    readout,
    x: r1(monthToX(l, readout.month)),
    ys: valueToY(l, readout.spent),
    yo: valueToY(l, props.shown.price),
  }
})

/* Подсказка встаёт сбоку от перекрестия, где есть место. Для этого нужен её
   размер, поэтому позиция считается после отрисовки текста (flush: 'post'). */
const tipPos = ref({ left: 0, top: 0 })
watch(
  hover,
  (h) => {
    const el = tooltip.value?.root
    const l = layout.value
    if (!h || !el || !l) return
    tipPos.value = placeTip({
      x: h.x,
      ys: h.ys,
      yo: h.yo,
      tipW: el.offsetWidth,
      tipH: el.offsetHeight,
      width: l.width,
      height: l.height,
    })
  },
  { flush: 'post' },
)

function onPoint(event: PointerEvent) {
  const l = layout.value
  if (!l || !chart.value) return
  const rect = chart.value.getBoundingClientRect()
  hoverMonth.value = clampMonth(xToMonth(l, event.clientX - rect.left), props.target.months)
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return /* на таче подсказка живёт до касания мимо графика */
  hoverMonth.value = null
}

useEventListener(defaultDocument, 'pointerdown', (event: PointerEvent) => {
  if (hoverMonth.value != null && !chart.value?.contains(event.target as Node)) {
    hoverMonth.value = null
  }
})

/* с клавиатуры осмотр начинается с точки окупаемости — самого интересного места */
function onFocus() {
  if (hoverMonth.value != null) return
  hoverMonth.value = focusMonth(props.target)
}

function onKeydown(event: KeyboardEvent) {
  const next = monthForKey(event.key, event.shiftKey, hoverMonth.value, props.target.months)
  if (!next) return
  event.preventDefault()
  hoverMonth.value = next.month
}
</script>

<template>
  <figure class="m-0 flex min-w-0 flex-1 flex-col gap-s2">
    <div
      class="econ-rise flex flex-wrap items-center justify-between gap-x-s3 gap-y-s1 border-t border-hair pt-s3 [--rise-delay:.24s]"
    >
      <ul class="m-0 flex list-none flex-wrap gap-x-s3 gap-y-[6px] p-0 text-[12.5px] text-fg-dim">
        <li class="flex items-center gap-s1"><ChartKey kind="sub" />подписка</li>
        <li class="flex items-center gap-s1"><ChartKey kind="own" />WEXUS, один платёж</li>
        <li class="flex items-center gap-s1"><ChartKey kind="wash" />экономия</li>
      </ul>
    </div>

    <!-- график забирает остаток высоты: если колонка ввода выше, он растёт, а не оставляет пустоту -->
    <div
      ref="canvas"
      class="relative min-h-[clamp(200px,30vh,320px)] flex-[1_1_auto] shorter:min-h-[clamp(190px,28vh,260px)]"
    >
      <svg
        ref="chart"
        class="absolute inset-0 block h-full w-full cursor-crosshair touch-pan-y overflow-visible focus-visible:rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-accent"
        :viewBox="layout ? `0 0 ${layout.width} ${layout.height}` : undefined"
        role="img"
        tabindex="0"
        aria-labelledby="chartTitle"
        aria-describedby="result"
        @pointermove="onPoint"
        @pointerdown="onPoint"
        @pointerleave="onPointerLeave"
        @focus="onFocus"
        @blur="hoverMonth = null"
        @keydown="onKeydown"
      >
        <title id="chartTitle">{{ CHART_TITLE }}</title>

        <ChartDrawing v-if="layout" :layout="layout" :hover="hover" :show-own="shown.price > 0" />
      </svg>
      <ChartTooltip
        ref="tooltip"
        :readout="hover?.readout ?? null"
        :left="tipPos.left"
        :top="tipPos.top"
      />
    </div>
    <figcaption class="note text-[12.5px]">
      Проведи по графику — он покажет расходы на любой месяц выбранного срока.
    </figcaption>
  </figure>
</template>
