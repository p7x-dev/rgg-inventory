import type { HotbarSlotView } from '@core/hotbar/hotbar-slots';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { encodeHotbarDrag } from '@core/hotbar/hotbar-slots';

/** Слот хотбара: категория (иконка + количество) или закреплённый предмет. */
@Component({
	selector: 'app-hotbar-slot',
	templateUrl: './hotbar-slot.component.html',
	styleUrl: './hotbar-slot.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotbarSlotComponent {
	readonly view = input<HotbarSlotView | null>(null);

	readonly index = input.required<number>();

	/** Подсветка перетаскивания (drag-over) — управляет контейнер хотбара. */
	readonly dragOver = input(false);

	/** Клик правой кнопкой: сброс слота к категории по умолчанию. */
	readonly slotReset = output<number>();

	protected readonly tooltip = computed(() => {
		const slot = this.view();
		return slot ? `${slot.label} · ${slot.count}` : '';
	});

	protected readonly draggable = computed(() => this.view()?.slot?.kind === 'item');

	/** Оригинал перетаскивания слота (предмет можно перетащить в другой слот). */
	protected readonly dragData = computed(() => {
		const slot = this.view();
		if (slot?.slot && slot.slot.kind === 'item' && slot.resolvedEntry) {
			return encodeHotbarDrag(slot.resolvedEntry);
		}
		return '';
	});

	protected onDragStart(event: DragEvent): void {
		if (!this.dragData()) {
			event.preventDefault();
			return;
		}
		event.dataTransfer?.setData('application/x-rgg-item', this.dragData());
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'copy';
		}
	}

	protected onReset(): void {
		this.slotReset.emit(this.index());
	}
}