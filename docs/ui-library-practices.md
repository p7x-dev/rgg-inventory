# Taiga UI 5 + Angular 21: практики проекта

Проверено по документации taiga-ui.dev (v5.22.0) и по реальному использованию в соседних проектах (chat-app, streamer-mew-1, uii-app-new).

## Установка и подключение

- Пакеты: `@taiga-ui/core`, `@taiga-ui/kit`, `@taiga-ui/cdk`, `@taiga-ui/icons`, `@taiga-ui/styles`, `@taiga-ui/i18n`, `@taiga-ui/polymorpheus`.
- В `angular.json` глобальные стили:
  - `@taiga-ui/styles/taiga-ui-theme.less`
  - `@taiga-ui/styles/taiga-ui-fonts.less`
  - `src/styles.scss`
- Провайдер: `provideTaiga()` в `app.config.ts` (заменяет `TUI_ROOT_MODULES` v4).
- Корневой компонент оборачивает приложение в `<tui-root>`.

## Импорты компонентов (v5)

Все компоненты standalone — импортируются в `imports` компонента:

```ts
// core
TuiRoot, TuiButton, TuiIcon, TuiInput, TuiTextfield, TuiSlider, TuiHint,
TuiDataList, TuiDropdown, TuiDropdownOpen, TuiScrollbar
// kit
TuiSwitch, TuiInputNumber, TuiTextarea
```

## Паттерны разметки

### Текстовое поле

```html
<tui-textfield>
	<label>Подпись</label>
	<input tuiInput [value]="..." (input)="onInput($event)" />
</tui-textfield>
```

### Иконки — строковый синтаксис

```html
<tui-icon [icon]="'@tui.chevron-down'" />
<button tuiButton [iconStart]="'@tui.save'">Сохранить</button>
```

### Dropdown-селект без форм (клик → меню)

```html
<button tuiButton [tuiDropdown]="menu" [(tuiDropdownOpen)]="open">Выбрать…</button>
<ng-template #menu>
	<tui-data-list [size]="'m'">
		<button tuiOption type="button" (click)="pick(value)">Вариант</button>
	</tui-data-list>
</ng-template>
```

### Переключатель и слайдер (формы)

`TuiSwitch` и `TuiSlider` работают с `FormControl`/`formControlName`:

```html
<tui-switch [formControl]="control" />
<input tuiSlider type="range" [formControl]="control" [min]="0" [max]="100" [step]="1" />
```

В проекте сигналы ↔ формы синхронизируются так: `effect` пишет из сигнала в контрол
с `{ emitEvent: false }`, `valueChanges.pipe(takeUntilDestroyed())` пишет из контрола в сигнал.

## Кастомизация

- Тема управляется CSS-переменными `--tui-*`; для оверлея заведены собственные `--inv-*`,
  которые выставляет `ThemeHostDirective` через `Renderer2` на host-элементе.
- Переопределение поверх: `--tui-background-neutral-1` и т.п. используются прямо в scss секций.
- Все классы — kebab-case (stylelint запрещает BEM с `__`).

## Особенности

- `provideTaiga()` сам включает анимации и диалоги; отдельный `provideAnimations` не нужен.
- Формы: в шаблонах используются `ReactiveFormsModule`/`FormsModule` точечно, где нужно.
- Не подмешивать `@taiga-ui/legacy` — v4-совместимые компоненты не нужны.