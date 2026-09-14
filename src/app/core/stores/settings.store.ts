import type { InventoryCategoryId } from '@core/models/inventory.model';
import type {
	AppMode,
	AppSettings,
	HotbarBlockId,
	HotbarSlot,
	OverlayWidgets,
	SavedThemePreset,
	SettingsEnvelope,
	TimerCountdown,
	TimerMode,
	WidgetId,
} from '@core/models/settings.model';
import type { DesignLayout, ThemeTokens } from '@core/models/theme.model';
import { computed } from '@angular/core';
import {
	APP_MODES,
	DEFAULT_APP_MODE,
	DEFAULT_COUNTDOWN,
	DEFAULT_HOTBAR_ORDER,
	DEFAULT_OVERLAY_WIDGETS,
	DEFAULT_SETTINGS,
	DEFAULT_TIMER_DISPLAY,
	DEFAULT_TIMER_MODE,
	defaultSettingsEnvelope,
	WIDGET_IDS,
} from '@core/models/settings.model';
import { SOLO_PLATFORMS } from '@core/models/solo.model';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

export const SETTINGS_STORAGE_KEY = 'rgg-inventory:settings';

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function readString(record: Record<string, unknown>, key: string, fallback: string): string {
	const value = record[key];
	return typeof value === 'string' ? value : fallback;
}

export function readBoolean(record: Record<string, unknown>, key: string, fallback: boolean): boolean {
	const value = record[key];
	return typeof value === 'boolean' ? value : fallback;
}

export function readNumber(
	record: Record<string, unknown>,
	key: string,
	fallback: number,
	min?: number,
	max?: number,
): number {
	const value = record[key];
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return fallback;
	}
	if (min !== undefined && value < min) {
		return fallback;
	}
	if (max !== undefined && value > max) {
		return fallback;
	}
	return value;
}

export function readStringRecord(record: Record<string, unknown>, key: string): Record<string, string> {
	const value = record[key];
	if (!isRecord(value)) {
		return {};
	}
	const result: Record<string, string> = {};
	for (const [name, icon] of Object.entries(value)) {
		if (typeof icon === 'string') {
			result[name] = icon;
		}
	}
	return result;
}

export function readCountdown(record: Record<string, unknown>, key: string, fallback: TimerCountdown): TimerCountdown {
	const value = record[key];
	if (!isRecord(value)) {
		return { ...fallback };
	}
	const hours = readNumber(value, 'hours', fallback.hours, 0, 999);
	const minutes = readNumber(value, 'minutes', fallback.minutes, 0, 59);
	const seconds = readNumber(value, 'seconds', fallback.seconds, 0, 59);
	return { hours, minutes, seconds };
}

export function readTimerMode(record: Record<string, unknown>, key: string): TimerMode {
	const value = record[key];
	return value === 'countdown' ? 'countdown' : DEFAULT_TIMER_MODE;
}

export function readHotbarOrder(record: Record<string, unknown>, key: string): HotbarBlockId[] {
	const value = record[key];
	if (!Array.isArray(value)) {
		return [...DEFAULT_HOTBAR_ORDER];
	}
	const valid: HotbarBlockId[] = ['profile', 'inventory', 'controls'];
	const list: HotbarBlockId[] = [];
	for (const item of value) {
		if (valid.includes(item as HotbarBlockId)) {
			list.push(item as HotbarBlockId);
		}
	}
	return list.length === valid.length ? list : [...DEFAULT_HOTBAR_ORDER];
}

/** Читает выбранные платформы соло-хотбара; незнакомые платформы отбрасываются. */
export function readSoloPlatforms(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	const known = new Set(SOLO_PLATFORMS);
	const list: string[] = [];
	for (const item of value) {
		if (typeof item === 'string' && known.has(item as (typeof SOLO_PLATFORMS)[number])) {
			list.push(item);
		}
	}
	return list;
}

/** Читает пользовательские (свои) платформы; непустые строки без дубликатов. */
export function readCustomPlatforms(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	const list: string[] = [];
	const seen = new Set<string>();
	for (const item of value) {
		if (typeof item !== 'string') {
			continue;
		}
		const name = item.trim();
		if (!name || seen.has(name)) {
			continue;
		}
		seen.add(name);
		list.push(name);
	}
	return list;
}

/** Читает видимость виджетов оверлея; неизвестные ключи — дефолт. */
export function readOverlayWidgets(value: unknown): OverlayWidgets {
	if (!isRecord(value)) {
		return { ...DEFAULT_OVERLAY_WIDGETS };
	}
	const result = { ...DEFAULT_OVERLAY_WIDGETS };
	for (const id of Object.keys(result) as WidgetId[]) {
		const raw = value[id];
		if (typeof raw === 'boolean') {
			result[id] = raw;
		}
	}
	return result;
}

/** Читает порядок виджетов; незнакомые id отбрасываются, недостающие дополняются. */
export function readWidgetOrder(value: unknown): WidgetId[] {
	if (!Array.isArray(value)) {
		return [...WIDGET_IDS];
	}
	const known = new Set<WidgetId>(WIDGET_IDS);
	const list: WidgetId[] = [];
	for (const item of value) {
		if (typeof item === 'string' && known.has(item as WidgetId)) {
			list.push(item as WidgetId);
		}
	}
	for (const id of WIDGET_IDS) {
		if (!list.includes(id)) {
			list.push(id);
		}
	}
	return list;
}

/** Читает пользовательские слоты хотбара; невалидные записи отбрасываются. */
export function readHotbarSlots(record: Record<string, unknown>, key: string): (HotbarSlot | null)[] {
	const value = record[key];
	if (!Array.isArray(value)) {
		return [];
	}
	const slots: (HotbarSlot | null)[] = [];
	for (const item of value) {
		if (item === null) {
			slots.push(null);
			continue;
		}
		if (!isRecord(item)) {
			continue;
		}
		const kind = item['kind'];
		if (kind === 'category') {
			const categoryId = item['categoryId'];
			if (categoryId === 'effects' || categoryId === 'items' || categoryId === 'specials') {
				slots.push({ kind: 'category', categoryId: categoryId as InventoryCategoryId });
			}
		} else if (kind === 'item') {
			const itemId = typeof item['itemId'] === 'string' ? item['itemId'] : '';
			const itemName = typeof item['itemName'] === 'string' ? item['itemName'] : '';
			if (itemId && itemName) {
				slots.push({ kind: 'item', itemId, itemName });
			}
		}
		if (slots.length >= 24) {
			break;
		}
	}
	return slots;
}

export function isThemeTokens(value: unknown): value is ThemeTokens {
	if (!isRecord(value)) {
		return false;
	}
	const str = (key: string): boolean => typeof value[key] === 'string';
	const num = (key: string): boolean => typeof value[key] === 'number' && Number.isFinite(value[key] as number);
	return (
		str('background') &&
		str('accent') &&
		str('text') &&
		str('textMuted') &&
		str('slotBg') &&
		str('slotBorderColor') &&
		str('slotHoverBg') &&
		str('timerFont') &&
		str('font') &&
		str('shadow') &&
		num('slotSize') &&
		num('slotGap') &&
		num('slotBorderWidth') &&
		num('backgroundOpacity') &&
		num('padding') &&
		num('borderRadius') &&
		(value['backgroundImage'] === null || str('backgroundImage')) &&
		(value['slotTexture'] === null || str('slotTexture'))
	);
}

export function readSavedPresets(value: unknown): SavedThemePreset[] {
	if (!Array.isArray(value)) {
		return [];
	}
	const list: SavedThemePreset[] = [];
	for (const item of value) {
		if (!isRecord(item)) {
			continue;
		}
		const id = typeof item['id'] === 'string' ? item['id'] : '';
		const name = typeof item['name'] === 'string' ? item['name'].trim() : '';
		if (!id || !name || !isThemeTokens(item['tokens'])) {
			continue;
		}
		list.push({ id, name, tokens: item['tokens'] });
		if (list.length >= 30) {
			break;
		}
	}
	return list;
}

/**
 * Парсит один набор настроек (профиль). Используется и для envelope-значений,
 * и для миграции старого плоского формата (когда не было профилей).
 */
export function parseSettings(raw: string | null): AppSettings {
	if (!raw) {
		return structuredClone(DEFAULT_SETTINGS);
	}
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!isRecord(parsed)) {
			return structuredClone(DEFAULT_SETTINGS);
		}

		const sourcesRaw = isRecord(parsed['sources']) ? parsed['sources'] : {};
		const rgglandRaw = isRecord(sourcesRaw['rggland']) ? sourcesRaw['rggland'] : {};
		const sheetsRaw = isRecord(sourcesRaw['sheets']) ? sourcesRaw['sheets'] : {};
		const columnsRaw = isRecord(sheetsRaw['columns']) ? sheetsRaw['columns'] : {};
		const localRaw = isRecord(sourcesRaw['local']) ? sourcesRaw['local'] : {};
		const soloRaw = isRecord(sourcesRaw['solo']) ? sourcesRaw['solo'] : {};
		const timerRaw = isRecord(parsed['timer']) ? parsed['timer'] : {};
		const botRaw = isRecord(timerRaw['bot']) ? timerRaw['bot'] : {};
		const displayRaw = isRecord(timerRaw['display']) ? timerRaw['display'] : {};
		const overlayRaw = isRecord(parsed['overlay']) ? parsed['overlay'] : {};
		const designRaw = parsed['customDesign'];
		const savedPresets = readSavedPresets(parsed['savedPresets']);
		const sourceIdValue = parsed['activeSavedPresetId'];
		const activeSavedPresetId = typeof sourceIdValue === 'string' ? sourceIdValue : '';

		const sourceIds: readonly string[] = ['rggland', 'sheets', 'local'];
		const presets: readonly string[] = ['rgg-retro', 'minecraft', 'glass', 'custom'];
		const activeSource = typeof parsed['activeSource'] === 'string' ? parsed['activeSource'] : '';
		const themePreset = typeof parsed['themePreset'] === 'string' ? parsed['themePreset'] : '';

		return {
			activeSource: sourceIds.includes(activeSource)
				? (activeSource as AppSettings['activeSource'])
				: DEFAULT_SETTINGS.activeSource,
			sources: {
				rggland: {
					nick: readString(rgglandRaw, 'nick', DEFAULT_SETTINGS.sources.rggland.nick),
					showItemTypes: readBoolean(
						rgglandRaw,
						'showItemTypes',
						DEFAULT_SETTINGS.sources.rggland.showItemTypes,
					),
					showNotes: readBoolean(rgglandRaw, 'showNotes', DEFAULT_SETTINGS.sources.rggland.showNotes),
				},
				sheets: {
					spreadsheetId: readString(
						sheetsRaw,
						'spreadsheetId',
						DEFAULT_SETTINGS.sources.sheets.spreadsheetId,
					),
					gid: readString(sheetsRaw, 'gid', DEFAULT_SETTINGS.sources.sheets.gid),
					columns: {
						name: readString(columnsRaw, 'name', DEFAULT_SETTINGS.sources.sheets.columns.name),
						category: readString(columnsRaw, 'category', DEFAULT_SETTINGS.sources.sheets.columns.category),
						note: readString(columnsRaw, 'note', DEFAULT_SETTINGS.sources.sheets.columns.note),
						description: readString(
							columnsRaw,
							'description',
							DEFAULT_SETTINGS.sources.sheets.columns.description,
						),
					},
				},
				local: {
					json: readString(localRaw, 'json', DEFAULT_SETTINGS.sources.local.json),
				},
				solo: {
					spreadsheetId: readString(soloRaw, 'spreadsheetId', DEFAULT_SETTINGS.sources.solo.spreadsheetId),
					gid: readString(soloRaw, 'gid', DEFAULT_SETTINGS.sources.solo.gid),
					platforms: readSoloPlatforms(soloRaw['platforms']),
					customPlatforms: readCustomPlatforms(soloRaw['customPlatforms']),
				},
			},
			timer: {
				localName: readString(timerRaw, 'localName', DEFAULT_SETTINGS.timer.localName),
				bot: {
					enabled: readBoolean(botRaw, 'enabled', DEFAULT_SETTINGS.timer.bot.enabled),
					nick: readString(botRaw, 'nick', DEFAULT_SETTINGS.timer.bot.nick),
					timerName: readString(botRaw, 'timerName', DEFAULT_SETTINGS.timer.bot.timerName),
				},
				display: {
					hours: readBoolean(displayRaw, 'hours', DEFAULT_TIMER_DISPLAY.hours),
					minutes: readBoolean(displayRaw, 'minutes', DEFAULT_TIMER_DISPLAY.minutes),
					seconds: readBoolean(displayRaw, 'seconds', DEFAULT_TIMER_DISPLAY.seconds),
					mills: readBoolean(displayRaw, 'mills', DEFAULT_TIMER_DISPLAY.mills),
				},
				mode: readTimerMode(timerRaw, 'mode'),
				countdown: readCountdown(timerRaw, 'countdown', DEFAULT_COUNTDOWN),
			},
			overlay: {
				cols: readNumber(overlayRaw, 'cols', DEFAULT_SETTINGS.overlay.cols, 1, 18),
				rows: readNumber(overlayRaw, 'rows', DEFAULT_SETTINGS.overlay.rows, 1, 6),
				slotSize: readNumber(overlayRaw, 'slotSize', DEFAULT_SETTINGS.overlay.slotSize, 32, 96),
				transparentBg: readBoolean(overlayRaw, 'transparentBg', DEFAULT_SETTINGS.overlay.transparentBg),
				overlayColor: readString(overlayRaw, 'overlayColor', DEFAULT_SETTINGS.overlay.overlayColor),
				alwaysOnTop: readBoolean(overlayRaw, 'alwaysOnTop', DEFAULT_SETTINGS.overlay.alwaysOnTop),
				showTimer: readBoolean(overlayRaw, 'showTimer', DEFAULT_SETTINGS.overlay.showTimer),
				showCurrencies: readBoolean(
					overlayRaw,
					'showCurrencies',
					DEFAULT_SETTINGS.overlay.showCurrencies,
				),
				refreshIntervalSec: readNumber(
					overlayRaw,
					'refreshIntervalSec',
					DEFAULT_SETTINGS.overlay.refreshIntervalSec,
					15,
					3600,
				),
				designEditorEnabled: readBoolean(
					overlayRaw,
					'designEditorEnabled',
					DEFAULT_SETTINGS.overlay.designEditorEnabled,
				),
				expandEnabled: readBoolean(overlayRaw, 'expandEnabled', DEFAULT_SETTINGS.overlay.expandEnabled),
				tutorialEnabled: readBoolean(
					overlayRaw,
					'tutorialEnabled',
					DEFAULT_SETTINGS.overlay.tutorialEnabled,
				),
				pipEnabled: readBoolean(overlayRaw, 'pipEnabled', DEFAULT_SETTINGS.overlay.pipEnabled),
				hotbarOrder: readHotbarOrder(overlayRaw, 'hotbarOrder'),
				hotbarSlots: readHotbarSlots(overlayRaw, 'hotbarSlots'),
				widgets: readOverlayWidgets(overlayRaw['widgets']),
				widgetOrder: readWidgetOrder(overlayRaw['widgetOrder']),
			},
			themePreset: presets.includes(themePreset)
				? (themePreset as AppSettings['themePreset'])
				: DEFAULT_SETTINGS.themePreset,
			customDesign: isDesignLayout(designRaw) ? designRaw : null,
			themeTokens: isThemeTokens(parsed['themeTokens']) ? parsed['themeTokens'] : null,
			savedPresets,
			activeSavedPresetId: savedPresets.some((preset) => preset.id === activeSavedPresetId)
				? activeSavedPresetId
				: null,
			icons: readStringRecord(parsed, 'icons'),
		};
	} catch {
		return structuredClone(DEFAULT_SETTINGS);
	}
}

/** Парсит JSON значения одного профиля (объект AppSettings, не строка JSON). */
function parseProfileValue(value: unknown): AppSettings {
	if (!isRecord(value)) {
		return structuredClone(DEFAULT_SETTINGS);
	}

	const sourcesRaw = isRecord(value['sources']) ? value['sources'] : {};
	const rgglandRaw = isRecord(sourcesRaw['rggland']) ? sourcesRaw['rggland'] : {};
	const sheetsRaw = isRecord(sourcesRaw['sheets']) ? sourcesRaw['sheets'] : {};
	const columnsRaw = isRecord(sheetsRaw['columns']) ? sheetsRaw['columns'] : {};
	const localRaw = isRecord(sourcesRaw['local']) ? sourcesRaw['local'] : {};
	const soloRaw = isRecord(sourcesRaw['solo']) ? sourcesRaw['solo'] : {};
	const timerRaw = isRecord(value['timer']) ? value['timer'] : {};
	const botRaw = isRecord(timerRaw['bot']) ? timerRaw['bot'] : {};
	const displayRaw = isRecord(timerRaw['display']) ? timerRaw['display'] : {};
	const overlayRaw = isRecord(value['overlay']) ? value['overlay'] : {};
	const designRaw = value['customDesign'];
	const savedPresets = readSavedPresets(value['savedPresets']);
	const sourceIdValue = value['activeSavedPresetId'];
	const activeSavedPresetId = typeof sourceIdValue === 'string' ? sourceIdValue : '';

	const sourceIds: readonly string[] = ['rggland', 'sheets', 'local'];
	const presets: readonly string[] = ['rgg-retro', 'minecraft', 'glass', 'custom'];
	const activeSource = typeof value['activeSource'] === 'string' ? value['activeSource'] : '';
	const themePreset = typeof value['themePreset'] === 'string' ? value['themePreset'] : '';

	return {
		activeSource: sourceIds.includes(activeSource)
			? (activeSource as AppSettings['activeSource'])
			: DEFAULT_SETTINGS.activeSource,
		sources: {
			rggland: {
				nick: readString(rgglandRaw, 'nick', DEFAULT_SETTINGS.sources.rggland.nick),
				showItemTypes: readBoolean(rgglandRaw, 'showItemTypes', DEFAULT_SETTINGS.sources.rggland.showItemTypes),
				showNotes: readBoolean(rgglandRaw, 'showNotes', DEFAULT_SETTINGS.sources.rggland.showNotes),
			},
			sheets: {
				spreadsheetId: readString(
					sheetsRaw,
					'spreadsheetId',
					DEFAULT_SETTINGS.sources.sheets.spreadsheetId,
				),
				gid: readString(sheetsRaw, 'gid', DEFAULT_SETTINGS.sources.sheets.gid),
				columns: {
					name: readString(columnsRaw, 'name', DEFAULT_SETTINGS.sources.sheets.columns.name),
					category: readString(columnsRaw, 'category', DEFAULT_SETTINGS.sources.sheets.columns.category),
					note: readString(columnsRaw, 'note', DEFAULT_SETTINGS.sources.sheets.columns.note),
					description: readString(
						columnsRaw,
						'description',
						DEFAULT_SETTINGS.sources.sheets.columns.description,
					),
				},
			},
			local: {
				json: readString(localRaw, 'json', DEFAULT_SETTINGS.sources.local.json),
			},
			solo: {
				spreadsheetId: readString(soloRaw, 'spreadsheetId', DEFAULT_SETTINGS.sources.solo.spreadsheetId),
				gid: readString(soloRaw, 'gid', DEFAULT_SETTINGS.sources.solo.gid),
				platforms: readSoloPlatforms(soloRaw['platforms']),
				customPlatforms: readCustomPlatforms(soloRaw['customPlatforms']),
			},
		},
		timer: {
			localName: readString(timerRaw, 'localName', DEFAULT_SETTINGS.timer.localName),
			bot: {
				enabled: readBoolean(botRaw, 'enabled', DEFAULT_SETTINGS.timer.bot.enabled),
				nick: readString(botRaw, 'nick', DEFAULT_SETTINGS.timer.bot.nick),
				timerName: readString(botRaw, 'timerName', DEFAULT_SETTINGS.timer.bot.timerName),
			},
			display: {
				hours: readBoolean(displayRaw, 'hours', DEFAULT_TIMER_DISPLAY.hours),
				minutes: readBoolean(displayRaw, 'minutes', DEFAULT_TIMER_DISPLAY.minutes),
				seconds: readBoolean(displayRaw, 'seconds', DEFAULT_TIMER_DISPLAY.seconds),
				mills: readBoolean(displayRaw, 'mills', DEFAULT_TIMER_DISPLAY.mills),
			},
			mode: readTimerMode(timerRaw, 'mode'),
			countdown: readCountdown(timerRaw, 'countdown', DEFAULT_COUNTDOWN),
		},
		overlay: {
			cols: readNumber(overlayRaw, 'cols', DEFAULT_SETTINGS.overlay.cols, 1, 18),
			rows: readNumber(overlayRaw, 'rows', DEFAULT_SETTINGS.overlay.rows, 1, 6),
			slotSize: readNumber(overlayRaw, 'slotSize', DEFAULT_SETTINGS.overlay.slotSize, 32, 96),
			transparentBg: readBoolean(overlayRaw, 'transparentBg', DEFAULT_SETTINGS.overlay.transparentBg),
			overlayColor: readString(overlayRaw, 'overlayColor', DEFAULT_SETTINGS.overlay.overlayColor),
			alwaysOnTop: readBoolean(overlayRaw, 'alwaysOnTop', DEFAULT_SETTINGS.overlay.alwaysOnTop),
			showTimer: readBoolean(overlayRaw, 'showTimer', DEFAULT_SETTINGS.overlay.showTimer),
			showCurrencies: readBoolean(
				overlayRaw,
				'showCurrencies',
				DEFAULT_SETTINGS.overlay.showCurrencies,
			),
			refreshIntervalSec: readNumber(
				overlayRaw,
				'refreshIntervalSec',
				DEFAULT_SETTINGS.overlay.refreshIntervalSec,
				15,
				3600,
			),
			designEditorEnabled: readBoolean(
				overlayRaw,
				'designEditorEnabled',
				DEFAULT_SETTINGS.overlay.designEditorEnabled,
			),
			expandEnabled: readBoolean(overlayRaw, 'expandEnabled', DEFAULT_SETTINGS.overlay.expandEnabled),
			tutorialEnabled: readBoolean(
				overlayRaw,
				'tutorialEnabled',
				DEFAULT_SETTINGS.overlay.tutorialEnabled,
			),
			pipEnabled: readBoolean(overlayRaw, 'pipEnabled', DEFAULT_SETTINGS.overlay.pipEnabled),
			hotbarOrder: readHotbarOrder(overlayRaw, 'hotbarOrder'),
			hotbarSlots: readHotbarSlots(overlayRaw, 'hotbarSlots'),
			widgets: readOverlayWidgets(overlayRaw['widgets']),
			widgetOrder: readWidgetOrder(overlayRaw['widgetOrder']),
		},
		themePreset: presets.includes(themePreset)
			? (themePreset as AppSettings['themePreset'])
			: DEFAULT_SETTINGS.themePreset,
		customDesign: isDesignLayout(designRaw) ? designRaw : null,
		themeTokens: isThemeTokens(value['themeTokens']) ? value['themeTokens'] : null,
		savedPresets,
		activeSavedPresetId: savedPresets.some((preset) => preset.id === activeSavedPresetId)
			? activeSavedPresetId
			: null,
		icons: readStringRecord(value, 'icons'),
	};
}

/**
 * Валидирующая загрузка профилей настроек из localStorage.
 * Новый формат: { mode, profiles: { rggland, solo } }.
 * Старый плоский формат мигрируется в rggland-профиль.
 */
export function parseEnvelope(raw: string | null): SettingsEnvelope {
	const fallback = defaultSettingsEnvelope();
	if (!raw) {
		return fallback;
	}
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!isRecord(parsed)) {
			return fallback;
		}
		// Новый формат: профили по режимам.
		if (isRecord(parsed['profiles'])) {
			const profilesValue = parsed['profiles'];
			const rawMode = parsed['mode'];
			const mode = APP_MODES.includes(rawMode as AppMode)
				? (rawMode as AppMode)
				: DEFAULT_APP_MODE;
			return {
				mode,
				profiles: {
					rggland: parseProfileValue(profilesValue['rggland']),
					solo: parseProfileValue(profilesValue['solo']),
				},
			};
		}
		// Старый плоский формат: всё в rggland-профиль, solo — дефолты.
		return {
			mode: DEFAULT_APP_MODE,
			profiles: {
				rggland: parseProfileValue(parsed),
				solo: structuredClone(DEFAULT_SETTINGS),
			},
		};
	} catch {
		return fallback;
	}
}

export function isDesignLayout(value: unknown): value is DesignLayout {
	if (!isRecord(value)) {
		return false;
	}
	if (typeof value['imageWidth'] !== 'number' || typeof value['imageHeight'] !== 'number') {
		return false;
	}
	if (!Array.isArray(value['slots'])) {
		return false;
	}
	return value['slots'].every((slot) => {
		if (!isRecord(slot)) {
			return false;
		}
		return (
			typeof slot['x'] === 'number' &&
			typeof slot['y'] === 'number' &&
			typeof slot['width'] === 'number' &&
			typeof slot['height'] === 'number' &&
			typeof slot['texture'] === 'string'
		);
	});
}

function deepMerge(base: AppSettings, patch: Partial<AppSettings>): AppSettings {
	const next = { ...base, ...patch };
	if (patch.sources) {
		next.sources = {
			...base.sources,
			...patch.sources,
			rggland: { ...base.sources.rggland, ...patch.sources.rggland },
			sheets: {
				...base.sources.sheets,
				...patch.sources.sheets,
				columns: { ...base.sources.sheets.columns, ...patch.sources.sheets.columns },
			},
			local: { ...base.sources.local, ...patch.sources.local },
			solo: { ...base.sources.solo, ...patch.sources.solo },
		};
	}
	if (patch.timer) {
		next.timer = {
			...base.timer,
			...patch.timer,
			bot: { ...base.timer.bot, ...patch.timer.bot },
			display: { ...base.timer.display, ...patch.timer.display },
		};
	}
	if (patch.overlay) {
		next.overlay = { ...base.overlay, ...patch.overlay };
	}
	return next;
}

function readStorage(): string | null {
	try {
		return localStorage.getItem(SETTINGS_STORAGE_KEY);
	} catch {
		return null;
	}
}

function writeStorage(value: SettingsEnvelope): void {
	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
	} catch {
		// переполнение localStorage (большие dataURL дизайна) — настройки остаются в памяти
	}
}

/**
 * Настройки оверлея. Состояние — envelope { mode, profiles }: у каждого режима
 * (RGG Land / Solo RGG) свой полный набор настроек. `settings` — вычисляемый
 * активный профиль (профиль текущего режима), поэтому существующие sчиты
 * остаются без изменений.
 * Персистенс в localStorage: чтение при init, запись при каждом изменении.
 */
export const SettingsStore = signalStore(
	{ providedIn: 'root' },
	withState<{ envelope: SettingsEnvelope }>({ envelope: parseEnvelope(readStorage()) }),
	withComputed((store) => ({
		mode: computed(() => store.envelope().mode),
		settings: computed(() => store.envelope().profiles[store.envelope().mode]),
		activeSource: computed(() => store.envelope().profiles[store.envelope().mode].activeSource),
		themePreset: computed(() => store.envelope().profiles[store.envelope().mode].themePreset),
		customDesign: computed(() => store.envelope().profiles[store.envelope().mode].customDesign),
		themeTokens: computed(() => store.envelope().profiles[store.envelope().mode].themeTokens),
		savedPresets: computed(() => store.envelope().profiles[store.envelope().mode].savedPresets),
		activeSavedPresetId: computed(() =>
			store.envelope().profiles[store.envelope().mode].activeSavedPresetId,
		),
		icons: computed(() => store.envelope().profiles[store.envelope().mode].icons),
		overlay: computed(() => store.envelope().profiles[store.envelope().mode].overlay),
	})),
	withMethods((store) => ({
		/** Переключает активный режим; каждый режим несёт свой полный профиль настроек. */
		setMode(mode: AppMode): void {
			const next: SettingsEnvelope = { ...store.envelope(), mode };
			patchState(store, { envelope: next });
			writeStorage(next);
		},
		update(partial: Partial<AppSettings>): void {
			const mode = store.envelope().mode;
			const active = store.envelope().profiles[mode];
			const nextActive = deepMerge(active, partial);
			const next: SettingsEnvelope = {
				...store.envelope(),
				profiles: { ...store.envelope().profiles, [mode]: nextActive },
			};
			patchState(store, { envelope: next });
			writeStorage(next);
		},
		updateWith(fn: (current: AppSettings) => AppSettings): void {
			const mode = store.envelope().mode;
			const active = store.envelope().profiles[mode];
			const nextActive = fn(active);
			const next: SettingsEnvelope = {
				...store.envelope(),
				profiles: { ...store.envelope().profiles, [mode]: nextActive },
			};
			patchState(store, { envelope: next });
			writeStorage(next);
		},
		reset(): void {
			const defaults = defaultSettingsEnvelope();
			patchState(store, { envelope: defaults });
			writeStorage(defaults);
		},
	})),
	withHooks({
		onInit(store) {
			patchState(store, { envelope: parseEnvelope(readStorage()) });
		},
	}),
);
