import type { OverlayWidgets } from '@core/models/settings.model';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { copyText } from '@core/utils/clipboard.util';
import { widgetUrl } from '@core/utils/overlay';
import { SettingsSwitchComponent } from '@shared/ui/settings-switch/settings-switch.component';
import { TuiButton } from '@taiga-ui/core';

const WIDGET_OPTIONS: readonly { key: keyof OverlayWidgets; label: string; hint: string }[] = [
	{ key: 'inventory', label: 'Инвентарь', hint: 'Хотбар с предметами (или соло-платформы)' },
	{ key: 'gameInfo', label: 'Информация об игре', hint: 'Обложка и описание текущей игры' },
	{ key: 'gameTitle', label: 'Название игры', hint: 'Бегущая строка, если название не влезает' },
	{ key: 'stats', label: 'Статистика', hint: 'Пройдено/рероллы/пропуски по играм' },
	{ key: 'timer', label: 'Таймер', hint: 'Секундомер или обратный отсчёт' },
	{ key: 'profile', label: 'Профиль', hint: 'Ник и валюта (монетки/слёзы)' },
];

/** Время показа «Скопировано» вместо кнопки. */
const COPIED_HINT_MS = 2000;

interface WidgetOption {
	key: keyof OverlayWidgets;
	label: string;
	hint: string;
	url: string;
}

/** Переключатели видимости виджетов оверлея + URL для OBS (dumb). */
@Component({
	selector: 'app-widgets-settings',
	imports: [SettingsSwitchComponent, TuiButton],
	templateUrl: './widgets-settings.component.html',
	styleUrl: './widgets-settings.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetsSettingsComponent {
	readonly widgets = input.required<OverlayWidgets>();

	readonly widgetsChange = output<Partial<OverlayWidgets>>();

	protected readonly options = computed<WidgetOption[]>(() =>
		WIDGET_OPTIONS.map((option) => ({ ...option, url: widgetUrl(option.key) })),
	);

	/** Виджет, для которого показано «Скопировано» (null — ничего не копировали). */
	protected readonly copiedKey = signal<keyof OverlayWidgets | null>(null);

	private readonly destroyRef = inject(DestroyRef);

	private copiedTimer: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		this.destroyRef.onDestroy(() => this.clearCopiedTimer());
	}

	protected onToggle(key: keyof OverlayWidgets, enabled: boolean): void {
		this.widgetsChange.emit({ [key]: enabled });
	}

	protected async copyUrl(key: keyof OverlayWidgets, url: string): Promise<void> {
		const copied = await copyText(url);
		if (!copied) {
			return;
		}
		this.copiedKey.set(key);
		this.clearCopiedTimer();
		this.copiedTimer = setTimeout(() => {
			this.copiedTimer = null;
			this.copiedKey.set(null);
		}, COPIED_HINT_MS);
	}

	private clearCopiedTimer(): void {
		if (this.copiedTimer !== null) {
			clearTimeout(this.copiedTimer);
			this.copiedTimer = null;
		}
	}
}