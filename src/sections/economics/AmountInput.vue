<script setup lang="ts">
/**
 * Числовое поле калькулятора: подпись, число, единица внутри поля («₽ в месяц»),
 * степперы − и +, подсказка под полем. v-model — текст поля как есть.
 */
import { computed, onBeforeUnmount } from 'vue'
import { inputWidth, stepAmount } from './economics'
import type { AmountField } from './economics.data'

const props = defineProps<{ field: AmountField }>()
const value = defineModel<string>({ required: true })

const hintId = computed(() => props.field.id + 'Hint')

/* поле по ширине числа: единица стоит вплотную к цифрам */
const widthStyle = computed(() => ({ width: inputWidth(value.value) }))

function onInput(event: Event) {
  value.value = (event.target as HTMLInputElement).value
}

/* ——— степперы: шаг из данных поля, значение встаёт на сетку шага; удержание — автоповтор ——— */
const HOLD_DELAY_MS = 420
const REPEAT_MS = 70
/** click после собственного нажатия указателем приходит раньше этого срока — его игнорируем.
 *  Выводится из двух констант выше: отпускание до начала автоповтора (до HOLD_DELAY_MS)
 *  или сразу после шага автоповтора (до REPEAT_MS) — иначе такой click дал бы второй шаг. */
const CLICK_GUARD_MS = HOLD_DELAY_MS + REPEAT_MS

/* У каждой кнопки своё состояние удержания — как у отдельных слушателей в исходнике */
interface HoldState {
  delay: ReturnType<typeof setTimeout> | undefined
  repeat: ReturnType<typeof setInterval> | undefined
  lastStepAt: number
  held: boolean
}
const hold: Record<1 | -1, HoldState> = {
  [-1]: { delay: undefined, repeat: undefined, lastStepAt: -1e6, held: false },
  [1]: { delay: undefined, repeat: undefined, lastStepAt: -1e6, held: false },
}

function bump(dir: 1 | -1) {
  const next = stepAmount(value.value, dir, props.field)
  if (next !== null) value.value = String(next)
}

function stopRepeat(dir: 1 | -1) {
  clearTimeout(hold[dir].delay)
  clearInterval(hold[dir].repeat)
}

function step(dir: 1 | -1) {
  hold[dir].lastStepAt = performance.now()
  bump(dir)
}

function onPointerDown(event: PointerEvent, dir: 1 | -1) {
  if (event.button !== 0) return
  const h = hold[dir]
  stopRepeat(dir)
  h.held = false
  /* мышь и перо реагируют сразу, палец — только на отпускание: касание может оказаться прокруткой */
  if (event.pointerType !== 'touch') step(dir)
  h.delay = setTimeout(() => {
    h.held = true
    h.repeat = setInterval(() => step(dir), REPEAT_MS)
  }, HOLD_DELAY_MS)
}

function onPointerUp(event: PointerEvent, dir: 1 | -1) {
  if (event.pointerType === 'touch' && !hold[dir].held) step(dir)
  stopRepeat(dir)
}

function onPointerLeave(dir: 1 | -1) {
  hold[dir].held = true
  stopRepeat(dir)
}

/* Enter и пробел приходят как click; свои же нажатия отсекаем по времени */
function onClick(dir: 1 | -1) {
  if (performance.now() - hold[dir].lastStepAt > CLICK_GUARD_MS) step(dir)
}

onBeforeUnmount(() => {
  stopRepeat(-1)
  stopRepeat(1)
})

const STEPPERS = [
  { dir: -1, path: 'M2 6h8' },
  { dir: 1, path: 'M2 6h8M6 2v8' },
] as const
</script>

<template>
  <div class="grid gap-s1">
    <label class="text-[13.5px] text-fg-dim" :for="field.id">{{ field.label }}</label>
    <div
      class="flex min-h-[54px] items-stretch rounded-ui border border-hair bg-panel transition-[border-color,background-color] duration-200 ease-[ease] focus-within:border-accent focus-within:bg-cyan/5 shorter:min-h-12 [&:hover:not(:focus-within)]:border-fg/34"
    >
      <input
        :id="field.id"
        class="num-input min-w-0 rounded-l-ui border-0 bg-transparent py-0 pr-0 pl-s3 font-mono text-[20px] font-medium text-fg focus-visible:outline-none"
        :style="widthStyle"
        type="number"
        :value="value"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        inputmode="numeric"
        :aria-describedby="hintId"
        @input="onInput"
      />
      <label
        class="flex flex-1 cursor-text items-center py-0 pr-s1 pl-[6px] text-[13.5px] whitespace-nowrap text-fg-dim"
        :for="field.id"
        >{{ field.unit }}</label
      >
      <button
        v-for="s in STEPPERS"
        :key="s.dir"
        class="flex flex-[0_0_42px] touch-manipulation items-center justify-center border-l border-hair bg-transparent p-0 text-fg-dim transition-[color,background-color] duration-200 ease-[ease] last:rounded-r-ui hover:bg-cyan/6 hover:text-accent active:bg-cyan/13"
        type="button"
        :aria-label="s.dir > 0 ? field.increaseLabel : field.decreaseLabel"
        @pointerdown="onPointerDown($event, s.dir)"
        @pointerup="onPointerUp($event, s.dir)"
        @pointerleave="onPointerLeave(s.dir)"
        @pointercancel="onPointerLeave(s.dir)"
        @click="onClick(s.dir)"
      >
        <svg
          class="size-3 fill-none stroke-current stroke-[1.5] [stroke-linecap:round]"
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path :d="s.path" />
        </svg>
      </button>
    </div>
    <p :id="hintId" class="text-[12.5px] leading-[1.4] text-fg-dim opacity-75">{{ field.hint }}</p>
  </div>
</template>

<style scoped>
/* число без встроенных стрелок браузера: вместо них свои степперы */
.num-input {
  -moz-appearance: textfield;
  appearance: textfield;
}
.num-input::-webkit-outer-spin-button,
.num-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
