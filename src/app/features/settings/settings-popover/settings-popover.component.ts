import { ChangeDetectionStrategy, Component, computed, effect, inject, output } from '@angular/core';
import { AppSettingsComponent } from '@app/features/settings/app-settings/app-settings.component';
import { IconSettingsComponent } from '@app/features/settings/icon-settings/icon-settings.component';
import { OverlaySettingsComponent } from '@app/features/settings/overlay-settings/overlay-settings.component';
import { SourceSettingsComponent } from '@app/features/settings/source-settings/source-settings.component';
import { ThemeSettingsComponent } from '@app/features/settings/theme-settings/theme-settings.component';
import { TimerSettingsComponent } from '@app/features/settings/timer-settings/timer-settings.component';
import { SettingsNavigationService } from '@core/services/settings-navigation.service';
import { SettingsHeaderComponent } from './settings-header/settings-header.component';
import { SettingsSectionComponent } from './settings-section/settings-section.component';

/** DOM-идентификатор секции «Приложение», к которой скроллит уведомление о скачивании. */
export const APP_SETTINGS_SECTION_ID = 'settings-section-app';

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
	private readonly settingsNavigation = inject(SettingsNavigationService);

	readonly close = output<void>();

	/** DOM-идентификатор секции «Приложение» для прокрутки из уведомления. */
	protected readonly appSectionId = APP_SETTINGS_SECTION_ID;

	/** Раскрыта ли секция «Приложение» (по запросу уведомления о скачивании). */
	protected readonly appSectionOpen = computed(
		() => this.settingsNavigation.appSectionVersion() > 0,
	);

	constructor() {
		// Секция рендерится внутри дропдауна; ждём открытия и прокручиваем к ней.
		effect(() => {
			if (!this.appSectionOpen()) {
				return;
			}
			setTimeout(() => {
				document.getElementById(APP_SETTINGS_SECTION_ID)?.scrollIntoView({
					behavior: 'smooth',
					block: 'start',
				});
			}, 60);
		});
	}

	protected onClose(): void {
		this.close.emit();
	}
}