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

/** Приводит заголовок к единому виду для сравнения (регистр/пробелы не важны). */
function normalizeHeader(value: string): string {
	return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Разбивает заголовок на слова (знаки пунктуации — разделители). */
function headerWords(value: string): string[] {
	return normalizeHeader(value).split(/[^\p{L}\p{N}]+/u).filter((word) => word !== '');
}

/**
 * Оценка совпадения заголовка с ключевым словом (0 — нет совпадения).
 * Чем точнее, тем выше: точное равенство ячейки > равенство слова >
 * общий префикс (стемминг: «игры» ↔ «игра», «платформы» ↔ «платформа»).
 */
function headerScore(header: string, keyword: string): number {
	const h = normalizeHeader(header);
	const k = normalizeHeader(keyword);
	if (!h || !k) {
		return 0;
	}
	if (h === k) {
		return 100;
	}
	if (h.startsWith(k) || h.endsWith(k)) {
		return 80;
	}
	for (const word of headerWords(header)) {
		if (word === k) {
			return 90;
		}
		if (word.startsWith(k) || k.startsWith(word)) {
			return 70;
		}
		const min = Math.min(word.length, k.length);
		if (min >= 4 && word.slice(0, min - 1) === k.slice(0, min - 1)) {
			return 60;
		}
	}
	if (h.includes(k)) {
		return 40;
	}
	return 0;
}

/**
 * Ищет колонку по названию (fuzzy): лучшая оценка среди ключевых слов.
 * Например «Название игры» находится по «игра», «Платформы» — по «платформа».
 * Позиция колонки в таблице не важна.
 */
function findColumn(headers: readonly string[], keywords: readonly string[]): number {
	let bestIndex = -1;
	let bestScore = 0;
	for (const keyword of keywords) {
		for (let i = 0; i < headers.length; i++) {
			const score = headerScore(headers[i], keyword);
			if (score > bestScore) {
				bestScore = score;
				bestIndex = i;
			}
		}
	}
	return bestIndex;
}

function text(value: string | undefined): string | undefined {
	const trimmed = (value ?? '').trim();
	return trimmed || undefined;
}

/** Ключевые слова колонок банковской таблицы (порядок = приоритет). */
const INVENTORY_NAME_KEYWORDS = ['предмет', 'название', 'name', 'item'] as const;
const INVENTORY_CATEGORY_KEYWORDS = ['категория', 'тип', 'category', 'type'] as const;
const INVENTORY_NOTE_KEYWORDS = ['заметка', 'примечание', 'комментарий', 'note', 'notes', 'comment'] as const;
const INVENTORY_DESCRIPTION_KEYWORDS = ['описание', 'description', 'подробности', 'details'] as const;

/**
 * Разбирает CSV-экспорт Google Sheets в InventoryData.
 * Заголовки ищутся по названиям колонок в любой строке таблицы (шапка любой
 * формы игнорируется), данные читаются под найденной строкой заголовков.
 */
export function parseSheetCsv(csv: string, mapping: SheetMapping, player: string): InventoryData {
	const rows = parseCsv(csv);
	if (rows.length < 2) {
		throw new Error('Таблица пустая: нужна строка заголовков и хотя бы одна запись');
	}
	const nameKeywords = [mapping.name, ...INVENTORY_NAME_KEYWORDS];
	const categoryKeywords = [mapping.category, ...INVENTORY_CATEGORY_KEYWORDS];
	const noteKeywords = [mapping.note, ...INVENTORY_NOTE_KEYWORDS];
	const descriptionKeywords = [mapping.description, ...INVENTORY_DESCRIPTION_KEYWORDS];

	// Строка заголовков — первая, где нашлась колонка названий и есть записи ниже.
	// Строка с одним лишь вхождением слова («Банк предметов», заголовок сезона)
	// не считается шапкой: ждём, пока рядом найдётся ещё одна узнаваемая колонка
	// (категория/заметка/описание); если такой строки нет — берём первую по имени.
	let headerIdx = -1;
	let nameOnlyIdx = -1;
	for (let i = 0; i < rows.length; i++) {
		const nameIdx = findColumn(rows[i], nameKeywords);
		if (nameIdx < 0) {
			continue;
		}
		const hasData = rows.slice(i + 1).some((row) => (row[nameIdx] ?? '').trim() !== '');
		if (!hasData) {
			continue;
		}
		if (nameOnlyIdx < 0) {
			nameOnlyIdx = i;
		}
		const categoryIdx = findColumn(rows[i], categoryKeywords);
		const noteIdx = findColumn(rows[i], noteKeywords);
		const descriptionIdx = findColumn(rows[i], descriptionKeywords);
		if (categoryIdx >= 0 || noteIdx >= 0 || descriptionIdx >= 0) {
			headerIdx = i;
			break;
		}
	}
	if (headerIdx < 0) {
		headerIdx = nameOnlyIdx;
	}
	if (headerIdx < 0) {
		throw new Error(`Не найдена колонка «${mapping.name}» в заголовках таблицы`);
	}
	const headers = rows[headerIdx];
	const nameIdx = findColumn(headers, nameKeywords);
	const categoryIdx = findColumn(headers, categoryKeywords);
	const noteIdx = findColumn(headers, noteKeywords);
	const descriptionIdx = findColumn(headers, descriptionKeywords);

	const entriesByCategory = new Map<InventoryCategoryId, InventoryEntry[]>();
	for (const id of Object.values(INVENTORY_CATEGORY)) {
		entriesByCategory.set(id, []);
	}

	for (const row of rows.slice(headerIdx + 1)) {
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

/** Ключевые слова колонок Solo-таблицы (порядок = приоритет, точное > вхождение). */
const SOLO_GAME_KEYWORDS = ['игра', 'игры', 'game', 'title', 'название'] as const;
const SOLO_ACTION_KEYWORDS = ['результат', 'статус', 'действие', 'итог', 'result', 'action', 'status'] as const;
const SOLO_PLATFORM_KEYWORDS = ['платформа', 'система', 'консоль', 'platform', 'console', 'system'] as const;
const SOLO_REASON_KEYWORDS = ['причина', 'примечание', 'заметка', 'комментарий', 'reason', 'notes', 'comment'] as const;
const SOLO_DESCRIPTION_KEYWORDS = ['описание', 'description'] as const;
const SOLO_CURRENT_KEYWORDS = ['текущая', 'сейчас', 'в процессе', 'current', 'now', 'playing'] as const;

/**
 * Разбирает CSV-экспорт Solo-таблицы стримера в SoloData:
 * тасует строки по платформам, считает пройдено/реролльнуто/пропущено,
 * помечает текущую игру каждой платформы.
 *
 * Колонки ищутся ПО НАЗВАНИЯМ в любой строке таблицы (шапка любой формы,
 * строка платформ, мусорные строки игнорируются): сначала строка, где нашлись
 * колонки игры и статуса/результата и есть распознаваемые записи ниже.
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
	const gameKeywords = [fullMapping.game, ...SOLO_GAME_KEYWORDS];
	const actionKeywords = [fullMapping.action, ...SOLO_ACTION_KEYWORDS];

	// Перебираем строки-кандидаты в заголовки: подходит та, где есть колонка
	// игры и колонка статуса/результата и хотя бы одна распознаваемая запись ниже.
	let headerIdx = -1;
	for (let i = 0; i < rows.length; i++) {
		const gameIdx = findColumn(rows[i], gameKeywords);
		const actionIdx = findColumn(rows[i], actionKeywords);
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
		throw new Error(
			`Не найдены колонки «${fullMapping.game}» и/или «${fullMapping.action}» по названию`,
		);
	}
	const headers = rows[headerIdx];

	const platformIdx = findColumn(headers, [fullMapping.platform, ...SOLO_PLATFORM_KEYWORDS]);
	const gameIdx = findColumn(headers, gameKeywords);
	const actionIdx = findColumn(headers, actionKeywords);
	const reasonIdx = findColumn(headers, [fullMapping.reason, ...SOLO_REASON_KEYWORDS]);
	const descriptionIdx = findColumn(headers, [fullMapping.description, ...SOLO_DESCRIPTION_KEYWORDS]);
	const currentIdx = findColumn(headers, [fullMapping.current, ...SOLO_CURRENT_KEYWORDS]);

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
