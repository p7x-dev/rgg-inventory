import type { InventoryCategoryId, InventoryData, InventoryEntry } from '@core/models/inventory.model';
import type { SoloData, SoloPlatform, SoloRow } from '@core/models/solo.model';
import { INVENTORY_CATEGORY, slugify } from '@core/models/inventory.model';
import { parseSoloAction, parseSoloPlatform } from '@core/models/solo.model';

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
		categories,
		fetchedAt: new Date().toISOString(),
	};
}

/** Заголовки колонок Solo-таблицы стримера (сопоставление по тексту). */
export interface SoloColumnMapping {
	platform: string;
	game: string;
	action: string;
	reason: string;
	description: string;
	current: string;
}

const DEFAULT_SOLO_MAPPING: SoloColumnMapping = {
	platform: 'Платформа',
	game: 'Игра',
	action: 'Статус',
	reason: 'Причина',
	description: 'Описание',
	current: 'Текущая',
};

function headerIndex(headers: string[], candidates: readonly string[]): number {
	return headers.findIndex((header) =>
		candidates.some((candidate) => header.trim().toLowerCase() === candidate.toLowerCase()),
	);
}

/**
 * Разбирает CSV-экспорт Solo-таблицы стримера в SoloData:
 * тасует строки по платформам (заголовкам), считает пройдено/реролльнуто/пропущено,
 * помечает текущую игру каждой платформы.
 *
 * Таблицы бывают двух видов:
 *  - «чистые»: первая строка — заголовки (Платформа,Игра,Статус,...);
 *  - «с шапкой»: вверху строка-заголовок платформ (например «NES * PS1 * SNES ...»),
 *    а заголовки колонок лежат на 1–2 строки ниже (Дата,Платформа,Мод,Игра,Результат,Причина...).
 * Парсер не знает форму шапки: он перебирает строки и берёт первую, которая
 * даёт рабочее сопоставление колонок (по ячейке «Игра»/«Game») и распознаваемые
 * записи ниже. Так шапка любой формы игнорируется, а парсится сама таблица.
 */
export function parseSoloCsv(
	csv: string,
	mapping: Partial<SoloColumnMapping> = {},
	player = 'стример',
): SoloData {
	const rows = parseCsv(csv);
	if (rows.length < 2) {
		throw new Error('Таблица пустая: нужна строка заголовков и хотя бы одна запись');
	}
	const fullMapping = { ...DEFAULT_SOLO_MAPPING, ...mapping };

	// Перебираем строки-кандидаты в заголовки: подходит та, где есть ячейка
	// «Игра»/«Game» и которая даёт хотя бы одну распознаваемую запись ниже.
	let headerIdx = -1;
	for (let i = 0; i < rows.length; i++) {
		if (!rows[i].some((cell) => cell.trim().toLowerCase() === 'игра' || cell.trim().toLowerCase() === 'game')) {
			continue;
		}
		const headers = rows[i];
		const gameIdx = headerIndex(headers, [fullMapping.game, 'игра', 'game', 'title']);
		const actionIdx = headerIndex(
			headers,
			[fullMapping.action, 'статус', 'действие', 'результат', 'result', 'action'],
		);
		if (gameIdx < 0 || actionIdx < 0) {
			continue;
		}
		const hasData = rows.slice(i + 1).some((row) => {
			const game = (row[gameIdx] ?? '').trim();
			return game !== '' && parseSoloAction(row[actionIdx] ?? '') !== null;
		});
		if (hasData) {
			headerIdx = i;
			break;
		}
	}
	if (headerIdx < 0) {
		const found = rows[0].map((header) => `«${header}»`).join(', ');
		throw new Error(`Не найдены колонки «${fullMapping.game}» и/или «${fullMapping.action}». Найдены: ${found}`);
	}
	const headers = rows[headerIdx];

	const platformIdx = headerIndex(headers, [fullMapping.platform, 'платформа', 'console', 'system']);
	const gameIdx = headerIndex(headers, [fullMapping.game, 'игра', 'game', 'title']);
	const actionIdx = headerIndex(headers, [fullMapping.action, 'статус', 'действие', 'результат', 'result', 'action']);
	const reasonIdx = headerIndex(headers, [fullMapping.reason, 'причина', 'примечание', 'notes', 'reason']);
	const descriptionIdx = headerIndex(headers, [fullMapping.description, 'описание', 'notes', 'description']);
	const currentIdx = headerIndex(headers, [fullMapping.current, 'текущая', 'current', 'сейчас']);

	if (gameIdx < 0 || actionIdx < 0) {
		const found = headers.map((header) => `«${header}»`).join(', ');
		throw new Error(`Не найдены колонки «${fullMapping.game}» и/или «${fullMapping.action}». Найдены: ${found}`);
	}

	const rawRows: SoloRow[] = [];
	for (const row of rows.slice(headerIdx + 1)) {
		const game = (row[gameIdx] ?? '').trim();
		if (!game) {
			continue;
		}
		const action = parseSoloAction(row[actionIdx] ?? '');
		if (!action) {
			continue;
		}
		const platformRaw = platformIdx >= 0 ? (row[platformIdx] ?? '').trim() : '';
		const platform: SoloPlatform = parseSoloPlatform(platformRaw) ?? 'Другое';
		const reason = reasonIdx >= 0 ? (row[reasonIdx] ?? '').trim() : '';
		const description = descriptionIdx >= 0 ? (row[descriptionIdx] ?? '').trim() : '';
		const current = currentIdx >= 0 ? (row[currentIdx] ?? '').trim() !== '' : false;
		rawRows.push({
			platform,
			game,
			action,
			reason: reason || undefined,
			description: description || undefined,
			current,
		});
	}

	const categories = new Map<SoloPlatform, SoloRow[]>();
	for (const row of rawRows) {
		const list = categories.get(row.platform) ?? [];
		list.push(row);
		categories.set(row.platform, list);
	}

	let completed = 0;
	let reroll = 0;
	let skip = 0;

	const soloCategories = [...categories.entries()].map(([platform, list]) => {
		const stats = { completed: 0, reroll: 0, skip: 0 };
		for (const row of list) {
			stats[row.action] += 1;
		}
		completed += stats.completed;
		reroll += stats.reroll;
		skip += stats.skip;
		return {
			platform,
			current: list.find((row) => row.current) ?? null,
			rows: list,
			stats,
		};
	});

	return {
		player,
		total: { completed, reroll, skip },
		categories: soloCategories,
		fetchedAt: new Date().toISOString(),
	};
}
