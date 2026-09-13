import type { InventoryEntry } from '@core/models/inventory.model';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { encodeHotbarDrag } from '@core/hotbar/hotbar-slots';

@Component({
	selector: 'app-inventory-item-card',
	imports: [],
	templateUrl: './inventory-item-card.component.html',
	styleUrl: './inventory-item-card.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryItemCardComponent {
	readonly entry = input.required<InventoryEntry>();

	readonly icon = input<string | null>(null);

	/** Скрывать заметку записи (настройка «показывать заметки»). */
	readonly hideNote = input(false);

	/** Разрешено ли перетаскивать предмет в хотбар. */
	readonly draggable = input(true);

	readonly selected = output<InventoryEntry>();

	protected readonly title = computed(() =>
		this.hideNote() || !this.entry().note ? this.entry().name : `${this.entry().name} — ${this.entry().note}`,
	);

	/** Полное описание предмета (из банка RGG Land), без префикса типа. */
	protected readonly description = computed(() => {
		const raw = this.entry().description?.trim();
		if (!raw) {
			return '';
		}
		const dot = raw.indexOf('.');
		return dot >= 0 ? raw.slice(dot + 1).trim() : raw;
	});

	protected onSelect(): void {
		this.selected.emit(this.entry());
	}

	protected onDragStart(event: DragEvent): void {
		if (!this.draggable()) {
			return;
		}
		event.dataTransfer?.setData('application/x-rgg-item', encodeHotbarDrag(this.entry()));
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'copy';
		}
	}
}