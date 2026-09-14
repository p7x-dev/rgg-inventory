import type { SoloRow } from '@core/models/solo.model';
import type { GameInfoEntry } from '@core/stores/game-info.store';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SOLO_ACTION_LABEL } from '@core/models/solo.model';
import { TuiButton, TuiLink } from '@taiga-ui/core';

/**
 * Детальный вид игры Solo RGG (dumb). Статус, причина, описание из таблицы
 * и информация об игре: описание из Википедии + обложка/скриншоты с RAWG.
 */
@Component({
	selector: 'app-solo-game-details',
	imports: [TuiButton, TuiLink],
	templateUrl: './solo-game-details.component.html',
	styleUrl: './solo-game-details.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoloGameDetailsComponent {
	readonly row = input.required<SoloRow>();

	/** Игра сейчас на платформе (бейдж «сейчас»). */
	readonly isCurrent = input(false);

	/** Информация из RAWG (null — ещё не запрашивалась). */
	readonly gameInfo = input<GameInfoEntry | null>(null);

	readonly back = output<void>();

	readonly close = output<void>();

	protected readonly actionLabel = SOLO_ACTION_LABEL;
}