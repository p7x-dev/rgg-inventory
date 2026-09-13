import type { AppMode } from '@core/models/settings.model';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SettingsStore } from '@core/stores/settings.store';
import { TuiButton } from '@taiga-ui/core';

export interface ModeOption {
	id: AppMode;
	label: string;
}

export const MODE_OPTIONS: readonly ModeOption[] = [
	{ id: 'rggland', label: 'RGG Land' },
	{ id: 'solo', label: 'Solo RGG' },
];

@Component({
	selector: 'app-mode-settings',
	imports: [TuiButton],
	templateUrl: './mode-settings.component.html',
	styleUrl: './mode-settings.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeSettingsComponent {
	private readonly settingsStore = inject(SettingsStore);

	protected readonly options = MODE_OPTIONS;

	protected readonly activeMode = computed(() => this.settingsStore.mode());

	protected setMode(mode: AppMode): void {
		if (mode !== this.settingsStore.mode()) {
			this.settingsStore.setMode(mode);
		}
	}
}