import type { InventoryCategoryId, InventoryData, InventoryEntry } from '@core/models/inventory.model';
import { INVENTORY_CATEGORY, slugify } from '@core/models/inventory.model';

/**
 * Минимальный CSV-парсер (RFC 4180): поддерживает кавычки, экранирование
 * и переводы строк внутри поля.
 */
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const next = text[i + 1];

		if (inQuotes) {
			if (char === '"') {
				if (next === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += char;
			}
			continue;
		}

		if (char === '"' && field === '') {
			inQuotes = true;
		} else if (char === ',') {
			row.push(field);
			field = '';
		} else if (char === '\n' || char === '\r') {
			if (char === '\r' && next === '\n') {
				i++;
			}
			row.push(field);
			field = '';
			rows.push(row);
			row = [];
		} else {
			field += char;
		}
	}
	row.push(field);
	rows.push(row);

	return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/** Определение категории по тексту ячейки таблицы. */
export function categoryFromText(value: string): InventoryCategoryId {
	const normalized = value.trim().toLowerCase();
	if (normalized.includes('эффект') || normalized.includes('effect')) {
		return INVENTORY_CATEGORY.Effects;
	}
	if (normalized.includes('спецролл') || normalized.includes('спец') || normalized.includes('special')) {
		return INVENTORY_CATEGORY.Specials;
	}
	return INVENTORY_CATEGORY.Items;
}

export interface SheetMapping {
	name: string;
	category: string;
	note: string;
	description: string;
}

function indexOfHeader(headers: string[], wanted: string): number {
	const wantedLower = wanted.trim().toLowerCase();
	if (!wantedLower) {
		return -1;
	}
	return headers.findIndex((header) => header.trim().toLowerCase() === wantedLower);
}

function text(value: string | undefined): string | undefined {
	const trimmed = (value ?? '').trim();
	return trimmed || undefined;
}

/** Разбирает CSV-экспорт Google Sheets в InventoryData. */
export function parseSheetCsv(csv: string, mapping: SheetMapping, player: string): InventoryData {
	const rows = parseCsv(csv);
	if (rows.length < 2) {
		throw new Error('Таблица пустая: нужна строка заголовков и хотя бы одна запись');
	}
	const headers = rows[0];
	const nameIdx = indexOfHeader(headers, mapping.name);
	if (nameIdx < 0) {
		throw new Error(`Не найдена колонка «${mapping.name}» в заголовках таблицы`);
	}
	const categoryIdx = indexOfHeader(headers, mapping.category);
	const noteIdx = indexOfHeader(headers, mapping.note);
	const descriptionIdx = indexOfHeader(headers, mapping.description);

	const entriesByCategory = new Map<InventoryCategoryId, InventoryEntry[]>();
	for (const id of Object.values(INVENTORY_CATEGORY)) {
		entriesByCategory.set(id, []);
	}

	for (const row of rows.slice(1)) {
		const name = text(row[nameIdx]);
		if (!name) {
			continue;
		}
		const entry: InventoryEntry = { id: slugify(name), name };
		const note = noteIdx >= 0 ? text(row[noteIdx]) : undefined;
		if (note) {
			entry.note = note;
		}
		const description = descriptionIdx >= 0 ? text(row[descriptionIdx]) : undefined;
		if (description) {
			entry.description = description;
		}
		const categoryId = categoryIdx >= 0 ? categoryFromText(row[categoryIdx] ?? '') : INVENTORY_CATEGORY.Items;
		entriesByCategory.get(categoryId)?.push(entry);
	}

	const categories = [...entriesByCategory.entries()]
		.filter(([, entries]) => entries.length > 0)
		.map(([id, entries]) => ({
			id,
			title:
				id === INVENTORY_CATEGORY.Effects
					? 'Эффекты'
					: id === INVENTORY_CATEGORY.Specials
						? 'Спецроллы'
						: 'Обычные предметы',
			entries,
		}));

	return {
		player,
		coins: 0,
		tears: 0,
		notes: '',
		categories,
		fetchedAt: new Date().toISOString(),
	};
}
