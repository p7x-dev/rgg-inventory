import type { TimerCountdown, TimerDisplayParts, TimerMode } from '@core/models/settings.model';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SettingsStore } from '@core/stores/settings.store';
import { formatElapsed, TimerStore } from '@core/stores/timer.store';
import { hmsToMs } from '@core/timer/timer-format';
import { SettingsSwitchComponent } from '@shared/ui/settings-switch/settings-switch.component';
import { TuiButton, TuiInput, TuiTextfield } from '@taiga-ui/core';

/** Быстрые пресеты формата дисплея таймера. */
const FORMAT_PRESETS: readonly { id: string; label: string; parts: TimerDisplayParts }[] = [
	{ id: 'basic', label: 'ЧЧ:ММ:СС', parts: { hours: true, minutes: true, seconds: true, mills: false } },
	{ id: 'mmss', label: 'ММ:СС', parts: { hours: false, minutes: true, seconds: true, mills: false } },
	{ id: 'ss', label: 'СС', parts: { hours: false, minutes: false, seconds: true, mills: false } },
	{ id: 'ssmmm', label: 'СС.МММ', parts: { hours: false, minutes: false, seconds: true, mills: true } },
];

const PART_LABELS: readonly { key: keyof TimerDisplayParts; label: string }[] = [
	{ key: 'hours', label: 'Часы' },
	{ key: 'minutes', label: 'Минуты' },
	{ key: 'seconds', label: 'Секунды' },
	{ key: 'mills', label: 'Миллисекунды' },
];

function partsEqual(a: TimerDisplayParts, b: TimerDisplayParts): boolean {
	return a.hours === b.hours && a.minutes === b.minutes && a.seconds === b.seconds && a.mills === b.mills;
}

@Component({
	selector: 'app-timer-settings',
	imports: [TuiButton, TuiInput, TuiTextfield, SettingsSwitchComponent],
	templateUrl: './timer-settings.component.html',
	styleUrl: './timer-settings.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerSettingsComponent {
	private readonly settingsStore = inject(SettingsStore);
	private readonly timerStore = inject(TimerStore);

	protected readonly timer = this.settingsStore.settings;

	protected readonly snapshot = this.timerStore.snapshot;

	protected readonly presets = FORMAT_PRESETS;

	protected readonly partLabels = PART_LABELS;

	protected readonly display = computed(() => this.timer().timer.display);

	protected readonly activePreset = computed(() => {
		const current = this.display();
		return this.presets.find((preset) => partsEqual(preset.parts, current))?.id ?? null;
	});

	protected readonly formatted = computed(() => formatElapsed(this.timerStore.displayMs(), this.display()));

	protected readonly countdown = computed(() => this.timer().timer.countdown);

	protected readonly syncStatus = signal<'idle' | 'loading' | 'ok' | 'error'>('idle');

	protected readonly syncMessage = signal('');

	protected setLocalName(value: string): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			timer: { ...current.timer, localName: value },
		}));
		this.timerStore.setName(value);
	}

	protected setBotEnabled(value: boolean): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			timer: { ...current.timer, bot: { ...current.timer.bot, enabled: value } },
		}));
	}

	protected setBotNick(value: string): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			timer: { ...current.timer, bot: { ...current.timer.bot, nick: value } },
		}));
	}

	protected setBotTimerName(value: string): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			timer: { ...current.timer, bot: { ...current.timer.bot, timerName: value } },
		}));
	}

	protected setParts(value: TimerDisplayParts): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			timer: { ...current.timer, display: { ...value } },
		}));
	}

	protected setPart(key: keyof TimerDisplayParts, enabled: boolean): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			timer: { ...current.timer, display: { ...current.timer.display, [key]: enabled } },
		}));
	}

	protected setMode(mode: TimerMode): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			timer: { ...current.timer, mode },
		}));
		this.timerStore.setMode(mode);
	}

	protected setCountdownPart(key: keyof TimerCountdown, value: number): void {
		const clampPart =
			key === 'hours'
				? (value: number): number => Math.min(999, Math.max(0, Math.floor(value)))
				: (value: number): number => Math.min(59, Math.max(0, Math.floor(value)));
		const clamped = clampPart(value);
		const next = { ...this.countdown(), [key]: clamped };
		this.settingsStore.updateWith((current) => ({
			...current,
			timer: { ...current.timer, countdown: next },
		}));
		const { hours, minutes, seconds } = next;
		this.timerStore.setCountdown(hmsToMs(hours, minutes, seconds));
	}

	protected useCountdownNow(): void {
		this.timerStore.resetCountdown();
		this.timerStore.setMode('countdown');
	}

	protected parseNumeric(event: Event): number {
		const input = event.target;
		if (!(input instanceof HTMLInputElement)) {
			return 0;
		}
		const parsed = Number.parseInt(input.value, 10);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	protected toggle(): void {
		this.timerStore.toggle();
	}

	protected reset(): void {
		this.timerStore.reset();
	}

	protected async syncBot(): Promise<void> {
		const bot = this.settingsStore.settings().timer.bot;
		this.syncStatus.set('loading');
		try {
			await this.timerStore.syncBot(bot.nick, bot.timerName);
			this.syncStatus.set('ok');
			this.syncMessage.set('Синхронизировано с ботом RGG');
		} catch (error) {
			this.syncStatus.set('error');
			this.syncMessage.set(error instanceof Error ? error.message : 'Не удалось синхронизировать');
		}
	}
}