import type { PopoverItem, SortMode } from './inventory-popover.models';
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { IconStore } from '@core/stores/icon.store';
import { InventoryStore } from '@core/stores/inventory.store';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { InventoryCategoryGroupComponent } from './inventory-category-group/inventory-category-group.component';
import { CATEGORY_LABEL } from './inventory-popover.models';
import { InventorySearchBarComponent } from './inventory-search-bar/inventory-search-bar.component';

/** Полный инвентарь стримера: поиск, сортировка, группировка по категориям. */
@Component({
	selector: 'app-inventory-popover',
	imports: [
		InventoryCategoryGroupComponent,
		InventorySearchBarComponent,
		TuiButton,
		TuiIcon,
	],
	templateUrl: './inventory-popover.component.html',
	styleUrl: './inventory-popover.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryPopoverComponent {
	private readonly inventoryStore = inject(InventoryStore);
	private readonly iconStore = inject(IconStore);

	readonly close = output<void>();

	protected readonly query = signal('');

	protected readonly sortMode = signal<SortMode>('category');

	protected readonly sortAsc = signal(true);

	protected readonly playerName = computed(() => this.inventoryStore.data()?.player ?? 'Инвентарь');

	/** Все предметы (с иконками) после поиска и сортировки. */
	protected readonly items = computed<PopoverItem[]>(() => {
		const q = this.query().trim().toLowerCase();
		const mode = this.sortMode();
		const asc = this.sortAsc();

		const all: PopoverItem[] = this.inventoryStore.entries().flatMap((category) =>
			category.entries.map((entry) => ({
				entry,
				icon: this.iconStore.resolveIcon(entry),
				categoryId: category.id,
			})),
		);

		const matches = (item: PopoverItem): boolean => {
			const note = item.entry.note?.toLowerCase() ?? '';
			return item.entry.name.toLowerCase().includes(q) || note.includes(q);
		};

		const filtered = q ? all.filter(matches) : all;

		return filtered.sort((a, b) => {
			let cmp = 0;
			if (mode === 'name') {
				cmp = a.entry.name.localeCompare(b.entry.name, 'ru');
			} else if (mode === 'quantity') {
				cmp = (b.entry.quantity ?? 1) - (a.entry.quantity ?? 1);
			} else {
				cmp = a.categoryId.localeCompare(b.categoryId) || a.entry.name.localeCompare(b.entry.name, 'ru');
			}
			return asc ? cmp : -cmp;
		});
	});

	/** Группы для отображения (свернуты при поиске, иначе по категориям). */
	protected readonly groups = computed<{ id: string; label: string; items: PopoverItem[] }[]>(() => {
		if (this.query().trim()) {
			return [{ id: 'search', label: 'Результаты поиска', items: this.items() }];
		}
		const map = new Map<string, PopoverItem[]>();
		for (const item of this.items()) {
			const list = map.get(item.categoryId) ?? [];
			list.push(item);
			map.set(item.categoryId, list);
		}
		return [...map.entries()]
			.map(([id, list]) => ({
				id,
				label: CATEGORY_LABEL[id] ?? id,
				items: list,
			}))
			.filter((group) => group.items.length > 0);
	});

	protected readonly totalCount = computed(() => this.items().length);

	protected onClose(): void {
		this.close.emit();
	}
}