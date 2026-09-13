/* eslint-disable max-len -- длинные inline-SVG строки */
import type { RggItemTypeId } from '@core/data/rgg-items.bank';
/**
 * Библиотека иконок предметов RGG Land.
 *
 * Для КАЖДОГО имени предмета генерируется ОТДЕЛЬНАЯ иконка (даже при 674
 * предметах в банке): уникальность достигается компоновкой
 *   1. база — силуэт-«окно» по ТИПУ предмета;
 *   2. цвет окна — палитра по стабильному хэшу имени, так что два предмета
 *      одного типа/кластера всё равно визуально различаются;
 *   3. глиф — символ по ключевым словам названия (оружие/еда/живность/...);
 *   4. раритет — количество золотых звёзд (1–6★) по префиксу названия.
 * Категории инвентаря и валюты — свои отдельные иконки.
 *
 * Все картинки 24×24, data:image/svg+xml;base64. Кэш по «имя + тип».
 * Глифы и кластеры слов — в rgg-icon-glyphs.ts.
 */
import type { InventoryCategoryId } from '@core/models/inventory.model';
import { svgDataUri } from '@core/data/svg-icon.util';
import { INVENTORY_CATEGORY } from '@core/models/inventory.model';
import { glyphForName, GLYPHS } from './rgg-icon-glyphs';

// --- RGG-палитра (ретро-тема оверлея) ---
const fg = '#e6dbff';
const dark = '#221744';
const gold = '#ffd27d';
const accent = '#9b6dff';

/**
 * Расширенная палитра для уникального цвета предмета.
 * Хэш имени выбирает один из этих базовых оттенков.
 */
const ITEM_HUES: readonly string[] = [
	'#9b6dff',
	'#e05a5a',
	'#7dffa0',
	'#6fb7ff',
	'#ffd27d',
	'#ff8a5c',
	'#5cd6c4',
	'#c46bff',
	'#e8e06a',
	'#ff6bb1',
	'#6a9cff',
	'#7fff8d',
	'#ff9d47',
	'#b07bff',
	'#5fe0ad',
	'#ff7d7d',
];

/** Стабильный 31-bit хэш строки (FNV-1a). */
function hashString(value: string): number {
	let hash = 0x811C9DC5;
	for (let i = 0; i < value.length; i++) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

/** Уникальный цвет предмета по имени (стабильный). */
function itemColor(name: string): string {
	return ITEM_HUES[hashString(name) % ITEM_HUES.length];
}

/** SVG из тела иконки. */
function pixelIcon(body: string, bg = 'none'): string {
	return svgDataUri(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">${bg ? `<rect width="24" height="24" fill="${bg}"/>` : ''}${body}</svg>`,
	);
}

/** Небольшая золотая звёздочка (для бейджа раритета). */
function star(x: number, y: number): string {
	return `<path d="M${x + 1} ${y}L${x + 2} ${y + 1}L${x + 3} ${y}L${x + 2} ${y + 2}L${x + 3} ${y + 3}L${x + 1} ${y + 2}L${x - 1} ${y + 3}L${x} ${y + 2}L${x - 1} ${y}L${x + 1} ${y + 1}Z" fill="${gold}" stroke="${fg}" stroke-width="0.3"/>`;
}

/** Бейдж раритета: 1–6 звёзд в правом нижнем углу. */
function rarityBadge(stars: number): string {
	const count = Math.max(1, Math.min(6, stars));
	const size = 4;
	const startX = 24 - count * size - 1;
	return Array.from({ length: count }, (_, i) => star(startX + i * size, 18)).join('');
}

/**
 * База-«окно» по типу предмета. Возвращает SVG-тело: силуэт с рамкой,
 * внутреннее поле заливается уникальным цветом предмета.
 */
const TYPE_WINDOW: Readonly<Record<RggItemTypeId, (color: string) => string>> = {
	'Предмет': (color) =>
		`<rect x="3" y="4" width="18" height="16" rx="2" fill="${dark}" stroke="${fg}" stroke-width="1.2"/>
		 <rect x="5.5" y="6.5" width="13" height="11" rx="1.5" fill="${color}" opacity="0.9"/>`,
	'Съедобный Предмет': (color) =>
		`<rect x="7" y="2" width="10" height="5" rx="2.5" fill="${dark}" stroke="${fg}" stroke-width="1"/>
		 <rect x="4.5" y="6" width="15" height="14" rx="7" fill="${color}" stroke="${fg}" stroke-width="1.2"/>`,
	'Оружие': (color) =>
		`<path d="M12 2 L20 6 L20 18 L12 22 L4 18 L4 6 Z" fill="${dark}" stroke="${fg}" stroke-width="1.2"/>
		 <rect x="7" y="7" width="10" height="10" rx="2" fill="${color}" opacity="0.9"/>`,
	'Зелье': (color) =>
		`<path d="M9 3 L15 3 L15 5 L18 5 L17 21 L7 21 L6 5 L9 5 Z" fill="${dark}" stroke="${fg}" stroke-width="1.2"/>
		 <path d="M9.5 7 L14.5 7 L15.4 19 L8.6 19 Z" fill="${color}" opacity="0.9"/>`,
	'Крысиный Предмет': (color) =>
		`<path d="M5 4 L5 13 A 7 7 0 0 0 19 13 L19 4 Z" fill="${dark}" stroke="${fg}" stroke-width="1.2"/>
		 <rect x="4" y="7" width="6" height="3" rx="1.5" fill="${fg}"/>
		 <rect x="14" y="7" width="6" height="3" rx="1.5" fill="${fg}"/>
		 <ellipse cx="12" cy="13" rx="6" ry="5" fill="${color}" opacity="0.9"/>`,
	'Хлам': (color) =>
		`<rect x="6" y="3" width="5" height="4" rx="1" fill="${dark}" stroke="${fg}" stroke-width="1"/>
		 <rect x="12" y="5" width="6" height="4" rx="1" fill="${dark}" stroke="${fg}" stroke-width="1"/>
		 <rect x="5" y="6" width="14" height="15" rx="2" fill="${color}" stroke="${fg}" stroke-width="1.2"/>`,
	'Гремлинский Предмет': (color) =>
		`<rect x="4" y="3" width="5" height="6" rx="1" fill="${dark}" stroke="${fg}" stroke-width="1"/>
		 <rect x="15" y="3" width="5" height="6" rx="1" fill="${dark}" stroke="${fg}" stroke-width="1"/>
		 <rect x="4" y="8" width="16" height="13" rx="3" fill="${color}" stroke="${fg}" stroke-width="1.2"/>`,
	'Свиной Предмет': (color) =>
		`<path d="M6 3 L6 9 L9 9 L9 3 Z M15 3 L18 9 L18 3 Z" fill="${dark}" stroke="${fg}" stroke-width="1"/>
		 <rect x="4" y="8" width="16" height="13" rx="3.5" fill="${color}" stroke="${fg}" stroke-width="1.2"/>
		 <ellipse cx="12" cy="14" rx="3" ry="2.2" fill="${dark}"/>`,
};

const FALLBACK_WINDOW: (color: string) => string = TYPE_WINDOW['Предмет'];

/** Возвращает базу-окно по типу или запасную (Предмет). */
function windowFor(type: string | undefined, color: string): string {
	const builder = type ? TYPE_WINDOW[type as RggItemTypeId] : undefined;
	return (builder ?? FALLBACK_WINDOW)(color);
}

// ---------------------------------------------------------------------------
// Категории инвентаря (шапки попапа, слоты хотбара) и валюты
// ---------------------------------------------------------------------------
const CATEGORY_BODIES: Readonly<Record<InventoryCategoryId, string>> = {
	[INVENTORY_CATEGORY.Effects]: `<rect x="6" y="4" width="2" height="3" fill="${gold}"/>
	 <rect x="4" y="6" width="6" height="3" rx="1" fill="${accent}" stroke="${fg}" stroke-width="0.7"/>
	 <rect x="10" y="8" width="8" height="8" fill="${accent}" stroke="${fg}" stroke-width="1.2"/>
	 <circle cx="14" cy="12" r="2" fill="${gold}"/>
	 <rect x="13" y="11" width="1" height="1" fill="${dark}"/>
	 <rect x="15" y="11" width="1" height="1" fill="${dark}"/>
	 <rect x="14" y="13" width="1" height="1" fill="${dark}"/>
	 <rect x="4" y="16" width="2" height="3" fill="${gold}"/>`,
	[INVENTORY_CATEGORY.Items]: `<rect x="3" y="4" width="18" height="16" rx="2" fill="${accent}" stroke="${fg}" stroke-width="1.2"/>
	 <rect x="5.5" y="6.5" width="13" height="11" rx="1.5" fill="${dark}"/>
	 <rect x="5.5" y="12" width="13" height="1.5" fill="${fg}" opacity="0.35"/>`,
	[INVENTORY_CATEGORY.Specials]: `<path d="M12 2 L14 8 L21 8 L15 12 L17 18 L12 14 L7 18 L9 12 L3 8 L10 8 Z" fill="${gold}" stroke="${fg}" stroke-width="0.7"/>
	 <circle cx="12" cy="12" r="7" fill="none" stroke="${accent}" stroke-width="1.5"/>
	 <path d="M14 5 Q17.5 7.5 17.5 10.5" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round"/>
	 <path d="M18 9.5 L16 11 L17.8 12.2 Z" fill="${accent}" stroke="${fg}" stroke-width="0.3"/>`,
};

// ---------------------------------------------------------------------------
// Раритет: количество звёзд по префиксу/слову в названии предмета
// ---------------------------------------------------------------------------
export interface RggRarity {
	/** Ранг для сортировки (больше = реже). */
	rank: number;
	/** Количество звёзд на иконке. */
	stars: number;
	/** Человеческое имя. */
	label: string;
}

export const RGG_RARITIES = {
	common: { rank: 1, stars: 1, label: 'Обычный' },
	improved: { rank: 2, stars: 2, label: 'Улучшенный' },
	rare: { rank: 3, stars: 3, label: 'Редкий' },
	epic: { rank: 4, stars: 4, label: 'Эпический' },
	legendary: { rank: 5, stars: 5, label: 'Легендарный' },
	mystic: { rank: 6, stars: 6, label: 'Мифический' },
};

const RARITY_RULES: ReadonlyArray<{ key: keyof typeof RGG_RARITIES; re: RegExp }> = [
	{ key: 'mystic', re: /мифическ/iu },
	{ key: 'legendary', re: /легендарн/iu },
	{ key: 'epic', re: /эпическ/iu },
	{ key: 'rare', re: /^редк/iu },
	{ key: 'improved', re: /^улучшенн/iu },
];

/** Определяет раритет по названию предмета (максимальный из встречающихся маркеров). */
export function rarityOfName(name: string): RggRarity {
	let best: RggRarity | null = null;
	for (const rule of RARITY_RULES) {
		const rarity = RGG_RARITIES[rule.key];
		if (rarity.rank > (best?.rank ?? 0) && rule.re.test(name)) {
			best = rarity;
		}
	}
	return best ?? RGG_RARITIES.common;
}

// ---------------------------------------------------------------------------
// Композиция: база + глиф + цвет + звёзды (кэш по «имя + тип»)
// ---------------------------------------------------------------------------
const iconCache = new Map<string, string>();

/** Полное тело предметной иконки. */
function composeItemIcon(name: string, type: string | undefined, stars: number): string {
	const color = itemColor(name);
	const window = windowFor(type, color);
	const glyph = glyphForName(name)?.body ?? '';
	const badge = rarityBadge(stars);
	return pixelIcon(`<g>${window}${glyph}${badge}</g>`);
}

function cachedItemIcon(name: string, type: string | undefined, stars: number): string | null {
	const cacheKey = `${name}\u0000${type ?? ''}\u0000${stars}`;
	const hit = iconCache.get(cacheKey);
	if (hit) {
		return hit;
	}
	const uri = composeItemIcon(name, type, stars);
	iconCache.set(cacheKey, uri);
	return uri;
}

/** Иконка предмета: база по типу + глиф по имени + цвет + звёзды раритета. */
export function rggItemIcon(name: string, type: string | undefined, categoryId?: InventoryCategoryId): string | null {
	if (categoryId === INVENTORY_CATEGORY.Specials) {
		return rggCategoryIcon(INVENTORY_CATEGORY.Specials);
	}
	const stars = rarityOfName(name).stars;
	return cachedItemIcon(name, type, stars);
}

/** Иконка категории (без звёзд; null — категория неизвестна). */
export function rggCategoryIcon(categoryId: InventoryCategoryId): string | null {
	const body = CATEGORY_BODIES[categoryId];
	return body ? pixelIcon(body) : null;
}

/** Иконка валюты монеток. */
export function rggCoinIcon(): string {
	return pixelIcon(
		`<circle cx="12" cy="12" r="9" fill="${gold}" stroke="${fg}" stroke-width="1"/>
		 <circle cx="12" cy="12" r="6.5" fill="none" stroke="${dark}" stroke-width="1"/>
		 <circle cx="12" cy="12" r="1.5" fill="${dark}"/>`,
	);
}

/** Иконка валюты слёз. */
export function rggTearIcon(): string {
	return pixelIcon(
		`<path d="M12 3 Q12 6 9 9 Q6 12 6 15 Q6 19 9 20.5 Q12 22 15 20.5 Q18 19 18 15 Q18 12 15 9 Q12 6 12 3 Z" fill="#6fb7ff" stroke="${fg}" stroke-width="1"/>
		 <ellipse cx="11" cy="15" rx="2.5" ry="3" fill="${dark}" opacity="0.5"/>`,
	);
}

// Глифы (для диагностики покрытия банка).
export { GLYPHS as RGG_GLYPHS };

/**
 * Процент/доля предметов банка, для которых удалось подобрать знак-глиф.
 * Чисто диагностическая функция.
 */
export function glyphCoverage(itemNames: string[]): { covered: number; total: number } {
	const covered = itemNames.reduce((sum, name) => sum + (glyphForName(name) ? 1 : 0), 0);
	return { covered, total: itemNames.length };
}