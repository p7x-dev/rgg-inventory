import type { InventoryCategoryId, InventoryEntry } from '@core/models/inventory.model';
import type { PopoverItem, SortMode } from './inventory-popover.models';
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { lookupBankItem, RGG_ITEM_TYPES } from '@core/data/rgg-items.bank';
import { rarityOfName } from '@core/icons/rgg-icons';
import { parseCategoryId } from '@core/models/inventory.model';
import { IconStore } from '@core/stores/icon.store';
import { InventoryStore } from '@core/stores/inventory.store';
import { SettingsStore } from '@core/stores/settings.store';
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
	private readonly settingsStore = inject(SettingsStore);

	readonly close = output<void>();

	protected readonly query = signal('');

	protected readonly sortMode = signal<SortMode>('category');

	protected readonly sortAsc = signal(true);

	/** Выбранный предмет для детального просмотра (null — сетка). */
	protected readonly selectedEntry = signal<InventoryEntry | null>(null);

	/** Категория выбранного предмета (для иконки спецроллов и группировки). */
	protected readonly selectedCategory = signal<InventoryCategoryId | null>(null);

	protected readonly playerName = computed(() => this.inventoryStore.data()?.player ?? 'Инвентарь');

	/** Показывать типы предметов / заметки — из настроек источника. */
	protected readonly showItemTypes = this.settingsStore.settings().sources.rggland.showItemTypes;

	protected readonly showNotes = this.settingsStore.settings().sources.rggland.showNotes;

	/** Иконка выбранного предмета. */
	protected readonly selectedIcon = computed(() => {
		const entry = this.selectedEntry();
		return entry ? this.iconStore.resolveIcon(entry, this.selectedCategory() ?? undefined) : null;
	});

	/** Тип предмета: из банка RGG (если источник не дал); спецроллы — «Спецролл». */
	protected readonly selectedType = computed(() => {
		const entry = this.selectedEntry();
		if (!entry) {
			return '';
		}
		const categoryId = this.selectedCategory();
		if (categoryId === 'specials') {
			return 'Спецролл';
		}
		return entry.type ?? lookupBankItem(entry.name)?.type ?? '';
	});

	/** Описание выбранного предмета: вторичный текст из источника, иначе эффект из банка. */
	protected readonly selectedDescription = computed(() => {
		const entry = this.selectedEntry();
		if (!entry) {
			return '';
		}
		return (entry.description?.trim() ?? '').trim();
	});

	/** Эффект предмета (что даёт): описание из банка без префикса типа. */
	protected readonly selectedEffect = computed(() => {
		const entry = this.selectedEntry();
		if (!entry) {
			return '';
		}
		const categoryId = this.selectedCategory();
		if (categoryId === 'specials') {
			return entry.note ?? '';
		}
		const raw = (entry.description ?? lookupBankItem(entry.name)?.description ?? '').trim();
		if (!raw) {
			return '';
		}
		const dot = raw.indexOf('.');
		return dot >= 0 ? raw.slice(dot + 1).trim() : raw;
	});

	/** Раритет выбранного предмета (по названию; спецроллы — без раритета). */
	protected readonly selectedRarity = computed(() => {
		const entry = this.selectedEntry();
		if (!entry || this.selectedCategory() === 'specials') {
			return null;
		}
		return rarityOfName(entry.name);
	});

	/** Все предметы (с иконками) после поиска и сортировки. */
	protected readonly items = computed<PopoverItem[]>(() => {
		const q = this.query().trim().toLowerCase();
		const mode = this.sortMode();
		const asc = this.sortAsc();
		const showNotes = this.showNotes;

		const all: PopoverItem[] = this.inventoryStore.entries().flatMap((category) =>
			category.entries.map((entry) => ({
				entry,
				icon: this.iconStore.resolveIcon(entry, category.id),
				categoryId: category.id,
				hideNote: !showNotes,
			})),
		);

		const matches = (item: PopoverItem): boolean => {
			const note = showNotes ? (item.entry.note?.toLowerCase() ?? '') : '';
			const description = item.entry.description?.toLowerCase() ?? '';
			return (
				item.entry.name.toLowerCase().includes(q) || note.includes(q) || description.includes(q)
			);
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
		const byType = this.showItemTypes;
		const groups: { id: string; label: string; items: PopoverItem[] }[] = [];

		// Группируем «Обычные предметы» по типам, остальные категории — целиком.
		const rest = new Map<string, PopoverItem[]>();
		const typed = new Map<string, PopoverItem[]>();
		for (const item of this.items()) {
			const target = byType && item.categoryId === 'items' ? typed : rest;
			const list = target.get(item.categoryId) ?? [];
			list.push(item);
			target.set(item.categoryId, list);
		}

		if (byType) {
			const byTypeName = new Map<string, PopoverItem[]>();
			for (const item of typed.get('items') ?? []) {
				const key = item.entry.type ?? 'Предмет';
				const list = byTypeName.get(key) ?? [];
				list.push(item);
				byTypeName.set(key, list);
			}
			for (const type of RGG_ITEM_TYPES) {
				const list = byTypeName.get(type);
				if (list?.length) {
					groups.push({ id: `items:${type}`, label: type, items: list });
				}
			}
			// Предметы с типом, который не попал в известный список.
			for (const [type, list] of byTypeName) {
				if (!groups.some((group) => group.id === `items:${type}`)) {
					groups.push({ id: `items:${type}`, label: type, items: list });
				}
			}
		} else {
			for (const [id, list] of typed) {
				rest.set(id, list);
			}
		}

		for (const [id, list] of rest) {
			groups.push({
				id,
				label: CATEGORY_LABEL[id] ?? id,
				items: list,
			});
		}
		return groups.filter((group) => group.items.length > 0);
	});

	protected readonly totalCount = computed(() => this.items().length);

	protected onSelectItem(entry: InventoryEntry): void {
		this.selectedCategory.set(listCategoryOf(entry, this.items()));
		this.selectedEntry.set(entry);
	}

	protected closeDetails(): void {
		this.selectedEntry.set(null);
		this.selectedCategory.set(null);
	}

	protected onClose(): void {
		this.close.emit();
	}
}

/** Категория записи в текущем (отфильтрованном) списке предметов. */
function listCategoryOf(entry: InventoryEntry, items: PopoverItem[]): InventoryCategoryId | null {
	const raw = items.find((item) => item.entry.id === entry.id)?.categoryId;
	return raw ? parseCategoryId(raw) : null;
}