import type { TuiContext } from '@taiga-ui/cdk';
import type { PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';
import { OverlayTimerComponent } from '@app/features/overlay/overlay-timer/overlay-timer.component';
import { ReleaseStore } from '@core/stores/release.store';
import { TuiButton, TuiDropdown, TuiDropdownOpen } from '@taiga-ui/core';

/** Кнопки управления баром: таймер, инвентарь, настройки. */
@Component({
	selector: 'app-bar-controls',
	imports: [OverlayTimerComponent, TuiButton, TuiDropdown, TuiDropdownOpen],
	templateUrl: './bar-controls.component.html',
	styleUrl: './bar-controls.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarControlsComponent {
	protected readonly releaseStore = inject(ReleaseStore);

	readonly showTimer = input(false);

	readonly showObs = input(true);

	/** Показывать кнопку скачивания приложения. Только на главной странице. */
	readonly showDownload = input(false);

	readonly settingsMenu = input.required<PolymorpheusContent<TuiContext<() => void>>>();

	readonly settingsOpen = model(false);

	readonly inventoryClick = output<void>();

	readonly obsClick = output<void>();

	protected onDownload(): void {
		const url = this.releaseStore.downloadUrl();
		if (!url) {
			return;
		}
		window.open(url, '_blank', 'noopener');
	}
}