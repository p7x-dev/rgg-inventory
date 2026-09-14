import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Ряд чипов/кнопок-вариантов с переносом (Выбор режима/пресета). */
@Component({
	selector: 'app-settings-preset-row',
	imports: [],
	templateUrl: './settings-preset-row.component.html',
	styleUrl: './settings-preset-row.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPresetRowComponent {}