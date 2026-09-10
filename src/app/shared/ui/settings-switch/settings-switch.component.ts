import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiSwitch } from '@taiga-ui/kit';

/**
 * Строка-переключатель настроек (tui-switch + подпись).
 * tuiSwitch/tuiRadio рендерят host-бэйндинг `disabled: !control || control.disabled`,
 * поэтому обязателен NG_CONTROL: иначе свитч всегда disabled. Синхронизация — из входа
 * `checked` в FormControl (без коммита loop'а), эмитт наружу — через control.valueChanges.
 */
@Component({
	selector: 'app-settings-switch',
	imports: [TuiSwitch, ReactiveFormsModule],
	templateUrl: './settings-switch.component.html',
	styleUrl: './settings-switch.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSwitchComponent {
	readonly checked = input.required<boolean>();

	readonly label = input('');

	readonly hint = input('');

	readonly checkedChange = output<boolean>();

	protected readonly control = new FormControl<boolean>(false);

	private readonly destroyRef = inject(DestroyRef);

	constructor() {
		effect(() => {
			const value = this.checked();
			if ((this.control.value ?? false) !== value) {
				this.control.setValue(value, { emitEvent: false });
			}
		});
		this.control.valueChanges
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((value) => this.checkedChange.emit(value ?? false));
	}
}