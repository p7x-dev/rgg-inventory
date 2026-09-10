import type {
	AppSettings,
	HotbarBlockId,
	SavedThemePreset,
	TimerCountdown,
	TimerMode,
} from '@core/models/settings.model';
import type { DesignLayout, ThemeTokens } from '@core/models/theme.model';
import { computed } from '@angular/core';
import {
	DEFAULT_COUNTDOWN,
	DEFAULT_HOTBAR_ORDER,
	DEFAULT_SETTINGS,
	DEFAULT_TIMER_DISPLAY,
	DEFAULT_TIMER_MODE,
} from '@core/models/settings.model';
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

/** Валидирующая загрузка настроек из localStorage: битые данные отбрасываются. */
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

function writeStorage(value: AppSettings): void {
	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
	} catch {
		// переполнение localStorage (большие dataURL дизайна) — настройки остаются в памяти
	}
}

/**
 * Настройки оверлея. Единый источник истины — параметр `settings`.
 * Производные стабильные срезы (activeSource, themePreset, customDesign, icons, overlay)
 * выбираются computed'ами, чтобы компоненты перерисовывались только при их изменении.
 * Персистенс в localStorage: чтение при init, запись при каждом изменении.
 */
export const SettingsStore = signalStore(
	{ providedIn: 'root' },
	withState<{ settings: AppSettings }>({ settings: parseSettings(readStorage()) }),
	withComputed((store) => ({
		activeSource: computed(() => store.settings().activeSource),
		themePreset: computed(() => store.settings().themePreset),
		customDesign: computed(() => store.settings().customDesign),
		themeTokens: computed(() => store.settings().themeTokens),
		savedPresets: computed(() => store.settings().savedPresets),
		activeSavedPresetId: computed(() => store.settings().activeSavedPresetId),
		icons: computed(() => store.settings().icons),
		overlay: computed(() => store.settings().overlay),
	})),
	withMethods((store) => ({
		update(partial: Partial<AppSettings>): void {
			const next = deepMerge(store.settings(), partial);
			patchState(store, { settings: next });
			writeStorage(next);
		},
		updateWith(fn: (current: AppSettings) => AppSettings): void {
			const next = fn(store.settings());
			patchState(store, { settings: next });
			writeStorage(next);
		},
		reset(): void {
			const defaults = structuredClone(DEFAULT_SETTINGS);
			patchState(store, { settings: defaults });
			writeStorage(defaults);
		},
	})),
	withHooks({
		onInit(store) {
			patchState(store, { settings: parseSettings(readStorage()) });
		},
	}),
);
