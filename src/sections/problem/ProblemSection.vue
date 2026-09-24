<script setup lang="ts">
/**
 * Экран 2 — «Проблема».
 * Одна мысль: облако не принадлежит тебе. Схема вместо описания,
 * внизу — чья это проблема на практике. Экран статичный: без скриптов и анимаций.
 */
import ScreenSection from '@/components/layout/ScreenSection.vue'
import ProblemScheme from './ProblemScheme.vue'
import { FACTS, SEGMENTS } from './problem.data'
</script>

<template>
  <ScreenSection id="problem">
    <div class="wrap">
      <div
        class="grid grid-cols-[minmax(0,0.88fr)_minmax(0,1.05fr)] items-center gap-s6 max-xl:gap-s5 max-lg:grid-cols-[minmax(0,1fr)]"
      >
        <div>
          <h2 class="title-screen mb-s3">Облако не продаётся. Оно сдаётся в аренду.</h2>
          <p class="lede">
            Пока платишь — доступ есть. Перестал платить или пропал интернет — доступа нет. Ты не
            владеешь своими файлами.
          </p>

          <!-- max-w в ch считается от кегля списка (16px), а не пунктов — как в исходнике -->
          <ul class="mt-s5 grid max-w-[52ch] gap-s3 shorter:mt-s4 shorter:gap-s2">
            <li
              v-for="fact in FACTS"
              :key="fact.title"
              class="grid grid-cols-[auto_1fr] items-start gap-s3 text-[15.5px] leading-[1.5] text-fg-dim"
            >
              <!-- узловой маркер вместо буллета; mt выравнивает его по первой строке -->
              <i
                class="mt-[7px] block size-[7px] rounded-full bg-fg opacity-45"
                aria-hidden="true"
              />
              <!-- перенос строки после </b> превращается в пробел между жирным началом
                   и продолжением — не склеивать их в одну строку без пробела -->
              <span>
                <b class="font-medium text-fg">{{ fact.title }}</b>
                {{ fact.text }}
              </span>
            </li>
          </ul>
        </div>

        <!-- Схема слева (-order-1): соседние экраны не должны строиться одинаково.
             На мобильном порядок остаётся смысловым: сначала текст. -->
        <div class="-order-1 max-lg:order-0">
          <ProblemScheme />
        </div>
      </div>

      <!-- Чья это проблема: сегменты строками, как в брендборде.
           Не карточки — строки с узловыми маркерами. -->
      <div
        class="mt-s5 grid grid-cols-[repeat(4,1fr)] gap-s4 border-t border-hair pt-s4 max-lg:grid-cols-[repeat(2,1fr)] max-lg:gap-y-s3 max-sm:grid-cols-[minmax(0,1fr)] shorter:mt-s4 shorter:pt-s3"
      >
        <div
          v-for="segment in SEGMENTS"
          :key="segment.title"
          class="text-[14px] leading-[1.45] text-fg-dim"
        >
          <b class="mb-[6px] block font-display text-[15px] font-medium text-fg">
            {{ segment.title }}
          </b>
          {{ segment.text }}
        </div>
      </div>
    </div>
  </ScreenSection>
</template>
