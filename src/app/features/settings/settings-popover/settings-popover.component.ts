import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { AppSettingsComponent } from '@app/features/settings/app-settings/app-settings.component';
import { IconSettingsComponent } from '@app/features/settings/icon-settings/icon-settings.component';
import { OverlaySettingsComponent } from '@app/features/settings/overlay-settings/overlay-settings.component';
import { SourceSettingsComponent } from '@app/features/settings/source-settings/source-settings.component';
import { ThemeSettingsComponent } from '@app/features/settings/theme-settings/theme-settings.component';
import { TimerSettingsComponent } from '@app/features/settings/timer-settings/timer-settings.component';
import { SettingsHeaderComponent } from './settings-header/settings-header.component';
import { SettingsSectionComponent } from './settings-section/settings-section.component';

/**
 * Полноэкранная панель настроек оверлея.
 * Открывается в дропдауне Taiga над кнопкой настройки; сам хвост-стрелку к кнопке
 * рисует глобальный TailDropdownComponent (см. app.config),
 * направление он определяет автоматически.
 */
@Component({
	selector: 'app-settings-popover',
	imports: [
		AppSettingsComponent,
		IconSettingsComponent,
		OverlaySettingsComponent,
		SettingsHeaderComponent,
		SettingsSectionComponent,
		SourceSettingsComponent,
		ThemeSettingsComponent,
		TimerSettingsComponent,
	],
	templateUrl: './settings-popover.component.html',
	styleUrl: './settings-popover.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPopoverComponent {
	readonly close = output<void>();

	protected onClose(): void {
		this.close.emit();
	}
}