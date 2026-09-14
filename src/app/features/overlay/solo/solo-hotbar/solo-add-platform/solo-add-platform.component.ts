import type { SoloPlatform } from '@core/models/solo.model';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TuiButton, TuiDataList, TuiDropdown, TuiDropdownOpen, TuiOption } from '@taiga-ui/core';

/** Кнопка добавления доп. платформы в нижний ряд соло-хотбара (dumb). */
@Component({
	selector: 'app-solo-add-platform',
	imports: [TuiButton, TuiDataList, TuiDropdown, TuiDropdownOpen, TuiOption],
	templateUrl: './solo-add-platform.component.html',
	styleUrl: './solo-add-platform.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoloAddPlatformComponent {
	readonly platforms = input.required<readonly string[]>();

	readonly platformAdd = output<SoloPlatform>();

	protected readonly dropdownOpen = signal(false);

	protected select(platform: string): void {
		this.dropdownOpen.set(false);
		this.platformAdd.emit(platform as SoloPlatform);
	}
}