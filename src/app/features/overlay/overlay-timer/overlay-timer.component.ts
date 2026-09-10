import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SettingsStore } from '@core/stores/settings.store';
import { TimerStore } from '@core/stores/timer.store';
import { TuiButton } from '@taiga-ui/core';
import { TimerDisplayComponent } from './timer-display/timer-display.component';

/** Виджет таймера оверлея: дисплей + локальные кнопки пуска/сброса. */
@Component({
	selector: 'app-overlay-timer',
	imports: [TimerDisplayComponent, TuiButton],
	templateUrl: './overlay-timer.component.html',
	styleUrl: './overlay-timer.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayTimerComponent {
	private readonly settingsStore = inject(SettingsStore);
	private readonly timerStore = inject(TimerStore);

	protected readonly snapshot = this.timerStore.snapshot;

	protected readonly displayMs = this.timerStore.displayMs;

	protected readonly parts = computed(() => this.settingsStore.settings().timer.display);

	protected toggle(): void {
		this.timerStore.toggle();
	}

	protected reset(): void {
		this.timerStore.reset();
	}
}