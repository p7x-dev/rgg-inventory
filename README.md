# RGG Inventory

Оверлей-инвентарь для RGG-стримеров: инвентарь на 2 полосы с разворачиванием (как в Minecraft),
таймер, гибкие темы и **авто-разметка дизайна по картинке**.

Angular 21 + Taiga UI 5 + Tauri 2 (Windows / Linux). RxJS + Signals везде, где это уместно.

## Возможности

- **Инвентарь**: полосы-слоты, сворачивание/разворачивание, количество, заметки, тултипы.
- **Источники данных** (переключаются в настройках):
  - **RGG Land** — страница `rgg.land/inventories/{ник}` (монетки/слёзы из обзора инвентарей);
  - **Google Sheets** — публичный CSV-экспорт таблицы рггленда стримера (`spreadsheetId` + `gid` + маппинг колонок);
  - **Локальный JSON** — вставка `InventoryData` или плоского списка записей.
- **Таймер**: локальный + синхронизация с таймерами бота RGG (`bot.rgg.land/{ник}/timers/{имя}`
  + live по WebSocket `wss://bot.rgg.land/ws`).
- **Темы**: пресеты «RGG Retro», «Minecraft», «Glass», прозрачный фон для OBS.
- **Дизайн из картинки**: загружаете картинку с готовым дизайном — приложение само находит
  сетку слотов (детекция линий по градиентам), разрезает слоты на текстуры, подбирает цвета
  фона/рамки/текста и перестраивает оверлей под картинку.
- **Иконки**: из каталога RGG (токен стримера + эмодзи с rgg.land), zip-паком (сопоставление
  по имени файла и предмета) или по одной вручную.
- **Tauri-оболочка**: прозрачное окно без рамки, поверх всех окон, обход CORS через
  `@tauri-apps/plugin-http` (глобальный `fetch` подменяется только внутри Tauri).

## Быстрый старт

```bash
pnpm install

# разработка (браузер)
pnpm start                 # http://localhost:4200/settings

# тесты, линт
pnpm test                  # vitest через @angular/build:unit-test
pnpm lint && pnpm lint:css && pnpm typecheck

# сборка Tauri (Windows/Linux)
pnpm tauri dev             # dev-режим в окне
pnpm tauri build           # релизные пакеты в src-tauri/target/release/bundle
```

Требования: Node 20+, pnpm, Rust (для Tauri), на Linux — WebKitGTK и системные пакеты из
документации Tauri.

## Структура

```
src/app/
  core/            # модели, сервисы (RxJS + signals), коннекторы, движок дизайна, таймеры
  features/
    overlay/       # оверлей: страница → board → slot/timer/header
    settings/      # страница настроек: источник, оверлей, дизайн, иконки, таймер
  shared/ui/       # атомы: theme-host, settings-switch, settings-slider
src-tauri/         # Tauri 2: прозрачное окно, plugin-http
docs/              # практики Taiga UI
```

## OBS

В OBS добавьте «Окно захвата» (Tauri-окно с прозрачным фоном) либо запустите
`pnpm start` и добавьте Browser Source `http://localhost:4200/overlay`.