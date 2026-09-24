import { ViteSSG } from 'vite-ssg/single-page'

// Шрифты лежат в проекте (без Google Fonts): быстрее и IP посетителей
// не уходит третьим лицам. Кириллица подключается автоматически.
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'

import './styles/main.css'
import App from './App.vue'
import { METRIKA_ID } from './config'
import { initMetrika } from './services/metrika'

// vite-ssg требует экспортировать createApp вместо createApp(App).mount('#app').
// Метрика — только в браузере и только в собранном сайте: на npm run dev
// визиты разработчиков не попадают в статистику.
export const createApp = ViteSSG(App, ({ isClient }) => {
  if (isClient && import.meta.env.PROD) initMetrika(METRIKA_ID)
})
