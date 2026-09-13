import type {
	InventoryCategory,
	InventoryCategoryId,
	InventoryData,
	InventoryEntry,
} from '@core/models/inventory.model';
import { lookupBankItem } from '@core/data/rgg-items.bank';
import { INVENTORY_CATEGORY, slugify } from '@core/models/inventory.model';

/**
 * Парсер страницы инвентаря RGG Land (https://rgg.land/inventories/{nick}).
 *
 * Страница сервер-рендерится (Next.js + MUI), данные лежат в обычном HTML:
 *  - заголовки секций: <li class="MuiListSubheader-root...">Заметки/Эффекты/.../</li>
 *  - заметки: <p class="MuiTypography-root...">текст</p> сразу после заголовка «Заметки»
 *  - записи: <li class="MuiListItem-root..."> с <div class="break-all"> для имени
 *    и вторичным <div class="break-all"> для заметки предмета
 * Описания (тултипы) рендерятся только на клиенте — из HTML их не достать.
 */

const SUBHEADER_RE = /<li[^>]*class="MuiListSubheader-root[^"]*"[^>]*>([^<]+)<\/li>/g;
const ITEM_RE = /<li class="MuiListItem-root[^"]*"[^>]*>([\s\S]*?)<\/li>/g;

const CATEGORY_HEADERS: Record<string, InventoryCategoryId> = {
	'эффекты': INVENTORY_CATEGORY.Effects,
	'обычные предметы': INVENTORY_CATEGORY.Items,
	'спецроллы': INVENTORY_CATEGORY.Specials,
};

/** Порядок категорий в выдаче парсера. */
const CATEGORY_ORDER: readonly InventoryCategoryId[] = [
	INVENTORY_CATEGORY.Effects,
	INVENTORY_CATEGORY.Items,
	INVENTORY_CATEGORY.Specials,
];

function stripHtml(value: string): string {
	return value
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#x27;/g, '\'')
		.replace(/\s+/g, ' ')
		.trim();
}

function parseEntry(itemHtml: string): InventoryEntry | null {
	const primaryMatch = /MuiListItemText-primary[\s\S]*?<div class="break-all">([\s\S]*?)<\/div>/.exec(itemHtml);
	if (!primaryMatch) {
		return null;
	}
	const name = stripHtml(primaryMatch[1]);
	if (!name) {
		return null;
	}
	const secondaryMatch = /MuiListItemText-secondary[\s\S]*?<div class="break-all">([\s\S]*?)<\/div>/.exec(itemHtml);
	const note = secondaryMatch ? stripHtml(secondaryMatch[1]) : undefined;

	const entry: InventoryEntry = { id: slugify(name), name };
	const bankItem = lookupBankItem(name);
	if (bankItem) {
		entry.type = bankItem.type;
		entry.description = bankItem.description;
	}
	if (note) {
		entry.note = note;
	}
	return entry;
}

/** Собирает секции: (заголовок, html-фрагмент секции). */
function splitSections(html: string): Array<{ header: string; fragment: string }> {
	const matches = [...html.matchAll(SUBHEADER_RE)];
	const sections: Array<{ header: string; fragment: string }> = [];
	for (let i = 0; i < matches.length; i++) {
		const header = stripHtml(matches[i][1]);
		const start = matches[i].index + matches[i][0].length;
		const end = i + 1 < matches.length ? matches[i + 1].index : html.length;
		sections.push({ header, fragment: html.slice(start, end) });
	}
	return sections;
}

/** Разбирает HTML страницы инвентаря игрока. */
export function parseInventoryHtml(html: string, player: string): InventoryData {
	const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '');

	const categories: InventoryCategory[] = [];
	for (const { header, fragment } of splitSections(withoutScripts)) {
		const categoryId = CATEGORY_HEADERS[header.toLowerCase()];
		if (!categoryId) {
			continue;
		}
		const entries: InventoryEntry[] = [];
		for (const itemMatch of fragment.matchAll(ITEM_RE)) {
			const entry = parseEntry(itemMatch[1]);
			if (entry) {
				entries.push(entry);
			}
		}
		categories.push({ id: categoryId, title: header, entries });
	}

	categories.sort((a, b) => CATEGORY_ORDER.indexOf(a.id) - CATEGORY_ORDER.indexOf(b.id));

	return {
		player,
		coins: 0,
		tears: 0,
		categories,
		fetchedAt: new Date().toISOString(),
	};
}

/** Извлекает монетки/слёзы игрока из страницы-обзора инвентарей. */
export function parseOverviewCurrencies(html: string, nick: string): { coins: number; tears: number } {
	const nickLower = nick.toLowerCase();
	const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
	const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g;

	for (const rowMatch of html.matchAll(rowRe)) {
		const cells = [...rowMatch[1].matchAll(cellRe)].map((cell) => stripHtml(cell[1]));
		if (cells.length < 3) {
			continue;
		}
		if (cells[0].toLowerCase() !== nickLower) {
			continue;
		}
		const coins = Number.parseInt(cells[1] ?? '', 10);
		const tears = Number.parseInt(cells[2] ?? '', 10);
		return {
			coins: Number.isFinite(coins) ? coins : 0,
			tears: Number.isFinite(tears) ? tears : 0,
		};
	}
	return { coins: 0, tears: 0 };
}
