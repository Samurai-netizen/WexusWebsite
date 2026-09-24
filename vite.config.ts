import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
// подключает типы поля ssgOptions
import type {} from 'vite-ssg/node'

// https://vite.dev/config/
export default defineConfig({
  // На GitHub Pages сайт публикуется по пути /<repo>/, а не в корне домена
  base: process.env.GITHUB_PAGES ? '/WexusWebsite/' : '/',
  plugins: [vue(), tailwindcss(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Сборка через `vite-ssg build`: страница пререндерится в готовый HTML,
  // поэтому контент виден поисковикам и без JavaScript.
  ssgOptions: {
    formatting: 'none',
  },
})
