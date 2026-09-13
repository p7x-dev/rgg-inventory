import { DEFAULT_APP_MODE, DEFAULT_SETTINGS } from '@core/models/settings.model';
import { parseEnvelope, parseSettings } from '@core/stores/settings.store';
import { describe, expect, it } from 'vitest';

describe('parseSettings', () => {
	it('возвращает дефолты для пустого и битого хранилища', () => {
		expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
		expect(parseSettings('')).toEqual(DEFAULT_SETTINGS);
		expect(parseSettings('{not json')).toEqual(DEFAULT_SETTINGS);
		expect(parseSettings('"строка"')).toEqual(DEFAULT_SETTINGS);
	});

	it('восстанавливает корректные значения', () => {
		const settings = parseSettings(
			JSON.stringify({
				activeSource: 'sheets',
				sources: {
					rggland: { nick: 'bradhi' },
					sheets: {
						spreadsheetId: 'abc123',
						gid: '0',
						columns: { name: 'Предмет', category: 'Категория', note: 'Заметка', description: 'Описание' },
					},
					local: { json: '[]' },
				},
				timer: { localName: 'main', bot: { enabled: true, nick: 'bradhi', timerName: 'main' } },
				overlay: {
					collapsedRows: 2,
					expandedRows: 6,
					cols: 9,
					slotSize: 56,
					transparentBg: true,
					overlayColor: '#123456',
					alwaysOnTop: true,
					showTimer: true,
					showCurrencies: true,
					refreshIntervalSec: 60,
				},
				themePreset: 'minecraft',
				customDesign: null,
				icons: { Паук: 'data:image/png;base64,xxx' },
			}),
		);

		expect(settings.activeSource).toBe('sheets');
		expect(settings.sources.sheets.spreadsheetId).toBe('abc123');
		expect(settings.themePreset).toBe('minecraft');
		expect(settings.timer.bot.enabled).toBe(true);
		expect(settings.icons['Паук']).toBe('data:image/png;base64,xxx');
		expect(settings.overlay.overlayColor).toBe('#123456');
	});

	it('отбрасывает невалидные значения в пользу дефолтов', () => {
		const settings = parseSettings(
			JSON.stringify({
				activeSource: 'unknown-source',
				themePreset: 'neon',
				overlay: { cols: -5, slotSize: 'big' },
				customDesign: { imageWidth: 100 },
				icons: { ok: 42 },
			}),
		);

		expect(settings.activeSource).toBe(DEFAULT_SETTINGS.activeSource);
		expect(settings.themePreset).toBe(DEFAULT_SETTINGS.themePreset);
		expect(settings.overlay.cols).toBe(DEFAULT_SETTINGS.overlay.cols);
		expect(settings.overlay.slotSize).toBe(DEFAULT_SETTINGS.overlay.slotSize);
		expect(settings.customDesign).toBeNull();
		expect(settings.icons).toEqual({});
	});
});

describe('parseEnvelope', () => {
	it('падает на дефолты при пустом хранилище', () => {
		const envelope = parseEnvelope(null);
		expect(envelope.mode).toBe(DEFAULT_APP_MODE);
		expect(envelope.profiles.rggland).toEqual(DEFAULT_SETTINGS);
		expect(envelope.profiles.solo).toEqual(DEFAULT_SETTINGS);
	});

	it('мигрирует старый плоский формат в rggland-профиль', () => {
		const envelope = parseEnvelope(
			JSON.stringify({
				activeSource: 'rggland',
				sources: { rggland: { nick: 'bradhi' } },
			}),
		);
		expect(envelope.mode).toBe('rggland');
		expect(envelope.profiles.rggland.activeSource).toBe('rggland');
		expect(envelope.profiles.rggland.sources.rggland.nick).toBe('bradhi');
		expect(envelope.profiles.solo.activeSource).toBe(DEFAULT_SETTINGS.activeSource);
	});

	it('читает профили по режимам', () => {
		const envelope = parseEnvelope(
			JSON.stringify({
				mode: 'solo',
				profiles: {
					rggland: { activeSource: 'rggland', sources: { rggland: { nick: 'a' } } },
					solo: { activeSource: 'sheets', sources: { sheets: { spreadsheetId: 'zzz' } } },
				},
			}),
		);
		expect(envelope.mode).toBe('solo');
		expect(envelope.profiles.solo.activeSource).toBe('sheets');
		expect(envelope.profiles.solo.sources.sheets.spreadsheetId).toBe('zzz');
	});
});