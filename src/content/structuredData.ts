/**
 * Структурированные данные schema.org (JSON-LD) для поисковиков.
 * Только то, что видно на странице, — без цен и обещаний.
 */
import { FAQ } from './faq'

export const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'WEXUS',
  description:
    'Портативное локальное хранилище данных: SSD, аккумулятор и Wi-Fi в одном корпусе. Разовая покупка без подписки, доступ с нескольких устройств по локальной сети или по собственной сети устройства без интернета.',
  category: 'Портативное сетевое хранилище данных',
  brand: { '@type': 'Brand', name: 'WEXUS' },
  model: 'WX-1TB rev 01',
}

/** FAQPage собирается из тех же вопросов, что показаны на странице. */
export const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer.join(' ') },
  })),
}
