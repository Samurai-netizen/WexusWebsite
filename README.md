# WEXUS — лендинг

Лендинг портативного хранилища WEXUS на Vue 3, TypeScript и Tailwind CSS.

## Запуск

Нужен Node.js 24 (установлен в `~/.local/node`, путь прописан в `~/.zshrc`).

```bash
npm install      # один раз, после скачивания проекта
npm run dev      # сайт на http://localhost:5173 с автообновлением
npm run build    # готовый сайт в папке dist/ — её содержимое выкладывается на хостинг
npm run check    # полная проверка: формат, линтер, типы, тесты, сборка
```

## Где что менять

- Тексты секций — `src/sections/<экран>/`
- Вопросы и ответы — `src/content/faq.ts`
- Почта для заявок и номер счётчика Метрики — `src/config.ts`
- Цвета, отступы, шрифты — `src/styles/main.css`


## Яндекс Метрика

<img width="1408" height="880" alt="image" src="https://github.com/user-attachments/assets/1aaf6d21-5193-44cc-bf5b-1fd734158d9a" />
