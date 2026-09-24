<script setup lang="ts">
/**
 * ЭКРАН 4 — УСТРОЙСТВО.
 * Чертёж с выносками взят из брендборда без изменений (DeviceBlueprint).
 * Характеристики — моноширинным: здесь это настоящие данные.
 * Выбор объёма меняет гравировку на чертеже и строку модели в таблице.
 */
import { computed, watch } from 'vue'
import ScreenSection from '@/components/layout/ScreenSection.vue'
import CapacityPicker from './CapacityPicker.vue'
import DeviceBlueprint from './DeviceBlueprint.vue'
import { LEGEND_ITEMS, SPEC_MODEL_LABEL, SPEC_ROWS, type SpecRow } from './device.data'
import { useCapacityChoice } from './useCapacityChoice'
import { trackAction } from '@/services/metrika'

const { selectedIndex, shown, isSwapping, select } = useCapacityChoice()
watch(selectedIndex, () => trackAction('capacity_select'))

/** Первая строка таблицы — модель: она зависит от выбранного объёма. */
const specRows = computed<SpecRow[]>(() => [
  { label: SPEC_MODEL_LABEL, value: shown.value.model },
  ...SPEC_ROWS,
])
</script>

<template>
  <ScreenSection id="device">
    <div class="wrap grid grid-cols-[minmax(0,1fr)] gap-y-s4 max-xl:gap-y-s3 short:gap-y-s3">
      <!-- шапка разворота: заголовок и пояснение разнесены по ширине.
           На низком окне зазоры ужимаются: трёхстрочный заголовок иначе
           делает разворот выше экрана -->
      <div
        class="grid grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-end gap-s6 max-xl:gap-s5 max-lg:grid-cols-[minmax(0,1fr)] max-lg:gap-y-s3 short:gap-s4"
      >
        <h2 class="title-screen mb-s3">Одно устройство: накопитель, батарея и точка доступа</h2>
        <p class="lede">
          Корпус размером с кардхолдер. Внутри хранилище данных, аккумулятор и несколько
          Wi-Fi-модулей, снаружи — индикатор соединения, шкала заряда и многофункциональный порт
          Type-C.
        </p>
      </div>

      <!-- Чертёж ограничен по высоте, а не по ширине: так он остаётся максимально крупным,
           а разворот всё равно помещается в экран. Ширина следует за пропорцией, поэтому
           легенда под чертежом получает ровно ту же ширину. На мобильном чертёж тянется
           по ширине — ограничение по высоте там не нужно. -->
      <div class="mx-auto w-fit max-w-full max-lg:w-full">
        <DeviceBlueprint
          :engrave="shown.engrave"
          :swapping="isSwapping"
          class="block h-[min(352px,32.5vh)] w-auto max-w-full max-lg:h-auto max-lg:w-full short:h-[29vh] shorter:h-[30vh]"
        />

        <!-- на узком экране подписи внутри чертежа не читаются: там их место занимает
             этот список. На десктопе подписи стоят у самих элементов, список скрыт -->
        <div
          class="mt-s3 hidden grid-cols-[repeat(2,1fr)] gap-x-s4 gap-y-s2 max-lg:grid max-sm:grid-cols-[minmax(0,1fr)]"
        >
          <div
            v-for="item in LEGEND_ITEMS"
            :key="item"
            class="grid grid-cols-[auto_1fr] items-start gap-s2 text-[13px] text-fg-dim"
          >
            <i class="mt-[6px] block size-[6px] rounded-full bg-accent"></i>{{ item }}
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-start gap-s6 max-xl:gap-s5 max-lg:grid-cols-[minmax(0,1fr)] max-lg:gap-y-s3 shorter:gap-s4"
      >
        <div>
          <CapacityPicker :selected-index="selectedIndex" @select="select" />
          <p class="note">
            Версия с 1ТБ памяти выйдет весной 2027, другие версии ожидаются к концу 2027.
          </p>
        </div>

        <table class="mt-s4 w-full border-collapse">
          <caption class="sr-only">
            Технические характеристики прототипа
          </caption>
          <tbody>
            <tr v-for="row in specRows" :key="row.label">
              <th
                scope="row"
                class="w-[52%] border-b border-hair py-[7px] text-left align-baseline text-[13.5px] font-normal text-fg-dim shorter:py-[5px]"
              >
                {{ row.label }}
              </th>
              <!-- значения, которые ещё уточняются, приглушены -->
              <td
                class="border-b border-hair py-[7px] text-left align-baseline font-mono text-[12.5px] font-normal shorter:py-[5px]"
                :class="row.tbd ? 'text-fg-dim' : 'text-fg'"
              >
                {{ row.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </ScreenSection>
</template>
