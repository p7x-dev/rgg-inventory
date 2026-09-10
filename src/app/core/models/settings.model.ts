import type { IconMap, InventorySourceId } from './inventory.model';
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

export interface SourceConfigs {
	rggland: RgglandSourceConfig;
	sheets: SheetsSourceConfig;
	local: LocalSourceConfig;
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

/** Настройки оверлея инвентаря. */
export interface OverlaySettings {
	/** Слотов в одной полосе. */
	cols: number;
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

export const DEFAULT_SETTINGS: AppSettings = {
	activeSource: 'local',
	sources: {
		rggland: {
			nick: '',
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
	},
	themePreset: 'rgg-retro',
	customDesign: null,
	themeTokens: null,
	savedPresets: [],
	activeSavedPresetId: null,
	icons: {},
};
