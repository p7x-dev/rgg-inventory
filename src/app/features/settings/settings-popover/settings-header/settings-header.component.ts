import type { AppMode } from '@core/models/settings.model';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { ModeSwitchComponent } from '../mode-switch/mode-switch.component';

/** Заголовок попапа настроек: иконка, название, переключатель режима, кнопка закрытия. */
@Component({
	selector: 'app-settings-header',
	imports: [TuiButton, TuiIcon, ModeSwitchComponent],
	templateUrl: './settings-header.component.html',
	styleUrl: './settings-header.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsHeaderComponent {
	readonly mode = input.required<AppMode>();

	readonly modeChange = output<AppMode>();

	readonly close = output<void>();
}