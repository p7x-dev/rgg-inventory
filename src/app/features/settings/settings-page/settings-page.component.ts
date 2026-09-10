import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { IconSettingsComponent } from '@app/features/settings/icon-settings/icon-settings.component';
import { OverlaySettingsComponent } from '@app/features/settings/overlay-settings/overlay-settings.component';
import { SourceSettingsComponent } from '@app/features/settings/source-settings/source-settings.component';
import { ThemeSettingsComponent } from '@app/features/settings/theme-settings/theme-settings.component';
import { TimerSettingsComponent } from '@app/features/settings/timer-settings/timer-settings.component';
import { SettingsStore } from '@core/stores/settings.store';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

const SETTINGS_TAB = {
	Source: 'source',
	Overlay: 'overlay',
	Theme: 'theme',
	Icons: 'icons',
	Timer: 'timer',
} as const;

type SettingsTabId = (typeof SETTINGS_TAB)[keyof typeof SETTINGS_TAB];

@Component({
	selector: 'app-settings-page',
	imports: [
		TuiButton,
		TuiIcon,
		SourceSettingsComponent,
		OverlaySettingsComponent,
		ThemeSettingsComponent,
		IconSettingsComponent,
		TimerSettingsComponent,
	],
	templateUrl: './settings-page.component.html',
	styleUrl: './settings-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
	private readonly settingsStore = inject(SettingsStore);

	protected readonly activeTab = signal<SettingsTabId>(SETTINGS_TAB.Source);

	protected readonly tabs = Object.values(SETTINGS_TAB);

	protected readonly tabLabels: Record<SettingsTabId, string> = {
		source: 'Источник',
		overlay: 'Оверлей',
		theme: 'Дизайн',
		icons: 'Иконки',
		timer: 'Таймер',
	};

	protected readonly activeSource = this.settingsStore.activeSource;

	protected selectTab(tab: SettingsTabId): void {
		this.activeTab.set(tab);
	}
}
