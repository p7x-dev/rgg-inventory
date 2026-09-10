import type { InventoryCategoryId, InventoryEntry } from '@core/models/inventory.model';

/** Контент слота: запись инвентаря + готовая иконка. */
export interface SlotContent {
	entry: InventoryEntry;
	icon: string | null;
	categoryId: InventoryCategoryId;
}

export type SlotItem = SlotContent | null;
