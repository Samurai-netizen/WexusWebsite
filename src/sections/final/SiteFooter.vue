<script setup lang="ts">
/**
 * Подвал — стоит внутри последнего экрана, под вопросами.
 * Четыре колонки: бренд, навигация, проект, правовая часть.
 * Ниже — строка дисклеймеров и узловой знак.
 */
import BrandMark from '@/components/ui/BrandMark.vue'
import { useRequestModal } from '@/composables/useRequestModal'
import { TEAM_MEMBERS } from '@/config'
import { FOOTER_NAV } from './final.data'

const { openRequestModal } = useRequestModal()
</script>

<template>
  <footer class="wrap border-t border-hair pt-s3 shorter:pt-s2">
    <!-- short/shorter: на низком окне подвал ужимается — на резервных шрифтах
         он выше и выносил экран за окно -->
    <div
      class="grid grid-cols-[minmax(0,1.25fr)_repeat(3,minmax(0,1fr))] gap-x-s5 gap-y-s4 max-lg:grid-cols-2 max-lg:gap-x-s4 short:gap-x-s4 short:gap-y-s3"
    >
      <!-- колонка бренда: знак, клейм и модель прототипа -->
      <div>
        <div class="flex items-center gap-s2 text-fg">
          <BrandMark class="h-[19px] w-[22px]" />
          <span class="font-display text-[19px] font-semibold tracking-[-0.015em]">wexus</span>
        </div>
        <p class="mt-s2 mb-[6px] text-[13.5px] text-fg">Твой узел. Твои данные.</p>
        <p class="mono text-[11.5px]">WX–1TB prototype / rev 01</p>
      </div>

      <!-- у колонки ссылок нет зазора между строками: зону нажатия
           (минимум 24px по WCAG 2.2) даёт высота самих ссылок -->
      <nav class="grid content-start" aria-label="Разделы страницы">
        <p class="mb-[4px] text-[13px] text-fg">Разделы</p>
        <a
          v-for="section in FOOTER_NAV"
          :key="section.id"
          :href="`#${section.id}`"
          class="foot-link flex min-h-[24px] w-fit items-center py-[4px] text-[13px] text-fg-dim no-underline"
          >{{ section.label }}</a
        >
      </nav>

      <div class="grid content-start gap-[7px]">
        <p class="mb-[4px] text-[13px] text-fg">Проект</p>
        <p class="note text-[12.5px]">Стартап как диплом. Команда 4.<br />{{ TEAM_MEMBERS }}</p>
        <p class="note text-[12.5px]">Соцсети проекта — [уточнить]</p>
      </div>

      <div class="grid content-start gap-[7px]">
        <p class="mb-[4px] text-[13px] text-fg">Данные и заявки</p>
        <p class="note text-[12.5px]">Политика обработки персональных данных — [уточнить]</p>
        <p class="note text-[12.5px]">
          Заявка из формы уходит письмом на почту команды через сервис отправки форм FormSubmit
          (formsubmit.co).
        </p>
        <button
          class="link-quiet mt-[4px] text-[13px]"
          type="button"
          @click="openRequestModal($event)"
        >
          Оставить заявку
        </button>
      </div>
    </div>

    <div
      class="mt-s4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] items-center gap-s4 border-t border-hair pt-s3 max-lg:grid-cols-[minmax(0,1fr)] max-lg:gap-s2 short:mt-s3 short:pt-s2"
    >
      <p class="note text-[12px]">
        Учебный проект, 2026. Страница не является офертой: продажи не начаты, цена не определена,
        названные сроки — планы команды, а не обязательство.
      </p>
      <p class="note text-[12px]">
        Изображения устройства — абстрактные эскизы, а не фотографии серийного изделия. Некоторые
        значения будут уточняться по мере дополнительных испытаний.
      </p>
      <!-- узловой знак: два cyan-узла среди приглушённых, как на схемах выше -->
      <svg
        class="h-[26px] w-[88px] text-fg opacity-50 max-lg:justify-self-start"
        viewBox="0 0 200 60"
        aria-hidden="true"
      >
        <g stroke="currentColor" stroke-width="1" opacity="0.4" fill="none">
          <line x1="10" y1="30" x2="50" y2="15" />
          <line x1="50" y1="15" x2="90" y2="35" />
          <line x1="90" y1="35" x2="130" y2="20" />
          <line x1="130" y1="20" x2="170" y2="40" />
        </g>
        <g fill="#00C2B8">
          <circle cx="50" cy="15" r="3" />
          <circle cx="130" cy="20" r="3" />
        </g>
        <g fill="currentColor" opacity="0.5">
          <circle cx="10" cy="30" r="2.4" />
          <circle cx="90" cy="35" r="2.4" />
          <circle cx="170" cy="40" r="2.4" />
        </g>
      </svg>
    </div>
  </footer>
</template>

<style scoped>
/* Ссылка разделов при наведении «подключается»: светлеет и сдвигается на 4px.
   Цвет и сдвиг идут с разной длительностью и кривой, поэтому переход — здесь,
   а не Tailwind-классами. */
.foot-link {
  transition:
    color 0.2s ease,
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.foot-link:hover {
  color: var(--fg);
  transform: translateX(4px);
}
</style>
