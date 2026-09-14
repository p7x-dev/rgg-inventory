import type { IconMap, InventoryCategoryId, InventorySourceId } from './inventory.model';
import type { DesignLayout, ThemePresetId, ThemeTokens } from './theme.model';

/** Колонки таблицы Google Sheets. */
export interface SheetColumns {
	name: string;
	category: string;
	note: string;
	description: string;
}

/** Настройки источников данных инвентаря. */
export interface RgglandSourceConfig {
	nick: string;
	/** Показывать типы предметов (Предмет/Оружие/Зелье/...) в списке. */
	showItemTypes: boolean;
	/** Показывать вторичный текст предмета (например «Выкопано в садике»). */
	showNotes: boolean;
}

export interface SheetsSourceConfig {
	spreadsheetId: string;
	gid: string;
	columns: SheetColumns;
}

export interface LocalSourceConfig {
	/** Сырой JSON в формате InventoryData или плоского списка записей. */
	json: string;
}

/** Solo RGG: Google-таблица стримера (платформы с играми). */
export interface SoloSourceConfig {
	spreadsheetId: string;
	gid: string;
	/** Платформы, показываемые в соло-хотбаре (порядок = порядок слотов). */
	platforms: string[];
	/** Дополнительные (свои) платформы стримера. */
	customPlatforms: string[];
}

export interface SourceConfigs {
	rggland: RgglandSourceConfig;
	sheets: SheetsSourceConfig;
	local: LocalSourceConfig;
	solo: SoloSourceConfig;
}

/** Таймер: локальный + опционально привязка к боту RGG. */
export interface BotTimerConfig {
	enabled: boolean;
	nick: string;
	timerName: string;
}

/** Части времени, показываемые на дисплее таймера (часы/минуты/секунды/миллисекунды). */
export interface TimerDisplayParts {
	hours: boolean;
	minutes: boolean;
	seconds: boolean;
	mills: boolean;
}

/** Базовый формат: ЧЧ:ММ:СС без миллисекунд. */
export const DEFAULT_TIMER_DISPLAY: TimerDisplayParts = {
	hours: true,
	minutes: true,
	seconds: true,
	mills: false,
};

/** Как отсчитывает таймер: обычный отсчёт времени или обратный (countdown). */
export type TimerMode = 'elapsed' | 'countdown';

export const DEFAULT_TIMER_MODE: TimerMode = 'elapsed';

/** Стартовая длительность обратного отсчёта (ч:м:с). */
export const DEFAULT_COUNTDOWN: TimerCountdown = { hours: 0, minutes: 5, seconds: 0 };

export interface TimerCountdown {
	hours: number;
	minutes: number;
	seconds: number;
}

export interface TimerSettings {
	localName: string;
	bot: BotTimerConfig;
	display: TimerDisplayParts;
	mode: TimerMode;
	countdown: TimerCountdown;
}

/** Пользовательский пресет темы с именем, сохранённый в браузере. */
export interface SavedThemePreset {
	id: string;
	name: string;
	tokens: ThemeTokens;
}

/** Блоки хотбара, которые стример может переставлять drag&drop. */
export type HotbarBlockId = 'profile' | 'inventory' | 'controls';

/** Стандартный порядок блоков хотбара. */
export const DEFAULT_HOTBAR_ORDER: HotbarBlockId[] = ['profile', 'inventory', 'controls'];

/**
 * Слот хотбара (ячейка в ряду оверлея).
 * По умолчанию слоты = категории инвентаря в порядке их следования у стримера:
 * показываем иконку категории и количество предметов. Если стример перетащит
 * в слот конкретный предмет (drag&drop из попапа) — слот «закрепляется» за ним.
 */
export type HotbarSlot =
	| {
		kind: 'category';
		categoryId: InventoryCategoryId;
	}
	| {
		kind: 'item';
		/** Стабильный id записи (slug имени). */
		itemId: string;
		/** Имя для восстановления иконки/названия без перезагрузки источника. */
		itemName: string;
	};

/** Идентификаторы самостоятельных виджетов оверлея (для OBS и настройки видимости). */
export type WidgetId = 'inventory' | 'gameInfo' | 'gameTitle' | 'stats' | 'timer' | 'profile';

export const WIDGET_IDS: readonly WidgetId[] = [
	'inventory',
	'gameInfo',
	'gameTitle',
	'stats',
	'timer',
	'profile',
];

const WIDGET_ID_SET: ReadonlySet<string> = new Set<string>(WIDGET_IDS);

/** Проверяет строку на известный id виджета (для URL `#/widget/<id>`). */
export function isWidgetId(value: string): value is WidgetId {
	return WIDGET_ID_SET.has(value);
}

/** Видимость виджетов оверлея. */
export interface OverlayWidgets {
	/** Инвентарь/хотбар (и соло-хотбар). */
	inventory: boolean;
	/** Информация об игре (обложка, описание). */
	gameInfo: boolean;
	/** Название текущей игры (бегущая строка при длинном названии). */
	gameTitle: boolean;
	/** Статистика по играм (пройдено/рероллы/пропуски). */
	stats: boolean;
	/** Таймер. */
	timer: boolean;
	/** Профиль (ник + валюты). */
	profile: boolean;
}

export const DEFAULT_OVERLAY_WIDGETS: OverlayWidgets = {
	inventory: true,
	gameInfo: true,
	gameTitle: true,
	stats: true,
	timer: true,
	profile: true,
};

/** Настройки оверлея инвентаря. */
export interface OverlaySettings {
	/** Слотов в одной полосе. */
	cols: number;
	/** Сколько полос показывать в хотбаре. */
	rows: number;
	/** Размер слота в px (для пресетных тем). */
	slotSize: number;
	/** Прозрачный фон окна. */
	transparentBg: boolean;
	/** Фон оверлея, когда прозрачность выключена (OBS-виджет и обычное окно). */
	overlayColor: string;
	/** Поверх всех окон. */
	alwaysOnTop: boolean;
	/** Показывать таймер. */
	showTimer: boolean;
	/** Показывать монетки/слёзы. */
	showCurrencies: boolean;
	/** Обновление данных, сек. */
	refreshIntervalSec: number;
	/** Первичное знакомство: обучающие подсказки по интерфейсу (что/где). */
	tutorialEnabled: boolean;
	/** Бета: drag&drop редактирование дизайна (включается вручную). */
	designEditorEnabled: boolean;
	/** PiP: поверх всех окон + кнопка OBS показываются только при включённом режиме. */
	pipEnabled: boolean;
	/** Бета: сворачивание/разворачивание хотбара (по дефолту выключено). */
	expandEnabled: boolean;
	/** Пользовательский порядок блоков хотбара. */
	hotbarOrder: HotbarBlockId[];
	/**
	 * Слоты хотбара (cols × rows ячеек). null — пустая ячейка.
	 * Пустой массив = по умолчанию: категории инвентаря в порядке их следования,
	 * с иконкой и количеством; остальные ячейки сетки остаются пустыми.
	 */
	hotbarSlots: (HotbarSlot | null)[];
	/** Видимость самостоятельных виджетов оверлея. */
	widgets: OverlayWidgets;
	/** Порядок виджетов на баре (drag&drop); дефолт — WIDGET_IDS. */
	widgetOrder: WidgetId[];
}

export interface AppSettings {
	activeSource: InventorySourceId;
	sources: SourceConfigs;
	timer: TimerSettings;
	overlay: OverlaySettings;
	themePreset: ThemePresetId;
	/** Кастомный дизайн из картинки (null — не задан). */
	customDesign: DesignLayout | null;
	/** Сохранённые в браузере кастомные токены (цвета/шрифты ручной настройки). */
	themeTokens: ThemeTokens | null;
	/** Пользовательские пресеты тем (имя + токены), сохранённые в браузере. */
	savedPresets: SavedThemePreset[];
	/** id активного пользовательского пресета из savedPresets (для подсветки выбора). */
	activeSavedPresetId: string | null;
	/** Иконки предметов: имя → картинка. */
	icons: IconMap;
}

/** Режим оверлея: RGG Land (инвентарь с монетками/слёзами) или Solo RGG (платформы с играми). */
export type AppMode = 'rggland' | 'solo';

export const APP_MODES: readonly AppMode[] = ['rggland', 'solo'];

export const DEFAULT_APP_MODE: AppMode = 'rggland';

/**
 * Полный набор настроек оверлея. У каждого режима свой профиль (источник, оверлей,
 * тема, таймер); переключение режима подменяет активный профиль целиком.
 */
export interface SettingsEnvelope {
	mode: AppMode;
	profiles: Record<AppMode, AppSettings>;
}

export const DEFAULT_SETTINGS: AppSettings = {
	activeSource: 'local',
	sources: {
		rggland: {
			nick: '',
			showItemTypes: true,
			showNotes: true,
		},
		sheets: {
			spreadsheetId: '',
			gid: '',
			columns: {
				name: 'Предмет',
				category: 'Категория',
				note: 'Заметка',
				description: 'Описание',
			},
		},
		local: {
			json: '',
		},
		solo: {
			spreadsheetId: '',
			gid: '',
			platforms: [],
			customPlatforms: [],
		},
	},
	timer: {
		localName: 'main',
		bot: {
			enabled: false,
			nick: '',
			timerName: 'main',
		},
		display: { ...DEFAULT_TIMER_DISPLAY },
		mode: DEFAULT_TIMER_MODE,
		countdown: { ...DEFAULT_COUNTDOWN },
	},
	overlay: {
		cols: 9,
		rows: 2,
		slotSize: 56,
		transparentBg: true,
		overlayColor: '#120d1c',
		alwaysOnTop: true,
		showTimer: true,
		showCurrencies: true,
		refreshIntervalSec: 120,
		tutorialEnabled: true,
		designEditorEnabled: false,
		expandEnabled: false,
		pipEnabled: true,
		hotbarOrder: DEFAULT_HOTBAR_ORDER,
		hotbarSlots: [],
		widgets: { ...DEFAULT_OVERLAY_WIDGETS },
		widgetOrder: [...WIDGET_IDS],
	},
	themePreset: 'rgg-retro',
	customDesign: null,
	themeTokens: null,
	savedPresets: [],
	activeSavedPresetId: null,
	icons: {},
};

/** Дефолтный envelope: режим RGG Land с двумя одинаковыми заготовками профилей. */
export function defaultSettingsEnvelope(): SettingsEnvelope {
	return {
		mode: DEFAULT_APP_MODE,
		profiles: {
			rggland: structuredClone(DEFAULT_SETTINGS),
			solo: structuredClone(DEFAULT_SETTINGS),
		},
	};
}
