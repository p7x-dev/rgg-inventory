import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Ряд кнопок/элементов с отступами (Кнопки действий в настройках). */
@Component({
	selector: 'app-settings-actions',
	imports: [],
	templateUrl: './settings-actions.component.html',
	styleUrl: './settings-actions.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsActionsComponent {}