/** Идентификаторы категорий инвентаря (как в RGG Land). */
export const INVENTORY_CATEGORY = {
	Effects: 'effects',
	Items: 'items',
	Specials: 'specials',
} as const;

export type InventoryCategoryId = (typeof INVENTORY_CATEGORY)[keyof typeof INVENTORY_CATEGORY];

export interface InventoryEntry {
	/** Стабильный идентификатор (slug имени). */
	id: string;
	name: string;
	/** Описание предмета (тултип), если источник даёт. */
	description?: string;
	/** Вторичный текст (например «Выкопано в садике»). */
	note?: string;
	/** Иконка: dataURL, http(s)-URL или пусто — будет подставлена дефолтная. */
	icon?: string;
	/** Количество, если применимо. */
	quantity?: number;
}

export interface InventoryCategory {
	id: InventoryCategoryId;
	title: string;
	entries: InventoryEntry[];
}

export interface InventoryData {
	player: string;
	coins: number;
	tears: number;
	notes: string;
	categories: InventoryCategory[];
	fetchedAt: string;
	/** Индекс «выбранного» слота в плоском списке (по рядам), если источник даёт. */
	selectedSlot?: number | null;
}

export type InventorySourceId = 'rggland' | 'sheets' | 'local';

/** Унифицированный результат загрузки из любого источника. */
export type InventoryLoadResult = { ok: true; data: InventoryData } | { ok: false; error: string };

/** Набор иконок: имя предмета/категории → картинка. */
export type IconMap = Record<string, string>;

/** slug имени для стабильного id. */
export function slugify(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '');
}

const KNOWN_CATEGORY_IDS: readonly InventoryCategoryId[] = Object.values(INVENTORY_CATEGORY);

/** Безопасное приведение строки к категории; null — если значение неизвестно. */
export function parseCategoryId(value: string): InventoryCategoryId | null {
	for (const id of KNOWN_CATEGORY_IDS) {
		if (value === id) {
			return id;
		}
	}
	return null;
}
