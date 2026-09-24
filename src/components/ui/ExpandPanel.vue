<script setup lang="ts">
/**
 * Раскрывающаяся панель: высота плавно растёт от нуля до высоты содержимого.
 * Одна на весь сайт — ответы FAQ, условия согласия в форме заявки.
 *
 *   <button :aria-expanded="isOpen" aria-controls="details" @click="isOpen = !isOpen">…</button>
 *   <ExpandPanel id="details" :open="isOpen">…текст…</ExpandPanel>
 *
 * id, role, aria-labelledby и классы, переданные панели, ставятся на её корень.
 */
defineProps<{
  /** панель раскрыта */
  open: boolean
}>()
</script>

<template>
  <div class="expand" :class="{ 'is-open': open }">
    <!-- overflow-hidden обязателен: без него строка 0fr не сожмётся меньше текста -->
    <div class="overflow-hidden">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Раскрытие через grid-template-rows 0fr → 1fr: высота текста заранее не известна,
   а max-height с запасом дал бы рваную анимацию. visibility выключается с задержкой,
   равной времени сворачивания: текст успевает уехать, а потом скрывается
   и от клавиатуры, и от скринридера.
   При prefers-reduced-motion переходы гасит глобальное правило в main.css. */
.expand {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  visibility: hidden;
  transition:
    grid-template-rows 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.26s ease,
    visibility 0s linear 0.38s;
}
.expand.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
  visibility: visible;
  transition:
    grid-template-rows 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s ease 0.06s,
    visibility 0s;
}
</style>
