<script setup lang="ts">
/**
 * Правая колонка первого экрана: устройство WX-1TB (вид сверху из брендборда,
 * те же координаты), мягкое свечение под ним и подписи.
 *
 * Вся анимация — CSS (см. <style scoped>): дуги сигнала за корпусом, значок
 * радиомодуля и индикатор соединения идут одним тактом из токенов --sig-*
 * (src/styles/main.css). Скрипт только ставит анимацию на паузу, пока экран
 * не виден: такт при этом не сбивается, потому что замирает всё сразу.
 */
import { ref, useTemplateRef } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const root = useTemplateRef<HTMLElement>('root')

// По умолчанию анимация идёт (и без JS, и до первого ответа наблюдателя) —
// пауза ставится, только когда точно известно, что устройство за кадром.
const isOffscreen = ref(false)
// Берём последнюю запись: если поток был занят, наблюдатель присылает несколько
// накопившихся записей разом, от старой к новой — верна только последняя.
useIntersectionObserver(root, (entries) => {
  const entry = entries[entries.length - 1]
  if (entry) isOffscreen.value = !entry.isIntersecting
})

// Гравировка пишется одной строкой <text …>текст</text>, атрибуты — здесь:
// если текст окажется на отдельной строке, в <text> попадут пробелы по краям
// и надпись сдвинется. Общий тест src/__tests__/svgText.spec.ts.
const WORDMARK = {
  'font-family': 'Space Grotesk, sans-serif',
  'font-weight': '600',
  'font-size': '11.5',
  fill: '#b3bbdd',
} as const
const CAPACITY = {
  'font-family': 'IBM Plex Mono, monospace',
  'font-size': '7.5',
  fill: '#b3bbdd',
  opacity: '0.75',
} as const
</script>

<template>
  <div
    ref="root"
    class="relative ml-auto w-full max-w-[460px] max-lg:order-2"
    :class="{ 'is-paused': isOffscreen }"
  >
    <!-- мягкое свечение под устройством — тот же cyan, что у индикатора -->
    <div
      class="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[78%] -translate-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,194,184,0.16)_0%,rgba(0,194,184,0)_68%)]"
      aria-hidden="true"
    />
    <svg
      class="block h-auto w-full"
      viewBox="88 6 214 142"
      role="img"
      aria-label="WEXUS WX-1TB, вид сверху: индикатор соединения, шкала заряда, зона Wi-Fi-антенны и гравировка"
    >
      <defs>
        <!-- корпус подняли вместе с фоном: на прежних тонах тёмный край
             корпуса оказался темнее поля и силуэт растворялся -->
        <linearGradient id="heroTop" x1="6%" y1="0%" x2="94%" y2="100%">
          <stop offset="0%" stop-color="#454D79" />
          <stop offset="38%" stop-color="#2B3257" />
          <stop offset="100%" stop-color="#1F2646" />
        </linearGradient>
        <filter id="heroGrain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <linearGradient id="heroBevel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#a2aad4" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#a2aad4" stop-opacity="0" />
        </linearGradient>
        <radialGradient id="heroLed" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#00C2B8" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#00C2B8" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- корпус -->
      <rect x="95" y="26" width="165" height="107" rx="12" fill="url(#heroTop)" />
      <rect
        x="95"
        y="26"
        width="165"
        height="107"
        rx="12"
        filter="url(#heroGrain)"
        opacity="0.03"
        pointer-events="none"
      />
      <rect x="95" y="26" width="165" height="14" rx="12" fill="url(#heroBevel)" />
      <rect
        x="95.4"
        y="26.4"
        width="164.2"
        height="106.2"
        rx="11.6"
        fill="none"
        stroke="#737bab"
        stroke-width="0.7"
        opacity="0.6"
      />
      <rect
        x="101"
        y="32"
        width="153"
        height="95"
        rx="7"
        fill="none"
        stroke="#949cca"
        stroke-width="0.4"
        opacity="0.16"
      />

      <!-- фактура матовой поверхности -->
      <g stroke="#ffffff" stroke-width="0.35" opacity="0.05">
        <line x1="107" y1="64" x2="248" y2="64" />
        <line x1="107" y1="72" x2="248" y2="72" />
        <line x1="107" y1="80" x2="248" y2="80" />
        <line x1="107" y1="88" x2="248" y2="88" />
        <line x1="107" y1="96" x2="248" y2="96" />
      </g>

      <!-- радиопрозрачная зона антенны -->
      <rect x="186" y="34" width="64" height="21" rx="5" fill="#2f3660" opacity="0.5" />
      <rect
        x="186"
        y="34"
        width="64"
        height="21"
        rx="5"
        fill="none"
        stroke="#00C2B8"
        stroke-width="0.7"
        stroke-dasharray="2.2 2.2"
        opacity="0.85"
      />
      <!-- значок радиомодуля: вспыхивает волной наружу — точка, дуга, дуга —
           в один такт с большими дугами за корпусом -->
      <g class="hero-wifi" stroke="#00C2B8" fill="none" stroke-width="0.8" stroke-linecap="round">
        <circle class="wf1" cx="218" cy="50" r="1.2" fill="#00C2B8" stroke="none" />
        <path class="wf2" d="M 214 48 A 3.9 3.9 0 0 1 222 48" />
        <path class="wf3" d="M 210 46 A 8 8 0 0 1 226 46" />
      </g>

      <!-- сигнал, уходящий за пределы корпуса: устройство раздаёт сеть -->
      <g class="sig" fill="none" stroke="#00C2B8" stroke-linecap="round">
        <path d="M 269.3 31.7 A 16 16 0 0 1 269.3 56.3" stroke-width="1.1" opacity="0.8" />
        <path d="M 277.0 22.6 A 28 28 0 0 1 277.0 65.4" stroke-width="1" opacity="0.5" />
        <path d="M 284.7 13.4 A 40 40 0 0 1 284.7 74.6" stroke-width="0.9" opacity="0.3" />
      </g>

      <!-- индикатор соединения -->
      <circle class="led-halo" cx="114" cy="46" r="7.5" fill="url(#heroLed)" />
      <circle class="led-core" cx="114" cy="46" r="2.7" fill="#00C2B8" />

      <!-- шкала заряда, 4 сегмента -->
      <g>
        <rect x="128" y="44" width="6.4" height="4.2" rx="1.8" fill="#00C2B8" opacity="0.9" />
        <rect x="137.5" y="44" width="6.4" height="4.2" rx="1.8" fill="#00C2B8" opacity="0.9" />
        <rect x="147" y="44" width="6.4" height="4.2" rx="1.8" fill="#00C2B8" opacity="0.5" />
        <rect x="156.5" y="44" width="6.4" height="4.2" rx="1.8" fill="#949cca" opacity="0.25" />
      </g>

      <!-- гравировка знака и объёма -->
      <g opacity="0.6">
        <g transform="translate(108,105) scale(0.105)">
          <circle cx="50" cy="50" r="9" fill="#b3bbdd" />
          <circle cx="50" cy="14" r="3.2" fill="#b3bbdd" />
          <circle cx="82" cy="68" r="3.2" fill="#b3bbdd" />
          <circle cx="18" cy="68" r="3.2" fill="#b3bbdd" />
          <line x1="50" y1="50" x2="50" y2="18" stroke="#b3bbdd" stroke-width="2.4" />
          <line x1="50" y1="50" x2="79" y2="66" stroke="#b3bbdd" stroke-width="2.4" />
          <line x1="50" y1="50" x2="21" y2="66" stroke="#b3bbdd" stroke-width="2.4" />
        </g>
        <text x="122" y="112" v-bind="WORDMARK">wexus</text>
        <text x="230" y="112" v-bind="CAPACITY">1TB</text>
      </g>
    </svg>
    <p class="mono mt-s3">WX–1TB prototype / rev 01 / 96 × 72 × 9 мм</p>
    <p class="mono mt-s3">
      Первый прототип на стадии разработки. Следите за проектом в соц. сетях Wexus
    </p>
  </div>
</template>

<style scoped>
/* ============================================================
   ДВИЖЕНИЕ ПЕРВОГО ЭКРАНА
   Один такт на весь экран (значения — токены --sig-* в main.css): появление
   заканчивается ровно тогда, когда начинается волна, поэтому первый показ
   не выбивается из ритма, а дальше всё идёт одним периодом.
   ============================================================ */
@keyframes sig-draw {
  from {
    stroke-dashoffset: 130;
    opacity: 0;
  }
  to {
    stroke-dashoffset: 0;
    opacity: var(--lo);
  }
}
/* значок на корпусе появляется так же, только чертить в нём нечего */
@keyframes sig-in {
  from {
    opacity: 0;
  }
  to {
    opacity: var(--lo);
  }
}
/* волна расходится наружу: дуги вспыхивают по очереди, а не мигают вместе */
@keyframes sig-wave {
  0% {
    opacity: var(--lo);
    stroke-width: var(--w);
  }
  18% {
    opacity: var(--hi);
    stroke-width: calc(var(--w) * 1.5);
  }
  60% {
    opacity: var(--lo);
    stroke-width: var(--w);
  }
  100% {
    opacity: var(--lo);
    stroke-width: var(--w);
  }
}
/* индикатор на корпусе дышит в такт расходящейся волне */
@keyframes hero-led {
  0% {
    opacity: 0.5;
  }
  18% {
    opacity: 1;
  }
  60% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.5;
  }
}
@keyframes hero-halo {
  0% {
    opacity: 0.25;
    transform: scale(0.9);
  }
  18% {
    opacity: 0.75;
    transform: scale(1.18);
  }
  60% {
    opacity: 0.25;
    transform: scale(0.9);
  }
  100% {
    opacity: 0.25;
    transform: scale(0.9);
  }
}

/* сигнал за корпусом: сначала прочерчивается, затем расходится волной наружу.
   Базовое состояние — дуги спрятаны до старта анимации. */
.sig path {
  stroke-dasharray: 130;
  stroke-dashoffset: 130;
  opacity: 0;
  animation:
    sig-draw var(--sig-in) cubic-bezier(0.33, 0, 0.2, 1) forwards,
    sig-wave var(--sig-t) var(--sig-e) infinite;
}
/* три уровня — внутренний, средний, внешний: чем дальше дуга, тем она тише */
.sig path:nth-of-type(1) {
  --hi: 1;
  --lo: 0.1;
  --w: 1.1;
  animation-delay: calc(var(--sig-1) - var(--sig-in)), var(--sig-1);
}
.sig path:nth-of-type(2) {
  --hi: 0.78;
  --lo: 0.07;
  --w: 1;
  animation-delay: calc(var(--sig-2) - var(--sig-in)), var(--sig-2);
}
.sig path:nth-of-type(3) {
  --hi: 0.52;
  --lo: 0.05;
  --w: 0.9;
  animation-delay: calc(var(--sig-3) - var(--sig-in)), var(--sig-3);
}

/* значок на корпусе: те же keyframes, период и задержки — точка и дуги
   появляются и вспыхивают вместе с дугами своего уровня за корпусом */
.hero-wifi > * {
  opacity: 0;
  animation:
    sig-in var(--sig-in) cubic-bezier(0.33, 0, 0.2, 1) forwards,
    sig-wave var(--sig-t) var(--sig-e) infinite;
}
.hero-wifi .wf1 {
  --hi: 0.95;
  --lo: 0.34;
  --w: 0.8;
  animation-delay: calc(var(--sig-1) - var(--sig-in)), var(--sig-1);
}
.hero-wifi .wf2 {
  --hi: 0.8;
  --lo: 0.26;
  --w: 0.8;
  animation-delay: calc(var(--sig-2) - var(--sig-in)), var(--sig-2);
}
.hero-wifi .wf3 {
  --hi: 0.65;
  --lo: 0.2;
  --w: 0.8;
  animation-delay: calc(var(--sig-3) - var(--sig-in)), var(--sig-3);
}

/* индикатор соединения вспыхивает вместе с внутренним уровнем волны */
.led-core {
  animation: hero-led var(--sig-t) var(--sig-e) var(--sig-1) infinite both;
}
.led-halo {
  transform-box: fill-box;
  transform-origin: center;
  animation: hero-halo var(--sig-t) var(--sig-e) var(--sig-1) infinite both;
}

/* экран за кадром — такт замирает целиком и продолжается с того же места */
.is-paused .sig path,
.is-paused .hero-wifi > *,
.is-paused .led-core,
.is-paused .led-halo {
  animation-play-state: paused;
}

/* Пользователь отключил анимацию: сигнал остаётся видимым, просто не движется */
@media (prefers-reduced-motion: reduce) {
  .sig path,
  .hero-wifi > * {
    animation: none !important;
    stroke-dashoffset: 0;
    opacity: var(--hi);
  }
  .led-core {
    animation: none !important;
    opacity: 1;
  }
  .led-halo {
    animation: none !important;
    opacity: 0.25;
    transform: scale(0.9);
  }
}
</style>
