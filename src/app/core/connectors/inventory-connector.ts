import type {
	InventoryCategory,
	InventoryData,
	InventoryEntry,
	InventoryLoadResult,
	InventorySourceId,
} from '@core/models/inventory.model';
import type { RgglandSourceConfig, SheetsSourceConfig } from '@core/models/settings.model';
import { Injectable } from '@angular/core';
import { httpGetText, rggLandOrigin } from '@core/connectors/http.util';
import { parseInventoryHtml, parseOverviewCurrencies } from '@core/connectors/rggland.parser';
import { parseSheetCsv } from '@core/connectors/sheets.parser';
import { INVENTORY_CATEGORY, parseCategoryId, slugify } from '@core/models/inventory.model';

/** Общий интерфейс коннекторов источников данных. */
export interface InventoryConnector {
	readonly id: InventorySourceId;
	load: () => Promise<InventoryData>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isInventoryData(value: unknown): value is InventoryData {
	if (!isRecord(value)) {
		return false;
	}
	if (typeof value['player'] !== 'string' || !Array.isArray(value['categories'])) {
		return false;
	}
	return value['categories'].every((category) => {
		if (!isRecord(category)) {
			return false;
		}
		return (
			typeof category['id'] === 'string' &&
			typeof category['title'] === 'string' &&
			Array.isArray(category['entries']) &&
			category['entries'].every((entry) => isRecord(entry) && typeof entry['name'] === 'string')
		);
	});
}

function isCategoryId(value: unknown): value is InventoryCategory['id'] {
	return typeof value === 'string' && parseCategoryId(value) !== null;
}

/** Нормализует произвольный JSON в InventoryData (поддержка плоского списка записей). */
export function normalizeInventoryJson(raw: unknown, player = 'стример'): InventoryData {
	if (isInventoryData(raw)) {
		const selectedSlot = typeof raw.selectedSlot === 'number' ? raw.selectedSlot : null;
		const data: InventoryData = {
			...raw,
			categories: raw.categories.map((category) => ({
				...category,
				id: isCategoryId(category.id) ? category.id : INVENTORY_CATEGORY.Items,
			})),
		};
		if (selectedSlot !== null) {
			data.selectedSlot = selectedSlot;
		}
		return data;
	}
	if (Array.isArray(raw)) {
		const grouped = new Map<InventoryCategory['id'], InventoryEntry[]>();
		for (const id of Object.values(INVENTORY_CATEGORY)) {
			grouped.set(id, []);
		}
		for (const item of raw) {
			if (!isRecord(item) || typeof item['name'] !== 'string' || item['name'].trim() === '') {
				continue;
			}
			const entry: InventoryEntry = { id: slugify(item['name']), name: item['name'] };
			if (typeof item['note'] === 'string') {
				entry.note = item['note'];
			}
			if (typeof item['description'] === 'string') {
				entry.description = item['description'];
			}
			if (typeof item['icon'] === 'string') {
				entry.icon = item['icon'];
			}
			const rawCategory = typeof item['category'] === 'string' ? item['category'] : '';
			const categoryId = parseCategoryId(rawCategory);
			const id = categoryId ?? INVENTORY_CATEGORY.Items;
			grouped.get(id)?.push(entry);
		}
		return {
			player,
			coins: 0,
			tears: 0,
			categories: [...grouped.entries()]
				.filter(([, list]) => list.length > 0)
				.map(([id, list]) => ({
					id,
					title:
						id === INVENTORY_CATEGORY.Effects
							? 'Эффекты'
							: id === INVENTORY_CATEGORY.Specials
								? 'Спецроллы'
								: 'Обычные предметы',
					entries: list,
				})),
			fetchedAt: new Date().toISOString(),
		};
	}
	throw new Error('JSON не похож на инвентарь: нужен объект InventoryData или массив записей');
}

/** Загрузчик данных с rgg.land: страница инвентаря + обзор для монеток/слёз. */
export class RgglandConnector implements InventoryConnector {
	readonly id = 'rggland' as const;

	constructor(private readonly config: RgglandSourceConfig) {}

	async load(): Promise<InventoryData> {
		const nick = this.config.nick.trim().toLowerCase();
		if (!nick) {
			throw new Error('Укажите ник стримера на rgg.land');
		}
		const inventoryHtml = await httpGetText(`${rggLandOrigin()}/inventories/${encodeURIComponent(nick)}`);
		const data = parseInventoryHtml(inventoryHtml, nick);

		try {
			const overviewHtml = await httpGetText(`${rggLandOrigin()}/inventories`);
			const currencies = parseOverviewCurrencies(overviewHtml, nick);
			data.coins = currencies.coins;
			data.tears = currencies.tears;
		} catch {
			// обзор недоступен — монетки/слёзы остаются нулевыми
		}
		return data;
	}
}

/** Загрузчик данных из Google Sheets (публичный CSV-экспорт). */
export class SheetsConnector implements InventoryConnector {
	readonly id = 'sheets' as const;

	constructor(private readonly config: SheetsSourceConfig) {}

	async load(): Promise<InventoryData> {
		const spreadsheetId = this.config.spreadsheetId.trim();
		if (!spreadsheetId) {
			throw new Error('Укажите ID Google-таблицы');
		}
		let url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/export?format=csv`;
		if (this.config.gid.trim()) {
			url += `&gid=${encodeURIComponent(this.config.gid.trim())}`;
		}
		const csv = await httpGetText(url);
		return parseSheetCsv(csv, this.config.columns, 'таблица');
	}
}

/** Загрузчик данных из локального JSON (вставленного в настройках). */
export class LocalConnector implements InventoryConnector {
	readonly id = 'local' as const;

	constructor(private readonly config: { json: string }) {}

	async load(): Promise<InventoryData> {
		const source = this.config.json.trim();
		if (!source) {
			throw new Error('Пустой JSON: вставьте инвентарь или загрузите файл');
		}
		let raw: unknown;
		try {
			raw = JSON.parse(source);
		} catch (error) {
			throw new Error(`Невалидный JSON: ${error instanceof Error ? error.message : 'ошибка парсинга'}`);
		}
		return normalizeInventoryJson(raw);
	}
}

/** Реестр коннекторов по выбранному источнику. */
@Injectable({ providedIn: 'root' })
export class ConnectorRegistry {
	create(
		source: InventorySourceId,
		configs: {
			rggland: RgglandSourceConfig;
			sheets: SheetsSourceConfig;
			local: { json: string };
		},
	): InventoryConnector {
		switch (source) {
			case 'rggland':
				return new RgglandConnector(configs.rggland);
			case 'sheets':
				return new SheetsConnector(configs.sheets);
			case 'local':
				return new LocalConnector(configs.local);
		}
	}
}

export type { InventoryLoadResult };
