import type { SoloCategory } from '@core/models/solo.model';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { GameInfoStore, normalizeGameKey } from '@core/stores/game-info.store';
import { TuiLink } from '@taiga-ui/core';

/**
 * Виджет информации об игре (умный): платформа + текущая игра + обложка
 * и описание (Википедия, fallback RAWG). Работает по категории соло-платформы.
 */
@Component({
	selector: 'app-game-info-widget',
	imports: [TuiLink],
	templateUrl: './game-info-widget.component.html',
	styleUrl: './game-info-widget.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameInfoWidgetComponent {
	private readonly gameInfoStore = inject(GameInfoStore);

	readonly category = input<SoloCategory | null>(null);

	/** Автоматически подгружать информацию при показе (иначе — по клику). */
	readonly autoload = input(true);

	/** Текущая игра категории. */
	protected readonly current = computed(() => this.category()?.current ?? null);

	/** Загруженная информация об игре (по имени текущей игры). */
	protected readonly gameInfo = computed(() => {
		const game = this.current()?.game;
		if (!game) {
			return null;
		}
		return this.gameInfoStore.byName()[normalizeGameKey(game)] ?? null;
	});

	constructor() {
		effect(() => {
			if (!this.autoload()) {
				return;
			}
			const game = this.current()?.game;
			if (game) {
				void this.gameInfoStore.load(game);
			}
		});
	}

	protected load(): void {
		const game = this.current()?.game;
		if (game) {
			void this.gameInfoStore.load(game);
		}
	}
}