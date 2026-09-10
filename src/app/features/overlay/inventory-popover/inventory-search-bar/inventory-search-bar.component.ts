import type { SortMode } from '../inventory-popover.models';
import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';

@Component({
	selector: 'app-inventory-search-bar',
	imports: [TuiButton, TuiTextfield],
	templateUrl: './inventory-search-bar.component.html',
	styleUrl: './inventory-search-bar.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventorySearchBarComponent {
	readonly query = model('');

	readonly sortMode = model<SortMode>('category');

	readonly sortAsc = model(true);

	protected onSortClick(mode: SortMode): void {
		if (this.sortMode() === mode) {
			this.sortAsc.update((value) => !value);
		} else {
			this.sortMode.set(mode);
			this.sortAsc.set(true);
		}
	}
}