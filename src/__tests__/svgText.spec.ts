import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createHead } from '@unhead/vue/server'

import App from '@/App.vue'

/* Подписи SVG пишутся одной строкой <text …>текст</text>. Если текст окажется
   на отдельной строке (правка руками или Prettier), Vue оставит пробелы по краям,
   и подпись с text-anchor="end"/"middle" съедет. Проверяем всю страницу разом:
   так новая схема на любом экране попадает под проверку автоматически. */
describe('подписи SVG на странице', () => {
  it('ни в одном <text> нет пробелов по краям', async () => {
    const app = createSSRApp(App)
    app.use(createHead())
    const html = await renderToString(app)
    const doc = new DOMParser().parseFromString(html, 'text/html')

    const texts = [...doc.querySelectorAll('svg text')]
    expect(texts.length).toBeGreaterThan(0)
    for (const text of texts) {
      const content = text.textContent ?? ''
      expect(content, `подпись «${content}»`).toBe(content.trim())
    }
  })
})
