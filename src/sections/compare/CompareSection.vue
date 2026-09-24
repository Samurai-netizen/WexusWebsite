<script setup lang="ts">
/**
 * Экран 5 — «Сравнение с альтернативами».
 * Отвечает на главный вопрос «зачем, если есть облако и есть SSD».
 * Экран статичный: таблица строится из compare.data.ts, скриптов и анимаций нет.
 */
import ScreenSection from '@/components/layout/ScreenSection.vue'
import {
  COMPARE_COLUMNS,
  COMPARE_ROWS,
  compareCellKind,
  type CompareCellKind,
} from './compare.data'

// Общее для всех ячеек: левого поля нет — колонки выравниваются по тексту,
// линия снизу. На узком экране (≤ 900) правое поле ужимается.
// Длинные слова переносятся по слогам: колонки узкие, особенно на мобильном.
const CELL =
  'border-b border-hair pr-s3 text-left align-top leading-[1.4] wrap-break-word hyphens-auto max-lg:pr-s2'

// Шапка: шрифт заголовков, 15px. На узком экране кегль шапки НЕ уменьшается —
// так в исходнике (правило для ≤ 900 px там слабее правила шапки).
const HEAD_CELL = `${CELL} pt-[10px] pb-s2 font-display text-[15px] font-semibold text-fg`

// Тело таблицы: мелкий кегль, на узком экране ещё мельче.
const BODY_CELL = `${CELL} py-[10px] text-[13.5px] font-normal max-lg:text-[12.5px]`

// Колонка продукта выделена подложкой, а не цветом текста.
// У ячеек нет левого поля, поэтому соседняя колонка вплотную упиралась бы в подложку — отступаем.
const KIND_CLASS: Record<CompareCellKind, string> = {
  own: 'bg-panel pl-s2',
  afterOwn: 'pl-s3 max-lg:pl-s2',
  plain: '',
}

const columns = COMPARE_COLUMNS.map((column, index) => ({
  ...column,
  kindClass: KIND_CLASS[compareCellKind(COMPARE_COLUMNS, index)],
}))
</script>

<template>
  <ScreenSection id="compare">
    <div class="wrap grid grid-cols-[minmax(0,1fr)] gap-y-s4 max-xl:gap-y-s3">
      <div
        class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-end gap-s6 max-xl:gap-s5 max-lg:grid-cols-[minmax(0,1fr)]"
      >
        <h2 class="title-screen mb-s3">Не облако и не флешка — принципиально новое устройство</h2>
        <p class="lede">
          Продукт занимает место между двумя привычными вариантами и берёт часть свойств у каждого.
          Сравнение по свойствам, а не по цифрам: цены и скорости зависят от конкретных моделей и
          тарифов.
        </p>
      </div>

      <table class="w-full table-fixed border-collapse">
        <caption class="sr-only">
          Сравнение WEXUS, облачного хранилища и традиционного внешнего SSD
        </caption>
        <thead>
          <tr>
            <th scope="col" :class="HEAD_CELL"><span class="sr-only">Свойство</span></th>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :data-own="column.own || undefined"
              :class="[HEAD_CELL, column.kindClass]"
            >
              <!-- узловой маркер продукта; вплотную к названию, без пробела -->
              <span
                v-if="column.own"
                class="mr-[7px] inline-block size-[7px] rounded-full bg-accent align-middle"
                aria-hidden="true"
              />{{ column.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in COMPARE_ROWS" :key="row.property">
            <th scope="row" :class="[BODY_CELL, 'w-1/4 text-fg-dim max-lg:w-[22%]']">
              {{ row.property }}
            </th>
            <td
              v-for="column in columns"
              :key="column.key"
              :data-own="column.own || undefined"
              :class="[
                BODY_CELL,
                column.kindClass,
                'w-1/4',
                column.own ? 'text-fg' : 'text-fg-dim',
              ]"
            >
              {{ row.values[column.key] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </ScreenSection>
</template>
