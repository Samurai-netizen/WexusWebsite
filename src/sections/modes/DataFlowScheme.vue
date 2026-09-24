<script setup lang="ts">
/**
 * Схема подключения с живым обменом данными. Один и тот же набор узлов
 * (WEXUS слева, три клиента справа), меняется только источник сети.
 * Анимацию ведёт useDataFlowAnimation: он получает элементы через рефы
 * (pathRefs, headRefs, tailRefs, ledRefs) и меняет их атрибуты напрямую.
 */
import { toRef } from 'vue'
import type { Mode } from './modes.data'
import { useDataFlowAnimation } from './useDataFlowAnimation'
import SchemeLinks from './SchemeLinks.vue'

const props = defineProps<{
  mode: Mode
  /** экран виден — схема запускается при первом показе и засыпает вне экрана */
  active: boolean
}>()

const { isLive, pathRefs, headRefs, tailRefs, ledRefs } = useDataFlowAnimation({
  mode: toRef(props, 'mode'),
  active: toRef(props, 'active'),
})

const linkRefs = { pathRefs, headRefs, tailRefs }

// Подписи схемы пишутся одной строкой <text …>текст</text>, общие атрибуты — здесь:
// если текст окажется на отдельной строке, в <text> попадут пробелы по краям,
// и подпись с text-anchor="end" съедет. Общий тест src/__tests__/svgText.spec.ts.
const LABEL = {
  'font-family': 'IBM Plex Sans, sans-serif',
  'font-size': '12.5',
  fill: '#EAE8DF',
  opacity: '0.72',
} as const
const WORDMARK = {
  'font-family': 'Space Grotesk, sans-serif',
  'font-weight': '600',
  'font-size': '15',
  fill: '#EAE8DF',
} as const
const CAPACITY = {
  'font-family': 'IBM Plex Mono, monospace',
  'font-size': '10',
  fill: '#EAE8DF',
  opacity: '0.6',
} as const
</script>

<template>
  <!-- переключение состояний схемы — через класс на обёртке -->
  <div class="scheme" :class="[`is-${mode}`, { 'is-live': isLive }]">
    <svg
      class="block h-auto w-full"
      viewBox="0 -18 640 368"
      role="img"
      aria-label="Схема подключения: в домашней сети устройства соединяются через роутер, в автономном режиме — напрямую с WEXUS"
    >
      <!-- ——— общие узлы: WEXUS слева, три клиента справа ——— -->
      <!-- ноутбук -->
      <g fill="none" stroke="#EAE8DF" stroke-width="1.1" opacity="0.8">
        <rect x="470" y="26" width="130" height="78" rx="5" />
        <rect x="477" y="33" width="116" height="64" rx="2" opacity="0.45" />
        <rect x="458" y="108" width="154" height="6" rx="3" />
        <!-- телефон -->
        <rect x="508" y="138" width="54" height="92" rx="9" />
        <rect x="514" y="147" width="42" height="74" rx="2" opacity="0.45" />
        <!-- планшет -->
        <rect x="470" y="262" width="130" height="72" rx="6" />
        <rect x="480" y="269" width="112" height="58" rx="2" opacity="0.45" />
      </g>
      <circle cx="474" cy="298" r="1.8" fill="#EAE8DF" opacity="0.5" />
      <!-- сигнальные точки: клиент подтверждает подключение -->
      <circle :ref="ledRefs.c0" class="node-led" cx="578" cy="47" r="3.2" fill="#00C2B8" />
      <circle :ref="ledRefs.c1" class="node-led" cx="543" cy="160" r="3.2" fill="#00C2B8" />
      <circle :ref="ledRefs.c2" class="node-led" cx="578" cy="283" r="3.2" fill="#00C2B8" />
      <text x="600" y="8" text-anchor="end" v-bind="LABEL">до 4-х устройств сразу</text>

      <!-- корпус WEXUS -->
      <rect
        x="40"
        y="148"
        width="176"
        height="64"
        rx="12"
        fill="#12162B"
        stroke="#737bab"
        stroke-width="0.8"
      />
      <circle cx="62" cy="168" r="7" fill="#00C2B8" opacity="0.2" />
      <!-- диод корпуса горит в покое ярко (--idle:1) — устройство включено -->
      <circle
        :ref="ledRefs.wexus"
        class="node-led"
        style="--idle: 1"
        cx="62"
        cy="168"
        r="2.6"
        fill="#00C2B8"
      />
      <g>
        <rect x="78" y="166" width="7" height="4.4" rx="1.8" fill="#00C2B8" opacity="0.9" />
        <rect x="88" y="166" width="7" height="4.4" rx="1.8" fill="#00C2B8" opacity="0.9" />
        <rect x="98" y="166" width="7" height="4.4" rx="1.8" fill="#00C2B8" opacity="0.5" />
        <rect x="108" y="166" width="7" height="4.4" rx="1.8" fill="#949cca" opacity="0.3" />
      </g>
      <text x="56" y="199" v-bind="WORDMARK">wexus</text>
      <text x="140" y="199" v-bind="CAPACITY">1TB</text>

      <!-- ——— режим 1: через существующий Wi-Fi ——— -->
      <g data-mode="local">
        <rect
          x="282"
          y="40"
          width="116"
          height="48"
          rx="8"
          fill="none"
          stroke="#EAE8DF"
          stroke-width="1.1"
          opacity="0.8"
        />
        <g stroke="#EAE8DF" stroke-width="1.1" opacity="0.8" fill="none" stroke-linecap="round">
          <line x1="308" y1="40" x2="300" y2="20" />
          <line x1="372" y1="40" x2="380" y2="20" />
        </g>
        <circle :ref="ledRefs.router" class="node-led" cx="340" cy="64" r="3.6" fill="#00C2B8" />
        <text x="282" y="108" v-bind="LABEL">твой роутер</text>

        <!-- «пакеты»: положение, размер и прозрачность считает useDataFlowAnimation -->
        <SchemeLinks mode="local" v-bind="linkRefs" />
        <text x="40" y="262" v-bind="LABEL">все в одной сети, стационарное питание</text>
      </g>

      <!-- ——— режим 2: собственная сеть устройства ——— -->
      <g data-mode="solo">
        <g opacity="0.2">
          <rect
            x="282"
            y="40"
            width="116"
            height="48"
            rx="8"
            fill="none"
            stroke="#EAE8DF"
            stroke-width="1.1"
          />
          <g stroke="#EAE8DF" stroke-width="1.1" fill="none" stroke-linecap="round">
            <line x1="308" y1="40" x2="300" y2="20" />
            <line x1="372" y1="40" x2="380" y2="20" />
            <line x1="290" y1="46" x2="390" y2="82" />
            <line x1="390" y1="46" x2="290" y2="82" />
          </g>
        </g>
        <!-- роутер в этом режиме не участвует — подпись тише -->
        <text x="282" y="108" v-bind="LABEL" opacity="0.45">твой роутер</text>

        <!-- собственная сеть: волны от корпуса -->
        <g stroke="#00C2B8" fill="none" stroke-width="1.1" opacity="0.5" stroke-linecap="round">
          <path d="M 232 158 A 26 26 0 0 1 232 202" />
          <path d="M 246 146 A 42 42 0 0 1 246 214" />
          <path d="M 260 134 A 58 58 0 0 1 260 226" />
        </g>
        <SchemeLinks mode="solo" v-bind="linkRefs" />
        <text x="40" y="262" v-bind="LABEL">своя сеть, питание от батареи</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
/* режимные группы видны только при своём классе на обёртке */
.scheme [data-mode='local'],
.scheme [data-mode='solo'] {
  display: none;
}
.scheme.is-local [data-mode='local'],
.scheme.is-solo [data-mode='solo'] {
  display: block;
}

/* диоды узлов: тускло горят в покое и вспыхивают, когда пакет уходит или приходит */
.node-led {
  transform-box: fill-box;
  transform-origin: center;
  opacity: var(--idle, 0.34);
}
.node-led.is-blink {
  animation: led-blink 0.72s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes led-blink {
  0% {
    opacity: var(--idle, 0.34);
    transform: scale(1);
  }
  18% {
    opacity: 1;
    transform: scale(1.85);
  }
  46% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: var(--idle, 0.34);
    transform: scale(1);
  }
}

/* связи появляются не при загрузке страницы, а когда экран открылся */
.scheme:not(.is-live) :deep(.link) {
  opacity: 0;
}

/* на узком экране подписи схемы крупнее: иначе SVG сжимает их до нечитаемых */
@media (max-width: 700px) {
  .scheme text {
    font-size: 19px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .node-led.is-blink {
    animation: none !important;
  }
  .node-led {
    opacity: 0.5;
  }
  /* без анимации связи видны сразу — прочерчивания не будет */
  .scheme:not(.is-live) :deep(.link) {
    opacity: 1;
  }
}
</style>
