import type { InventoryEntry } from '@core/models/inventory.model';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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

	protected readonly title = computed(() =>
		this.entry().note ? `${this.entry().name} — ${this.entry().note}` : this.entry().name,
	);
}