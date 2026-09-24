/**
 * Логика аккордеона вопросов (FaqAccordion.vue) — без Vue и DOM.
 * Раскрыт всегда один ответ или ни одного.
 */

/**
 * Какой ответ раскрыт после нажатия на вопрос clicked.
 * Нажатие на раскрытый вопрос сворачивает его, на другой — переключает
 * (предыдущий при этом сворачивается).
 */
export function nextOpenIndex(current: number | null, clicked: number): number | null {
  return current === clicked ? null : clicked
}

/**
 * id кнопки-вопроса и области ответа. Нумерация с 1, как в исходном
 * лендинге: faq-q1 / faq-a1 … — на них ссылаются aria-controls и aria-labelledby.
 */
export function faqQuestionId(index: number): string {
  return `faq-q${index + 1}`
}

export function faqAnswerId(index: number): string {
  return `faq-a${index + 1}`
}
