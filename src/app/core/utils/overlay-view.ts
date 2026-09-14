import type { SlotItem } from '@core/models/overlay.model';
import type { DesignLayout } from '@core/models/theme.model';
import type { IconStore } from '@core/stores/icon.store';
import type { InventoryStore } from '@core/stores/inventory.store';
import type { SettingsStore } from '@core/stores/settings.store';
import { computed, type Signal } from '@angular/core';

/** Общее представление оверлея, вычисляемое из сторов (используется bar и page). */
export interface OverlayView {
	items: Signal<SlotItem[]>;
	designMode: Signal<boolean>;
	design: Signal<DesignLayout | null>;
	playerName: Signal<string>;
	coins: Signal<number>;
	tears: Signal<number>;
	visibleRows: Signal<number>;
}

/** Строит сигналы общего представления оверлея из сторов. */
export function buildOverlayView(
	settingsStore: InstanceType<typeof SettingsStore>,
	inventoryStore: InstanceType<typeof InventoryStore>,
	iconStore: InstanceType<typeof IconStore>,
	fallbackPlayerName = 'Инвентарь',
): OverlayView {
	const items = computed<SlotItem[]>(() =>
		inventoryStore.entries().flatMap((category) =>
			category.entries.map((entry) => ({
				entry,
				icon: iconStore.resolveIcon(entry),
				categoryId: category.id,
			})),
		),
	);

	const designMode = computed(
		() => settingsStore.themePreset() === 'custom' && settingsStore.customDesign() !== null,
	);

	const design = computed<DesignLayout | null>(() =>
		designMode() ? settingsStore.customDesign() : null,
	);

	const playerName = computed(
		() => (inventoryStore.data()?.player ?? settingsStore.settings().sources.rggland.nick) || fallbackPlayerName,
	);

	const coins = computed(() => inventoryStore.data()?.coins ?? 0);

	const tears = computed(() => inventoryStore.data()?.tears ?? 0);

	const visibleRows = computed(() => 2);

	return { items, designMode, design, playerName, coins, tears, visibleRows };
}