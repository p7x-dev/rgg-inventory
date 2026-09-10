import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TuiSlider } from '@taiga-ui/core';

/** Слайдер настройки (tui-slider на нативном range). */
@Component({
	selector: 'app-settings-slider',
	imports: [TuiSlider],
	templateUrl: './settings-slider.component.html',
	styleUrl: './settings-slider.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSliderComponent {
	readonly value = input.required<number>();

	readonly label = input('');

	readonly min = input(1);

	readonly max = input(100);

	readonly step = input(1);

	readonly unit = input('');

	readonly valueChange = output<number>();

	protected onInput(event: Event): void {
		const target = event.target as HTMLInputElement;
		const next = target.value === '' ? null : Number(target.value);
		if (next !== null && next !== this.value()) {
			this.valueChange.emit(next);
		}
	}
}