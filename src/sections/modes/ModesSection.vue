<script setup lang="ts">
/**
 * ЭКРАН 3 — ДВА РЕЖИМА.
 * Главный смысловой блок. Схема с переключателем: один и тот же
 * набор узлов, меняется только источник сети.
 */
import { ref, useTemplateRef } from 'vue'
import ScreenSection from '@/components/layout/ScreenSection.vue'
import { useInView } from '@/composables/useInView'
import ModeSwitch from './ModeSwitch.vue'
import DataFlowScheme from './DataFlowScheme.vue'
import { DEFAULT_MODE, MODES, STEPS, panelId, tabId, type Mode } from './modes.data'
import { LIVE_THRESHOLD } from './dataFlow'

const mode = ref<Mode>(DEFAULT_MODE)

/* схема оживает, когда экран виден хотя бы на 35 %, и засыпает вне экрана */
const section = useTemplateRef<InstanceType<typeof ScreenSection>>('section')
const { isInView } = useInView(() => section.value?.root, { threshold: LIVE_THRESHOLD })
</script>

<template>
  <ScreenSection id="modes" ref="section">
    <div
      class="wrap grid grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] items-center gap-s6 max-xl:gap-s5 max-lg:grid-cols-[minmax(0,1fr)]"
    >
      <div>
        <h2 class="title-screen mb-s3">Работает там, где не работает облако</h2>
        <p class="lede">
          Одно устройство, два способа подключения. Главный — автономный: без роутера, без
          интернета, без учётных записей, <strong>без доступа извне.</strong>
        </p>

        <ModeSwitch v-model="mode" />

        <div class="min-h-[5.5em] max-lg:min-h-0">
          <div
            v-for="item in MODES"
            v-show="item.id === mode"
            :id="panelId(item.id)"
            :key="item.id"
            role="tabpanel"
            :aria-labelledby="tabId(item.id)"
          >
            <p class="lede">{{ item.text }}</p>
          </div>
        </div>

        <p class="note mt-s3">Максимальное число одновременных подключений — 4.</p>

        <!-- порядок действий, а не список преимуществ -->
        <div
          class="mt-s4 grid grid-cols-[repeat(3,1fr)] gap-s3 border-t border-hair pt-s3 max-lg:grid-cols-[minmax(0,1fr)] max-lg:gap-s2 shorter:mt-s3"
        >
          <div
            v-for="(step, index) in STEPS"
            :key="step"
            class="grid grid-cols-[auto_1fr] gap-s2 text-[13.5px] leading-[1.45] text-fg-dim"
          >
            <b class="font-mono font-medium text-fg">{{ index + 1 }}</b
            ><span>{{ step }}</span>
          </div>
        </div>
      </div>

      <div>
        <DataFlowScheme :mode="mode" :active="isInView" />
      </div>
    </div>
  </ScreenSection>
</template>
