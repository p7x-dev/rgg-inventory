import type { InventoryEntry } from '@core/models/inventory.model';

export const CATEGORY_LABEL: Record<string, string> = {
	effects: 'Эффекты',
	items: 'Обычные предметы',
	specials: 'Спецроллы',
};

export type SortMode = 'category' | 'name' | 'quantity';

export interface PopoverItem {
	entry: InventoryEntry;
	icon: string | null;
	categoryId: string;
}