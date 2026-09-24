// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

import RequestModal from '../RequestModal.vue'

/* Страница пререндерится в Node (vite-ssg): там нет window и document.
   Окно заявки должно рендериться закрытым и без обращений к ним в setup. */
describe('RequestModal в пререндере', () => {
  it('рендерится закрытым, форма видна, итог спрятан', async () => {
    const html = await renderToString(createSSRApp(RequestModal))
    expect(html).toContain('id="requestModal"')
    expect(html).not.toMatch(/<dialog[^>]*\sopen/)
    expect(html).toMatch(/<form[^>]*id="requestForm"(?![^>]*hidden)/)
    expect(html).toMatch(/id="formDone"[^>]*hidden|hidden[^>]*id="formDone"/)
    expect(html).toContain('первую партию прототипов')
  })
})
