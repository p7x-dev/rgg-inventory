import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Строка настройки цвета: свотч + нативный color-picker. */
@Component({
	selector: 'app-settings-color',
	imports: [],
	templateUrl: './settings-color.component.html',
	styleUrl: './settings-color.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsColorComponent {
	readonly value = input.required<string>();

	readonly label = input('');

	readonly hint = input('');

	readonly valueChange = output<string>();

	protected onInput(event: Event): void {
		const target = event.target as HTMLInputElement;
		if (target.value && target.value !== this.value()) {
			this.valueChange.emit(target.value);
		}
	}
}