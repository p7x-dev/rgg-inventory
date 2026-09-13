import { ChangeDetectionStrategy, Component, computed, effect, inject, output } from '@angular/core';
import { AppSettingsComponent } from '@app/features/settings/app-settings/app-settings.component';
import { IconSettingsComponent } from '@app/features/settings/icon-settings/icon-settings.component';
import { ModeSettingsComponent } from '@app/features/settings/mode-settings/mode-settings.component';
import { OverlaySettingsComponent } from '@app/features/settings/overlay-settings/overlay-settings.component';
import { SourceSettingsComponent } from '@app/features/settings/source-settings/source-settings.component';
import { ThemeSettingsComponent } from '@app/features/settings/theme-settings/theme-settings.component';
import { TimerSettingsComponent } from '@app/features/settings/timer-settings/timer-settings.component';
import { SettingsNavigationService } from '@core/services/settings-navigation.service';
import { SettingsHeaderComponent } from './settings-header/settings-header.component';
import { SettingsSectionComponent } from './settings-section/settings-section.component';

/** DOM-идентификатор секции «Приложение», к которой скроллит уведомление о скачивании. */
export const APP_SETTINGS_SECTION_ID = 'settings-section-app';

/** Находим ближайший прокручиваемый предок (для Taiga tui-scrollbar). */
function findScrollContainer(el: Element): HTMLElement {
	let node: HTMLElement | null = el as HTMLElement;
	while (node) {
		const style = window.getComputedStyle(node);
		const overflowY = style.overflowY;
		if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
			return node;
		}
		node = node.parentElement;
	}
	return document.documentElement;
}

@Component({
	selector: 'app-settings-popover',
	imports: [
		AppSettingsComponent,
		IconSettingsComponent,
		ModeSettingsComponent,
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

	protected readonly appSectionId = APP_SETTINGS_SECTION_ID;

	protected readonly appSectionOpen = computed(
		() => this.settingsNavigation.appSectionVersion() > 0,
	);

	constructor() {
		// Прокручиваем dropdown к секции «Приложение» с повторными попытками (Taiga dropdown рендерится с задержкой).
		effect(() => {
			if (!this.appSectionOpen()) {
				return;
			}
			void this.scrollToAppSection(0);
		});
	}

	private scrollToAppSection(attempt: number): void {
		const el = document.getElementById(APP_SETTINGS_SECTION_ID);
		if (el) {
			const scroller = findScrollContainer(el);
			const scrollerRect = scroller.getBoundingClientRect();
			const elRect = el.getBoundingClientRect();
			scroller.scrollTop += elRect.top - scrollerRect.top - 8;
			return;
		}
		if (attempt < 10) {
			setTimeout(() => this.scrollToAppSection(attempt + 1), 80);
		}
	}

	protected onClose(): void {
		this.close.emit();
	}
}