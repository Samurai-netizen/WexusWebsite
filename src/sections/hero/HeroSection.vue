<script setup lang="ts">
/**
 * Экран 1 — HERO.
 * Слева: знак, tagline как заголовок, USP одним предложением, одно действие.
 * Справа: устройство (HeroDevice — вид сверху из брендборда, те же координаты).
 *
 * Знак и подсказка «Дальше» стоят по кромкам экрана (абсолютные полосы сверху
 * и снизу), а основной блок остаётся отцентрованным по оставшейся высоте.
 *
 * lg:pt / lg:pb у экрана: на первом экране липкой шапки нет, но есть полосы со
 * знаком и подсказкой — резервируем ровно их высоту (знак 26px, подсказка 17px,
 * плюс зазор s3), чтобы длинный заголовок на них не наезжал. (Комментарий здесь,
 * а не в шаблоне: HTML-комментарий перед корнем делает компонент фрагментом.)
 */
import ScreenSection from '@/components/layout/ScreenSection.vue'
import BrandMark from '@/components/ui/BrandMark.vue'
import { useRequestModal } from '@/composables/useRequestModal'
import HeroDevice from './HeroDevice.vue'

const { openRequestModal } = useRequestModal()
</script>

<template>
  <ScreenSection
    id="hero"
    class="lg:pt-[calc(var(--padY)+26px+var(--spacing-s3))] lg:pb-[calc(var(--padY)+17px+var(--spacing-s3))]"
  >
    <!-- знак прижат к верхней кромке экрана: верхнего меню нет, и эта полоса
         иначе оставалась бы пустой. Справа (≥ 1181) — запас под рейку разделов.
         На узком экране знак возвращается в поток над заголовком. -->
    <div
      class="absolute inset-x-0 top-(--padY) z-2 px-(--padX) max-lg:static max-lg:mb-s4 max-lg:px-0 xl:pr-[calc(var(--padX)+46px)]"
    >
      <div class="wrap">
        <div class="flex items-center gap-s3">
          <BrandMark
            label="Знак WEXUS: узел с тремя подключёнными устройствами"
            class="h-[26px] w-[30px] shrink-0 text-quartz"
          />
          <span class="font-display text-[26px] leading-none font-semibold tracking-[-0.015em]"
            >wexus</span
          >
        </div>
      </div>
    </div>

    <div class="absolute inset-x-0 bottom-(--padY) z-2 px-(--padX) xl:pr-[calc(var(--padX)+46px)]">
      <div class="wrap">
        <!-- подсказка продолжения: экран не должен выглядеть законченной страницей.
             На узком экране не нужна — там обычная прокрутка. -->
        <div class="mt-s5 flex items-center gap-s2 text-[13px] text-fg-dim max-lg:hidden">
          <i class="block h-px w-[28px] bg-current opacity-50" />
          Дальше: как это работает — два режима
        </div>
      </div>
    </div>

    <div
      class="wrap grid grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)] items-center gap-s6 max-xl:gap-s5 max-lg:grid-cols-[minmax(0,1fr)]"
    >
      <div>
        <h1 class="title-display mb-s4">
          Удобство облачного сервиса.<br />Приватность физического хранилища.
        </h1>

        <p class="lede mb-s5 max-lg:mb-s4">
          Покупаешь один раз и получаешь собственное беспроводное хранилище с бесшовным доступом к
          данным в локальной сети <span class="whitespace-nowrap">Wi-Fi</span>.
        </p>

        <div class="flex flex-wrap items-center gap-s4 max-lg:mb-s4 max-sm:gap-s3">
          <button class="btn" type="button" @click="openRequestModal($event, 'hero')">
            Оставить заявку на прототип
          </button>
          <a class="link-quiet" href="#problem">Почему облако это не твоя собственность</a>
        </div>
        <p class="note mt-s3">Оставьте заявку на приобретение прототипа.</p>
      </div>

      <HeroDevice />
    </div>
  </ScreenSection>
</template>
