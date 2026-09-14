import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Секция настроек: карточка с заголовком и (опционально) подзаголовком. */
@Component({
	selector: 'app-settings-panel',
	imports: [],
	templateUrl: './settings-panel.component.html',
	styleUrl: './settings-panel.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPanelComponent {
	readonly title = input('');

	readonly subtitle = input('');
}