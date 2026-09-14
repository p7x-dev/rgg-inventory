import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Текст-подсказка в настройках. */
@Component({
	selector: 'app-settings-hint',
	imports: [],
	templateUrl: './settings-hint.component.html',
	styleUrl: './settings-hint.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsHintComponent {}