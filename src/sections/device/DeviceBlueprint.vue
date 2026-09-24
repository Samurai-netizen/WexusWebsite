<script setup lang="ts">
/**
 * Чертёж WEXUS: вид сверху и вид сбоку с выносками. Взят из брендборда без изменений:
 * координаты и пути скопированы из исходника один в один.
 *
 * engrave  — объём, выгравированный на корпусе (меняется переключателем объёма);
 * swapping — идёт смена гравировки: старая надпись гаснет и чуть приподнимается.
 *
 * Размер задаёт родитель классом на компоненте (он попадает на корневой <svg>).
 * Когда начинать сборку при первом появлении, решает useRevealOnce.
 */
import { useTemplateRef } from 'vue'
import { useRevealOnce } from '@/composables/useRevealOnce'

defineProps<{ engrave: string; swapping: boolean }>()

// Статичные надписи пишутся одной строкой <text …>текст</text>, поэтому их атрибуты
// (как в исходнике) собраны здесь: если текст окажется на отдельной строке, Vue оставит
// пробелы по краям, а при text-anchor это сдвигает надпись. Общий тест src/__tests__/svgText.spec.ts это проверяет.
const WORDMARK_ATTRS = {
  'font-family': 'Space Grotesk, sans-serif',
  'font-weight': '600',
  'font-size': '24',
  fill: '#b7bfe0',
} as const
const DIM_LABEL_ATTRS = {
  'text-anchor': 'middle',
  'font-family': 'IBM Plex Mono, monospace',
  'font-size': '13',
  fill: '#12162B',
  opacity: '0.55',
} as const

const svg = useTemplateRef<SVGSVGElement>('svg')
const { revealClass } = useRevealOnce(svg)
</script>

<template>
  <svg
    ref="svg"
    class="blueprint"
    :class="revealClass"
    viewBox="0 0 1000 384"
    role="img"
    aria-label="Чертёж WEXUS: вид сверху и вид сбоку с обозначением индикатора соединения, шкалы заряда, зоны Wi-Fi-антенны, гравировки, порта USB-C и кнопки питания"
  >
    <defs>
      <linearGradient id="bpTop" x1="8%" y1="0%" x2="92%" y2="100%">
        <stop offset="0%" stop-color="#404973" />
        <stop offset="42%" stop-color="#252c4c" />
        <stop offset="100%" stop-color="#12172e" />
      </linearGradient>
      <linearGradient id="bpSide" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#5a628e" />
        <stop offset="18%" stop-color="#2b3257" />
        <stop offset="72%" stop-color="#161b34" />
        <stop offset="100%" stop-color="#3a4166" />
      </linearGradient>
      <linearGradient id="bpBevel" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#aab2da" stop-opacity="0.55" />
        <stop offset="100%" stop-color="#aab2da" stop-opacity="0" />
      </linearGradient>
      <radialGradient id="bpLed" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#00C2B8" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#00C2B8" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- осевая линия макета: единственная структурная линия чертежа -->
    <line
      class="bp-axis"
      x1="500"
      y1="14"
      x2="500"
      y2="318"
      stroke="#12162B"
      stroke-width="0.7"
      stroke-dasharray="14 5 2 5"
      opacity="0.18"
    />

    <!-- ВИД СВЕРХУ -->
    <ellipse cx="500" cy="300" rx="188" ry="9" fill="#12162B" opacity="0.07" />
    <g class="bp-body">
      <rect x="310" y="44" width="380" height="244" rx="24" fill="url(#bpTop)" />
      <rect x="310" y="44" width="380" height="30" rx="24" fill="url(#bpBevel)" />
      <rect
        x="310.5"
        y="44.5"
        width="379"
        height="243"
        rx="23.5"
        fill="none"
        stroke="#7d85b5"
        stroke-width="0.9"
        opacity="0.55"
      />
      <rect
        x="322"
        y="56"
        width="356"
        height="220"
        rx="15"
        fill="none"
        stroke="#9aa2ce"
        stroke-width="0.5"
        opacity="0.15"
      />
      <g stroke="#ffffff" stroke-width="0.5" opacity="0.04">
        <line x1="330" y1="130" x2="670" y2="130" />
        <line x1="330" y1="150" x2="670" y2="150" />
        <line x1="330" y1="170" x2="670" y2="170" />
        <line x1="330" y1="190" x2="670" y2="190" />
        <line x1="330" y1="210" x2="670" y2="210" />
      </g>
    </g>

    <!-- радиопрозрачная зона антенны -->
    <g class="bp-ant">
      <rect x="556" y="66" width="108" height="46" rx="12" fill="#2f3660" opacity="0.45" />
      <rect
        x="556"
        y="66"
        width="108"
        height="46"
        rx="12"
        fill="none"
        stroke="#00C2B8"
        stroke-width="0.9"
        stroke-dasharray="3.5 3.5"
        opacity="0.85"
      />
      <g stroke="#00C2B8" fill="none" stroke-width="1.3" opacity="0.65" stroke-linecap="round">
        <path d="M 596 96 A 14 14 0 0 1 624 96" />
        <path d="M 603 101 A 7 7 0 0 1 617 101" />
      </g>
      <circle cx="610" cy="105" r="2" fill="#00C2B8" opacity="0.8" />
    </g>

    <!-- индикатор соединения и шкала заряда -->
    <circle class="bp-glow" cx="352" cy="88" r="17" fill="url(#bpLed)" />
    <circle class="bp-led" cx="352" cy="88" r="5.5" fill="#00C2B8" />
    <g class="bp-batt">
      <rect x="378" y="83.5" width="15" height="9" rx="4" fill="#00C2B8" opacity="0.92" />
      <rect x="400" y="83.5" width="15" height="9" rx="4" fill="#00C2B8" opacity="0.92" />
      <rect x="422" y="83.5" width="15" height="9" rx="4" fill="#00C2B8" opacity="0.5" />
      <rect x="444" y="83.5" width="15" height="9" rx="4" fill="#9aa2ce" opacity="0.26" />
    </g>

    <!-- гравировка знака и объёма -->
    <g class="bp-engrave" opacity="0.62">
      <g transform="translate(330,236) scale(0.26)">
        <circle cx="50" cy="50" r="9" fill="#b7bfe0" />
        <circle cx="50" cy="14" r="3.2" fill="#b7bfe0" />
        <circle cx="82" cy="68" r="3.2" fill="#b7bfe0" />
        <circle cx="18" cy="68" r="3.2" fill="#b7bfe0" />
        <line x1="50" y1="50" x2="50" y2="18" stroke="#b7bfe0" stroke-width="2.4" />
        <line x1="50" y1="50" x2="79" y2="66" stroke="#b7bfe0" stroke-width="2.4" />
        <line x1="50" y1="50" x2="21" y2="66" stroke="#b7bfe0" stroke-width="2.4" />
      </g>
      <text x="364" y="258" v-bind="WORDMARK_ATTRS">wexus</text>
      <text
        class="bp-cap"
        :class="{ 'is-swap': swapping }"
        x="664"
        y="258"
        text-anchor="end"
        font-family="IBM Plex Mono, monospace"
        font-size="16"
        fill="#b7bfe0"
        opacity="0.8"
      >
        {{ engrave }}
      </text>
    </g>

    <!-- ВИД СБОКУ -->
    <g class="bp-side">
      <rect x="310" y="326" width="380" height="28" rx="14" fill="url(#bpSide)" />
      <rect
        x="310.5"
        y="326.5"
        width="379"
        height="27"
        rx="13.5"
        fill="none"
        stroke="#7d85b5"
        stroke-width="0.8"
        opacity="0.5"
      />
      <line
        x1="324"
        y1="331.5"
        x2="676"
        y2="331.5"
        stroke="#aab2da"
        stroke-width="0.6"
        opacity="0.3"
      />
      <line x1="324" y1="340" x2="676" y2="340" stroke="#0b0e1a" stroke-width="0.6" opacity="0.4" />
      <rect x="648" y="333" width="28" height="15" rx="7.5" fill="#05060c" />
      <rect
        x="648"
        y="333"
        width="28"
        height="15"
        rx="7.5"
        fill="none"
        stroke="#7d85b5"
        stroke-width="0.5"
        opacity="0.5"
      />
      <rect x="336" y="336" width="24" height="9" rx="4.5" fill="#0d1124" opacity="0.92" />
    </g>

    <!-- ВЫНОСКИ: подпись стоит рядом с элементом, без буквенных кодов.
         Порядок путей, точек и подписей один и тот же — на нём держатся задержки сборки. -->
    <g class="bp-leaders" stroke="#12162B" stroke-width="0.8" fill="none" opacity="0.5">
      <path d="M 286 88 H 352" />
      <path d="M 286 148 H 372 L 418 94" />
      <path d="M 286 252 H 330" />
      <path d="M 714 88 H 664" />
      <path d="M 714 340 H 676" />
      <path d="M 286 340 H 348" />
    </g>
    <g class="bp-dots" fill="#12162B">
      <circle cx="352" cy="88" r="2.6" opacity="0.55" />
      <circle cx="418" cy="94" r="2.6" opacity="0.55" />
      <circle cx="330" cy="252" r="2.6" opacity="0.55" />
      <circle cx="664" cy="88" r="2.6" opacity="0.55" />
      <circle cx="676" cy="340" r="2.6" opacity="0.55" />
      <circle cx="348" cy="340" r="2.6" opacity="0.55" />
    </g>
    <g class="bp-callouts" font-family="IBM Plex Sans, sans-serif" font-size="15" fill="#12162B">
      <text x="274" y="92" text-anchor="end">Индикатор соединения</text>
      <text x="274" y="152" text-anchor="end">Шкала заряда, 4 сегмента</text>
      <text x="274" y="256" text-anchor="end">Гравировка логотипа и объёма</text>
      <text x="726" y="92">Радиопрозрачная зона Wi-Fi</text>
      <text x="726" y="344">Универсальный порт Type-C</text>
      <text x="274" y="344" text-anchor="end">Кнопка питания на торце</text>
    </g>

    <!-- единственный размер на чертеже: остальное — в таблице -->
    <g class="bp-dim" stroke="#12162B" stroke-width="0.7" opacity="0.4">
      <line x1="310" y1="377" x2="690" y2="377" />
      <line x1="310" y1="372" x2="310" y2="382" />
      <line x1="690" y1="372" x2="690" y2="382" />
    </g>
    <text class="bp-dim-label" x="500" y="371" v-bind="DIM_LABEL_ATTRS">96 мм</text>
  </svg>
</template>

<style scoped>
/* ---- Сборка при первом появлении: корпус, затем выноски, затем подписи ----
   Классы на корне ставит useRevealOnce: .is-pending — чертёж ещё ниже экрана,
   .is-in — появился. Без обоих классов (пререндер, reduced motion) чертёж просто виден. */
.blueprint .bp-body,
.blueprint .bp-side,
.blueprint .bp-ant,
.blueprint .bp-engrave,
.blueprint .bp-batt,
.blueprint .bp-led,
.blueprint .bp-glow {
  transform-box: fill-box;
  transform-origin: center;
}

/* Keyframes без «to»: конечное состояние берётся из самого элемента. Так части
   с собственной прозрачностью (гравировка 0.62, точки выносок 0.55) после сборки
   остаются такими, как нарисованы, а не становятся непрозрачными. */
@keyframes bp-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}
@keyframes bp-line {
  from {
    stroke-dashoffset: var(--len, 140);
  }
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes bp-fade {
  from {
    opacity: 0;
    transform: translateX(var(--dx, -8px));
  }
}
@keyframes led-breathe {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.82);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* пока чертёж ниже экрана, собираемые части спрятаны — иначе при появлении
   они мигнули бы: видны → пропали → собираются */
@media (prefers-reduced-motion: no-preference) {
  .blueprint.is-pending .bp-body,
  .blueprint.is-pending .bp-side,
  .blueprint.is-pending .bp-ant,
  .blueprint.is-pending .bp-engrave,
  .blueprint.is-pending .bp-leaders path,
  .blueprint.is-pending .bp-callouts text,
  .blueprint.is-pending .bp-dots circle {
    opacity: 0;
  }
}

.blueprint.is-in .bp-body {
  animation: bp-rise 0.62s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.blueprint.is-in .bp-side {
  animation: bp-rise 0.62s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both;
}
.blueprint.is-in .bp-ant {
  --dx: 0;
  animation: bp-fade 0.5s ease 0.34s both;
}
.blueprint.is-in .bp-engrave {
  --dx: 0;
  animation: bp-fade 0.5s ease 0.42s both;
}

/* выноски прочерчиваются от подписи к элементу; --len — не меньше длины пути */
.blueprint.is-in .bp-leaders path {
  stroke-dasharray: var(--len, 140);
  animation: bp-line 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.blueprint.is-in .bp-leaders path:nth-of-type(1) {
  animation-delay: 0.3s;
}
.blueprint.is-in .bp-leaders path:nth-of-type(2) {
  /* единственная выноска с изломом: 86 + 71 ≈ 157, при 140 конец не дорисовывался бы */
  --len: 158;
  animation-delay: 0.36s;
}
.blueprint.is-in .bp-leaders path:nth-of-type(3) {
  animation-delay: 0.42s;
}
.blueprint.is-in .bp-leaders path:nth-of-type(4) {
  animation-delay: 0.48s;
}
.blueprint.is-in .bp-leaders path:nth-of-type(5) {
  animation-delay: 0.54s;
}
.blueprint.is-in .bp-leaders path:nth-of-type(6) {
  animation-delay: 0.6s;
}

/* подписи и точки: левые выезжают слева, правые (с 4-й) — справа */
.blueprint.is-in .bp-callouts text,
.blueprint.is-in .bp-dots circle {
  animation: bp-fade 0.45s ease both;
}
.blueprint.is-in .bp-callouts text:nth-of-type(n + 4),
.blueprint.is-in .bp-dots circle:nth-of-type(n + 4) {
  --dx: 8px;
}
.blueprint.is-in .bp-callouts text:nth-of-type(1),
.blueprint.is-in .bp-dots circle:nth-of-type(1) {
  animation-delay: 0.46s;
}
.blueprint.is-in .bp-callouts text:nth-of-type(2),
.blueprint.is-in .bp-dots circle:nth-of-type(2) {
  animation-delay: 0.52s;
}
.blueprint.is-in .bp-callouts text:nth-of-type(3),
.blueprint.is-in .bp-dots circle:nth-of-type(3) {
  animation-delay: 0.58s;
}
.blueprint.is-in .bp-callouts text:nth-of-type(4),
.blueprint.is-in .bp-dots circle:nth-of-type(4) {
  animation-delay: 0.64s;
}
.blueprint.is-in .bp-callouts text:nth-of-type(5),
.blueprint.is-in .bp-dots circle:nth-of-type(5) {
  animation-delay: 0.7s;
}
.blueprint.is-in .bp-callouts text:nth-of-type(6),
.blueprint.is-in .bp-dots circle:nth-of-type(6) {
  animation-delay: 0.76s;
}

/* индикатор соединения дышит всегда, независимо от сборки */
.blueprint .bp-led {
  animation: led-breathe 3.4s ease-in-out infinite;
}

/* ---- Смена гравировки: короткое «перещёлкивание», как на приборе ----
   длительность = ENGRAVE_SWAP_MS (device.data.ts) — менять вместе */
.bp-cap {
  transition:
    opacity 0.13s ease,
    transform 0.13s ease;
}
.bp-cap.is-swap {
  opacity: 0;
  transform: translateY(-3px);
}

/* ---- Узкий экран: подписи внутри чертежа не читаются — их заменяет легенда ---- */
@media (max-width: 900px) {
  .blueprint .bp-callouts,
  .blueprint .bp-leaders,
  .blueprint .bp-dots {
    display: none;
  }
}

/* Пользователь отключил анимацию: чертёж не собирается, индикатор не дышит */
@media (prefers-reduced-motion: reduce) {
  .blueprint.is-in * {
    animation: none !important;
  }
  .blueprint .bp-led {
    animation: none !important;
  }
}
</style>
