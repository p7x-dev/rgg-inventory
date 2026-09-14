import type { SlotItem } from '@core/models/overlay.model';
import type { DesignLayout } from '@core/models/theme.model';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { InventorySlotComponent } from '@app/features/overlay/inventory-slot/inventory-slot.component';
import { range } from '@core/utils/number.util';

/** Позиционированный слот в режиме «дизайн из картинки». */
interface PositionedSlot {
	leftPercent: number;
	topPercent: number;
	widthPercent: number;
	heightPercent: number;
	texture: string;
	index: number;
}

@Component({
	selector: 'app-inventory-board',
	imports: [InventorySlotComponent],
	templateUrl: './inventory-board.component.html',
	styleUrl: './inventory-board.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryBoardComponent {
	readonly items = input<SlotItem[]>([]);

	readonly designMode = input(false);

	readonly design = input<DesignLayout | null>(null);

	readonly cols = input(9);

	readonly visibleRows = input(2);

	/** Индекс выбранного слота в плоском списке (по рядам), если есть. */
	readonly selectedIndex = input<number | null>(null);

	/** Клик по непустому слоту; индекс в плоском списке. */
	readonly slotSelect = output<number>();

	protected readonly rowIndexes = computed(() => range(this.visibleRows()));

	protected readonly colIndexes = computed(() => range(this.cols()));

	protected readonly aspectRatio = computed(() => {
		const design = this.design();
		return design ? `${design.imageWidth} / ${design.imageHeight}` : 'auto';
	});

	protected readonly positionedSlots = computed<PositionedSlot[]>(() => {
		const design = this.design();
		if (!design) {
			return [];
		}
		return design.slots.map((slot, index) => ({
			leftPercent: (slot.x / design.imageWidth) * 100,
			topPercent: (slot.y / design.imageHeight) * 100,
			widthPercent: (slot.width / design.imageWidth) * 100,
			heightPercent: (slot.height / design.imageHeight) * 100,
			texture: slot.texture,
			index,
		}));
	});

	protected itemAt(row: number, col: number): SlotItem {
		const index = row * this.cols() + col;
		return this.items()[index] ?? null;
	}

	protected designItemAt(index: number): SlotItem {
		return this.items()[index] ?? null;
	}

	protected slotIndexAt(row: number, col: number): number {
		return row * this.cols() + col;
	}

	protected onSlotSelect(row: number, col: number): void {
		const index = this.slotIndexAt(row, col);
		if (this.itemAt(row, col)) {
			this.slotSelect.emit(index);
		}
	}

	protected onDesignSlotSelect(index: number): void {
		if (this.designItemAt(index)) {
			this.slotSelect.emit(index);
		}
	}
}
