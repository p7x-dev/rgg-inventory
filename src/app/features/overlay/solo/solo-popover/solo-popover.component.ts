import type { SoloCategory, SoloRow } from '@core/models/solo.model';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { GameInfoStore, normalizeGameKey } from '@core/stores/game-info.store';
import { SoloGameDetailsComponent } from './solo-game-details/solo-game-details.component';
import { SoloGameListComponent } from './solo-game-list/solo-game-list.component';

/**
 * Попап платформы Solo RGG (умный): список игр → детальный вид.
 * Управляет выбором игры и подгрузкой информации (Википедия + RAWG).
 */
@Component({
	selector: 'app-solo-popover',
	imports: [SoloGameDetailsComponent, SoloGameListComponent],
	templateUrl: './solo-popover.component.html',
	styleUrl: './solo-popover.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoloPopoverComponent {
	readonly category = input.required<SoloCategory>();

	readonly close = output<void>();

	private readonly gameInfoStore = inject(GameInfoStore);

	protected readonly platform = computed(() => this.category().platform);

	protected readonly rows = computed<SoloRow[]>(() => this.category().rows);

	protected readonly currentGame = computed(() => this.category().current?.game ?? null);

	protected readonly stats = computed(() => this.category().stats);

	/** Игра, открытая в детальном виде (null — список). */
	protected readonly selectedRow = signal<SoloRow | null>(null);

	protected readonly selectedIsCurrent = computed(
		() => this.selectedRow()?.game === this.currentGame(),
	);

	/** Информация об игре (по имени выбранной игры). */
	protected readonly gameInfo = computed(() => {
		const row = this.selectedRow();
		if (!row) {
			return null;
		}
		return this.gameInfoStore.byName()[normalizeGameKey(row.game)] ?? null;
	});

	protected onSelectRow(row: SoloRow): void {
		this.selectedRow.set(row);
		void this.gameInfoStore.load(row.game);
	}

	protected onBack(): void {
		this.selectedRow.set(null);
	}

	protected onClose(): void {
		this.close.emit();
	}
}