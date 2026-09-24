// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createHead } from '@unhead/vue/server'

import App from '../App.vue'
import { SECTIONS } from '@/content/sections'

/* Вся страница в пререндере (vite-ssg): экраны должны выйти в HTML в том же
   порядке, что и SECTIONS, — рейка, подвал и прогресс берут порядок оттуда же. */
describe('App в пререндере', () => {
  it('рендерит экраны в порядке SECTIONS', async () => {
    const app = createSSRApp(App)
    app.use(createHead())
    const html = await renderToString(app)
    const ids = [...html.matchAll(/<section[^>]*\sid="([^"]+)"/g)].map((m) => m[1])
    expect(ids).toEqual(SECTIONS.map((s) => s.id))
  })
})
