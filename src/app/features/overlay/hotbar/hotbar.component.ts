import type { HotbarDragPayload, HotbarSlotView } from '@core/hotbar/hotbar-slots';
import type { HotbarSlot } from '@core/models/settings.model';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	effect,
	ElementRef,
	inject,
	signal,
} from '@angular/core';
import { buildHotbarSlots, decodeHotbarDrag, HOTBAR_DRAG_MIME } from '@core/hotbar/hotbar-slots';
import { IconStore } from '@core/stores/icon.store';
import { InventoryStore } from '@core/stores/inventory.store';
import { SettingsStore } from '@core/stores/settings.store';
import { HotbarSlotComponent } from './hotbar-slot/hotbar-slot.component';

interface DragFrame {
	top: number;
	left: number;
	width: number;
	height: number;
}

/**
 * Хотбар: сетка cols × rows слотов. По умолчанию слоты = категории инвентаря
 * (иконка категории + количество предметов), остальные ячейки пустые.
 * Перетаскивание предмета из попапа закрепляет его в слоте.
 *
 * Диалог попапа рендерится в CDK-overlay поверх приложения, поэтому на время
 * перетаскивания хотбар поднимается выше backdrop-а (position: fixed с теми же
 * координатами) — события dragover/drop снова попадают на сами слоты.
 */
@Component({
	selector: 'app-hotbar',
	imports: [HotbarSlotComponent],
	templateUrl: './hotbar.component.html',
	styleUrl: './hotbar.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[class.hotbar--raised]': 'dragFrame() !== null',
		'[style.--hotbar-top]': 'dragFrame() ? (dragFrame()!.top + "px") : null',
		'[style.--hotbar-left]': 'dragFrame() ? (dragFrame()!.left + "px") : null',
		'[style.--hotbar-width]': 'dragFrame() ? (dragFrame()!.width + "px") : null',
		'[style.--hotbar-height]': 'dragFrame() ? (dragFrame()!.height + "px") : null',
	},
})
export class HotbarComponent {
	private readonly host = inject(ElementRef<HTMLElement>);
	private readonly inventoryStore = inject(InventoryStore);
	private readonly iconStore = inject(IconStore);
	private readonly settingsStore = inject(SettingsStore);

	/** Индекс подсвеченного слота (drag-over), если перетаскивание над хотбаром. */
	protected readonly dragOverIndex = signal<number | null>(null);

	/** Позиция хотбара во время перетаскивания (поднят над backdrop-ом). */
	protected readonly dragFrame = signal<DragFrame | null>(null);

	protected readonly cols = computed(() => {
		const cols = this.settingsStore.overlay().cols;
		return Math.max(1, Math.min(18, cols));
	});

	protected readonly rows = computed(() => {
		const rows = this.settingsStore.overlay().rows;
		return Math.max(1, Math.min(6, rows));
	});

	/** Сетка слотов фиксированного размера: заполненные + пустые ячейки. */
	protected readonly slots = computed<HotbarSlotView[]>(() => {
		const categories = this.inventoryStore.data()?.categories ?? [];
		const configured = this.settingsStore.overlay().hotbarSlots;
		const views = buildHotbarSlots(
			categories,
			configured,
			(entry) => this.iconStore.resolveIcon(entry),
			(categoryId) => this.iconStore.resolveCategoryIcon(categoryId),
		);
		const total = this.cols() * this.rows();
		if (views.length >= total) {
			return views.slice(0, total);
		}
		const padded: HotbarSlotView[] = views.slice();
		// Пустые слоты (без slot) — отрисовываются рамкой.
		while (padded.length < total) {
			padded.push({ slot: null, icon: null, fallbackText: '', label: '', count: 0, resolvedEntry: null });
		}
		return padded;
	});

	constructor() {
		const destroyRef = inject(DestroyRef);

		// Предмет исчез из инвентаря (или сменили ника/источник) — убираем его
		// слот из конфигурации, иначе слот живёт сам по себе («предмет-призрак»).
		// Очистка только после реальной загрузки данных (data не null),
		// чтобы не стереть слоты в момент первого рендера до получения инвентаря.
		effect(() => {
			if (this.inventoryStore.data() === null) {
				return;
			}
			const liveIds = new Set(
				this.inventoryStore.entries().flatMap((category) => category.entries.map((entry) => entry.id)),
			);
			const configured = this.settingsStore.overlay().hotbarSlots;
			const hasGhost = configured.some(
				(slot) => slot?.kind === 'item' && !liveIds.has(slot.itemId),
			);
			if (!hasGhost) {
				return;
			}
			const next = configured.map((slot) =>
				slot?.kind === 'item' && !liveIds.has(slot.itemId) ? null : slot,
			);
			this.persistSlots(next);
		});

		// Подъём хотбара над backdrop-ом диалога: drag начинается в попапе
		// (CDK overlay), поэтому старт/конец перетаскивания слушаем на document.
		const onDragStart = (event: DragEvent): void => {
			if (!dragInProgress(event)) {
				return;
			}
			const rect = this.host.nativeElement.getBoundingClientRect();
			this.dragFrame.set({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
		};

		const onDragEnd = (): void => {
			this.dragFrame.set(null);
			this.dragOverIndex.set(null);
		};

		document.addEventListener('dragstart', onDragStart);
		document.addEventListener('dragend', onDragEnd);

		// Попадание в слоты слушаем на самом хотбаре: события dragover/drop
		// всплывают от слотов к host, а document-level перехваты (CDK overlay
		// диалога, backdrop) их не крадут.
		const hostElement = this.host.nativeElement;
		hostElement.addEventListener('dragover', this.onDragOver);
		hostElement.addEventListener('drop', this.onDrop);
		hostElement.addEventListener('dragleave', this.onDragLeave);

		destroyRef.onDestroy(() => {
			document.removeEventListener('dragstart', onDragStart);
			document.removeEventListener('dragend', onDragEnd);
			hostElement.removeEventListener('dragover', this.onDragOver);
			hostElement.removeEventListener('drop', this.onDrop);
			hostElement.removeEventListener('dragleave', this.onDragLeave);
		});
	}

	/** Подсветка слота под курсором во время перетаскивания. */
	protected onDragOver = (event: DragEvent): void => {
		if (!dragInProgress(event)) {
			return;
		}
		event.preventDefault();
		this.dragOverIndex.set(this.slotIndexAt(event.clientX, event.clientY));
	};

	/** Сброс подсветки при уходе курсора с хотбара. */
	protected onDragLeave = (): void => {
		this.dragOverIndex.set(null);
	};

	/** Приём предмета в слот. */
	protected onDrop = (event: DragEvent): void => {
		if (!dragInProgress(event)) {
			return;
		}
		event.preventDefault();
		const payload = decodeHotbarDrag(event.dataTransfer);
		this.dragFrame.set(null);
		this.dragOverIndex.set(null);
		if (!payload) {
			return;
		}
		const index = this.slotIndexAt(event.clientX, event.clientY);
		if (index !== null) {
			this.setSlot(index, payload);
		}
	};

	/** Индекс слота хотбара под указанными координатами; null — вне хотбара. */
	private slotIndexAt(clientX: number, clientY: number): number | null {
		const slots = this.host.nativeElement.querySelectorAll('app-hotbar-slot');
		for (let i = 0; i < slots.length; i++) {
			const rect = slots[i].getBoundingClientRect();
			if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
				return i;
			}
		}
		return null;
	}

	protected setSlot(index: number, payload: HotbarDragPayload): void {
		const current = this.slots();
		const currentSlot = current[index]?.slot;
		if (currentSlot?.kind === 'item' && currentSlot.itemId === payload.itemId) {
			return;
		}
		const next: (HotbarSlot | null)[] = current.map((view) => view.slot);
		next[index] = { kind: 'item', itemId: payload.itemId, itemName: payload.itemName };
		this.persistSlots(next);
	}

	protected resetSlot(index: number): void {
		const current = this.slots();
		const currentSlot = current[index]?.slot;
		if (!currentSlot || currentSlot.kind !== 'item') {
			return;
		}
		// Возвращаем слот к категории по умолчанию: убираем закрепление за
		// предметом — далее раскладка строится из категорий без него.
		const next: (HotbarSlot | null)[] = current.map((view) => view.slot);
		next.splice(index, 1);
		this.persistSlots(next);
	}

	private persistSlots(slots: (HotbarSlot | null)[]): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			overlay: { ...current.overlay, hotbarSlots: slots },
		}));
	}
}

function dragInProgress(event: DragEvent): boolean {
	const types = event.dataTransfer?.types;
	if (!types) {
		return false;
	}
	return Array.from(types).includes(HOTBAR_DRAG_MIME);
}