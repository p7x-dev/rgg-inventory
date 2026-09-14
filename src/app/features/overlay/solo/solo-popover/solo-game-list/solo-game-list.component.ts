import type { SoloPlatform, SoloRow, SoloStats } from '@core/models/solo.model';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SOLO_ACTION_LABEL, soloPlatformShortName } from '@core/models/solo.model';
import { TuiButton } from '@taiga-ui/core';

/**
 * Список игр платформы Solo RGG (dumb). Заголовок с платформой, список,
 * футер со статистикой. Родитель выбирает игру и закрывает попап.
 */
@Component({
	selector: 'app-solo-game-list',
	imports: [TuiButton],
	templateUrl: './solo-game-list.component.html',
	styleUrl: './solo-game-list.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoloGameListComponent {
	readonly platform = input.required<SoloPlatform>();

	readonly rows = input.required<SoloRow[]>();

	readonly currentGame = input<string | null>(null);

	readonly stats = input.required<SoloStats>();

	readonly gameSelect = output<SoloRow>();

	readonly close = output<void>();

	protected readonly shortName = computed(() => soloPlatformShortName(this.platform()));

	protected readonly actionLabel = SOLO_ACTION_LABEL;

	protected onSelect(row: SoloRow): void {
		this.gameSelect.emit(row);
	}

	protected onClose(): void {
		this.close.emit();
	}
}