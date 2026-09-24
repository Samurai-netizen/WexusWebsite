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

// vite-ssg требует экспортировать createApp вместо createApp(App).mount('#app')
export const createApp = ViteSSG(App)
