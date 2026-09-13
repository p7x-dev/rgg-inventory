import type { HotbarSlot } from '@app/core/models/settings.model';
import type { InventoryCategory, InventoryCategoryId, InventoryEntry } from '@core/models/inventory.model';

/** MIME drag&drop: предмет из попапа инвентаря в слот хотбара. */
export const HOTBAR_DRAG_MIME = 'application/x-rgg-item';

export interface HotbarDragPayload {
	itemId: string;
	itemName: string;
}

/** Кодирует предмет в dataTransfer. */
export function encodeHotbarDrag(entry: InventoryEntry): string {
	return JSON.stringify({ itemId: entry.id, itemName: entry.name } satisfies HotbarDragPayload);
}

/** Читает предмет из dataTransfer; null — данных нет/несовместимы. */
export function decodeHotbarDrag(data: DataTransfer | null): HotbarDragPayload | null {
	const raw = data?.getData(HOTBAR_DRAG_MIME);
	if (!raw) {
		return null;
	}
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (
			typeof parsed === 'object' &&
			parsed !== null &&
			typeof (parsed as HotbarDragPayload).itemId === 'string' &&
			typeof (parsed as HotbarDragPayload).itemName === 'string'
		) {
			return parsed as HotbarDragPayload;
		}
	} catch {
		// некорректный payload — не предмет
	}
	return null;
}

export interface HotbarSlotView {
	/** Конфигурация слота; null — пустая ячейка (рисовать рамкой). */
	slot: HotbarSlot | null;
	/** Иконка слота: для категории — иконка первого предмета, для предмета — его иконка. */
	icon: string | null;
	/** Буква-заглушка, если иконки нет. */
	fallbackText: string;
	/** Подпись (название категории/предмета) для тултипа. */
	label: string;
	/** Количество: для категории — сумма quantity предметов, для предмета — 1. */
	count: number;
	/** Ссылка на предмет в актуальных данных (для категории — первый предмет). */
	resolvedEntry: InventoryEntry | null;
}

/** Строит список слотов хотбара для конкретного набора категорий и конфигурации. */
export function buildHotbarSlots(
	categories: InventoryCategory[],
	slots: (HotbarSlot | null)[],
	resolveIcon: (entry: InventoryEntry, categoryId?: InventoryCategoryId) => string | null,
	resolveCategoryIcon?: (categoryId: InventoryCategoryId) => string | null,
): HotbarSlotView[] {
	const entryByCategory = new Map<string, InventoryEntry[]>();
	const entryById = new Map<string, InventoryEntry>();
	for (const category of categories) {
		const list: InventoryEntry[] = [];
		for (const entry of category.entries) {
			list.push(entry);
			entryById.set(entry.id, entry);
		}
		entryByCategory.set(category.id, list);
	}

	const categoryEntries = (categoryId: string): InventoryEntry[] => entryByCategory.get(categoryId) ?? [];

	const configured = slots.length > 0;
	// Дефолт: непустые категории в порядке, в котором они у стримера в инвентаре.
	let useSlots: (HotbarSlot | null)[];
	if (configured) {
		useSlots = slots;
	} else {
		useSlots = categories
			.filter((category) => category.entries.length > 0)
			.map((category) => ({ kind: 'category' as const, categoryId: category.id }));
	}

	return useSlots.map((slot) => {
		if (slot === null) {
			return { slot: null, icon: null, fallbackText: '', label: '', count: 0, resolvedEntry: null };
		}
		if (slot.kind === 'category') {
			const entries = categoryEntries(slot.categoryId);
			const first = entries[0] ?? null;
			const count = entries.reduce((sum, entry) => sum + Math.max(1, entry.quantity ?? 1), 0);
			const label = categoryTitle(slot.categoryId);
			// Иконка категории приоритетнее иконки первого предмета.
			const categoryIcon = resolveCategoryIcon ? resolveCategoryIcon(slot.categoryId) : null;
			return {
				slot,
				icon: categoryIcon ?? (first ? resolveIcon(first) : null),
				fallbackText: label.charAt(0).toUpperCase(),
				label,
				count,
				resolvedEntry: first,
			};
		}
		const entry = entryById.get(slot.itemId) ?? null;
		if (entry === null) {
			// Предмет пропал из инвентаря: слот становится пустым («призрака» нет).
			return { slot: null, icon: null, fallbackText: '', label: '', count: 0, resolvedEntry: null };
		}
		const icon = resolveIcon(entry);
		return {
			slot,
			icon,
			fallbackText: (slot.itemName || '?').charAt(0).toUpperCase(),
			label: entry.name,
			count: 1,
			resolvedEntry: entry,
		};
	});
}

function categoryTitle(categoryId: string): string {
	switch (categoryId) {
		case 'effects':
			return 'Эффекты';
		case 'specials':
			return 'Спецроллы';
		default:
			return 'Обычные предметы';
	}
}