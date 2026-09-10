import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';

@Component({
	selector: 'app-overlay-header',
	imports: [TuiIcon],
	templateUrl: './overlay-header.component.html',
	styleUrl: './overlay-header.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayHeaderComponent {
	readonly title = input.required<string>();

	readonly coins = input(0);

	readonly tears = input(0);

	readonly showCurrencies = input(true);

	readonly coinIcon = input<string | null>(null);

	readonly tearIcon = input<string | null>(null);

	protected readonly coinsText = computed(() => formatNumber(this.coins()));

	protected readonly tearsText = computed(() => formatNumber(this.tears()));
}

function formatNumber(value: number): string {
	return new Intl.NumberFormat('ru-RU').format(value);
}
