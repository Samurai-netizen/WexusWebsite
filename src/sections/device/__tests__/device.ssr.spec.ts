// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

import DeviceSection from '../DeviceSection.vue'

/* Страница пререндерится в Node (vite-ssg): там нет window и document.
   Этот тест ловит обращения к ним в setup раньше, чем сборка. */
describe('DeviceSection в пререндере', () => {
  it('рендерится без браузера, чертёж и таблица видны без JS', async () => {
    const html = await renderToString(createSSRApp(DeviceSection))
    expect(html).toContain('id="device"')
    expect(html).toContain('WX–1TB / rev 01')
    expect(html).toMatch(/aria-pressed="true"[^>]*>\s*1 TB/)
    // без JS чертёж виден целиком: классов сборки в разметке нет
    expect(html).not.toContain('is-pending')
    expect(html).not.toContain('is-in')
  })
})
