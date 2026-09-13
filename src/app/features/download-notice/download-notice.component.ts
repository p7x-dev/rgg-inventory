import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { SettingsNavigationService } from '@core/services/settings-navigation.service';
import { ReleaseStore } from '@core/stores/release.store';
import { isOverlayUrl } from '@core/utils/overlay';
import { APP_VERSION } from '@core/version';
import { TuiButton } from '@taiga-ui/core';

/** Ключ localStorage: показано ли уже уведомление о доступном скачивании приложения. */
export const DOWNLOAD_NOTICE_KEY = 'rgg-inventory:download-notice';

/** Через сколько миллисекунд баннер скрывается автоматически. */
const AUTO_HIDE_DELAY = 15_000;

function readSeenVersion(): string | null {
	try {
		return localStorage.getItem(DOWNLOAD_NOTICE_KEY);
	} catch {
		return null;
	}
}

function writeSeenVersion(version: string): void {
	try {
		localStorage.setItem(DOWNLOAD_NOTICE_KEY, version);
	} catch {
		// localStorage недоступен (приватный режим) — уведомление просто покажется в следующий раз.
	}
}

/**
 * Баннер «Доступно скачивание приложения». Показывается сверху страницы
 * при первом открытии или если ещё не был показан (локально запоминаем версию,
 * с которой уведомление уже демонстрировалось). В OBS-виджете (#/overlay) не показывается.
 */
@Component({
	selector: 'app-download-notice',
	imports: [TuiButton],
	templateUrl: './download-notice.component.html',
	styleUrl: './download-notice.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadNoticeComponent {
	private readonly releaseStore = inject(ReleaseStore);
	private readonly settingsNavigation = inject(SettingsNavigationService);

	private readonly dismissed = signal(false);

	private autoHideTimer: ReturnType<typeof setTimeout> | null = null;

	protected readonly visible = computed(() => {
		if (this.dismissed()) {
			return false;
		}
		if (isOverlayUrl(window.location.hash)) {
			return false;
		}
		if (readSeenVersion() === APP_VERSION) {
			return false;
		}
		// Показываем только когда известно, что сборки есть (манифест или GitHub).
		return this.releaseStore.hasArtifact();
	});

	protected readonly version = computed(() => this.releaseStore.availableVersion() ?? APP_VERSION);

	constructor() {
		// Проверяем наличие сборок при открытии страницы, чтобы баннер знал о релизе.
		void this.releaseStore.check();

		// Автоскрытие через AUTO_HIDE_DELAY, когда баннер стал видим.
		effect(() => {
			if (this.visible()) {
				this.scheduleHide();
			}
		});
	}

	/** Запускаем таймер скрытия, когда баннер стал видимым. */
	private scheduleHide(): void {
		if (this.autoHideTimer !== null) {
			return;
		}
		this.autoHideTimer = setTimeout(() => this.dismiss(), AUTO_HIDE_DELAY);
	}

	protected openSettings(): void {
		this.markSeen();
		this.clearTimer();
		this.dismissed.set(true);
		this.settingsNavigation.requestOpenAppSection();
	}

	protected dismiss(): void {
		this.markSeen();
		this.clearTimer();
		this.dismissed.set(true);
	}

	private clearTimer(): void {
		if (this.autoHideTimer !== null) {
			clearTimeout(this.autoHideTimer);
			this.autoHideTimer = null;
		}
	}

	private markSeen(): void {
		writeSeenVersion(APP_VERSION);
	}
}