import type { SlotItem } from '@core/models/overlay.model';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Слот инвентаря: чисто презентационный атом. */
@Component({
	selector: 'app-inventory-slot',
	templateUrl: './inventory-slot.component.html',
	styleUrl: './inventory-slot.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventorySlotComponent {
	readonly content = input<SlotItem>(null);

	/** Текстура слота (в режиме дизайна из картинки). */
	readonly texture = input<string | null>(null);

	/** Постоянная подсветка «выбранного» слота (видна и без курсора, напр. в OBS). */
	readonly selected = input(false);

	/** Клик по слоту (только непустому). */
	readonly select = output<void>();

	protected readonly backgroundImage = computed(() => {
		const texture = this.texture();
		return texture ? `url("${texture}")` : null;
	});

	protected readonly label = computed(() => {
		const content = this.content();
		if (!content) {
			return '';
		}
		const note = content.entry.note ? ` — ${content.entry.note}` : '';
		return `${content.entry.name}${note}`;
	});

	/** Показывать ли стилизованный тултип (есть имя/описание/заметка/количество). */
	protected readonly tooltip = computed(() => {
		const content = this.content();
		if (!content) {
			return false;
		}
		return Boolean(content.entry.name || content.entry.description || content.entry.note || content.entry.quantity);
	});

	protected readonly fallbackText = computed(() => {
		const content = this.content();
		return content ? content.entry.name.charAt(0).toUpperCase() : '';
	});

	protected readonly quantity = computed(() => {
		const content = this.content();
		return Math.max(1, content?.entry.quantity ?? 1);
	});

	protected onClick(): void {
		if (this.content()) {
			this.select.emit();
		}
	}
}
