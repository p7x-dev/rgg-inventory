import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

/** Заголовок попапа настроек: иконка, название, кнопка закрытия. */
@Component({
	selector: 'app-settings-header',
	imports: [TuiButton, TuiIcon],
	templateUrl: './settings-header.component.html',
	styleUrl: './settings-header.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsHeaderComponent {
	readonly close = output<void>();
}