import type { AppMode } from '@core/models/settings.model';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';

const MODE_OPTIONS: readonly { id: AppMode; label: string }[] = [
	{ id: 'rggland', label: 'RGG Land' },
	{ id: 'solo', label: 'Solo RGG' },
];

/** Переключатель режима оверлея (RGG Land / Solo RGG) — dumb. */
@Component({
	selector: 'app-mode-switch',
	imports: [TuiButton],
	templateUrl: './mode-switch.component.html',
	styleUrl: './mode-switch.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeSwitchComponent {
	readonly mode = input.required<AppMode>();

	readonly modeChange = output<AppMode>();

	protected readonly options = MODE_OPTIONS;

	protected selectMode(mode: AppMode): void {
		if (mode !== this.mode()) {
			this.modeChange.emit(mode);
		}
	}
}