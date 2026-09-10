import type { PopoverItem } from '../inventory-popover.models';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InventoryItemCardComponent } from '../inventory-item-card/inventory-item-card.component';

@Component({
	selector: 'app-inventory-category-group',
	imports: [InventoryItemCardComponent],
	templateUrl: './inventory-category-group.component.html',
	styleUrl: './inventory-category-group.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryCategoryGroupComponent {
	readonly label = input.required<string>();

	readonly items = input.required<PopoverItem[]>();
}