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

## Релизы (GitHub Actions)

Автосборка нативных приложений и публикация релизов — в `.github/workflows/release.yml`.

### Запуск

- **По тегу:** `git tag v0.2.0 && git push origin v0.2.0` — соберётся и выложится релиз `v0.2.0`.
- **Вручную:** вкладка **Actions → Build & Release → Run workflow**, можно указать версию и черновик.

Workflow собирает нативных клиентов на раннерах GitHub по целевой ОС:

| ОС           | Раннер            | Артефакты                     |
| ------------ | ----------------- | ----------------------------- |
| Windows      | `windows-latest`  | `-setup.exe` (NSIS)           |
| macOS        | `macos-latest`    | `.dmg`                        |
| Linux        | `ubuntu-latest`   | `.AppImage`, `.deb`, `.rpm`   |

Собранные пакеты попадают в **GitHub Release** и (если настроен `DEPLOY_SSH_KEY`)
загружаются на сервер в `/var/www/rgg-inv-downloads/`, после чего перегенерируется
`latest.json` — манифест, из которого веб-приложение узнаёт про последнюю версию
и показывает кнопку «Скачать» под операционную систему пользователя.

### Секреты репозитория (Settings → Secrets and variables → Actions)

| Secret          | Назначение                                                                      |
| --------------- | ------------------------------------------------------------------------------- |
| `DEPLOY_SSH_KEY`| Приватный ключ `~/.ssh/p7x-deploy` (deploy key) — нужен для заливки на сервер.  |
| `DEPLOY_HOST`   | (необязательно, по умолчанию `62.113.114.50`)                                   |
| `DEPLOY_USER`   | (необязательно, по умолчанию `root`)                                            |
| `GITHUB_TOKEN`  | создаётся автоматически — для публикации Release (раздел `permissions`).        |

Если `DEPLOY_SSH_KEY` не задан, сборка и релиз на GitHub работают, но файлы на
прод-сервер не заливаются (кнопка «Скачать» покажет «сборки нет»).

### Что делает скрипт make-manifest.mjs

`node scripts/make-manifest.mjs <папка> <версия>` берёт из папки сборки по одному
предпочтительному артефакту на ОС (exe / dmg / AppImage, fallback deb/rpm) и пишет
`latest.json` в нужном формате `{ version, files: {windows, macos, linux}, updatedAt }`,
который ожидает фронтенд.

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