import type { SoloCategory, SoloPlatform, SoloRow } from '@core/models/solo.model';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { SOLO_ACTION_LABEL, soloPlatformShortName } from '@core/models/solo.model';
import { TuiButton } from '@taiga-ui/core';

/**
 * Попап платформы Solo RGG: список игр с действием и причиной.
 * Клик по игре открывает детальный вид (статус, причина, описание).
 */
@Component({
	selector: 'app-solo-popover',
	imports: [TuiButton],
	templateUrl: './solo-popover.component.html',
	styleUrl: './solo-popover.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoloPopoverComponent {
	readonly category = input.required<SoloCategory>();

	readonly close = output<void>();

	protected readonly platform = computed<SoloPlatform>(() => this.category().platform);

	protected readonly shortName = computed(() => soloPlatformShortName(this.platform()));

	protected readonly rows = computed<SoloRow[]>(() => this.category().rows);

	protected readonly currentGame = computed(() => this.category().current?.game ?? null);

	protected readonly stats = computed(() => this.category().stats);

	protected readonly actionLabel = SOLO_ACTION_LABEL;

	/** Игра, открытая в детальном виде (null — список). */
	protected readonly selectedRow = signal<SoloRow | null>(null);

	protected readonly selectedIsCurrent = computed(() => this.selectedRow()?.game === this.currentGame());

	protected onSelectRow(row: SoloRow): void {
		this.selectedRow.set(row);
	}

	protected onBack(): void {
		this.selectedRow.set(null);
	}

	protected onClose(): void {
		this.close.emit();
	}
}