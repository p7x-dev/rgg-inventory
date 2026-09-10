import type { ThemeTokens } from '@core/models/theme.model';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SettingsStore } from '@core/stores/settings.store';
import { ThemeStore } from '@core/stores/theme.store';
import { fontFaceFromFile } from '@core/theme/font-face';
import { TuiButton } from '@taiga-ui/core';

/** Загрузка кастомных ассетов: иконки монеток/слёз и пользовательский шрифт. */
@Component({
	selector: 'app-theme-assets',
	imports: [TuiButton],
	templateUrl: './theme-assets.component.html',
	styleUrl: './theme-assets.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeAssetsComponent {
	private readonly settingsStore = inject(SettingsStore);
	private readonly themeStore = inject(ThemeStore);

	protected readonly tokens = this.themeStore.tokens;

	protected readonly message = signal<string | null>(null);

	protected readonly error = signal<string | null>(null);

	protected async onCoinIconSelected(event: Event): Promise<void> {
		await this.setIcon(event, 'coinIcon', 'Иконка монеток');
	}

	protected async onTearIconSelected(event: Event): Promise<void> {
		await this.setIcon(event, 'tearIcon', 'Иконка слёз');
	}

	protected async onFontSelected(event: Event): Promise<void> {
		const input = event.target;
		if (!(input instanceof HTMLInputElement)) {
			return;
		}
		const file = input.files?.[0];
		input.value = '';
		if (!file) {
			return;
		}
		this.error.set(null);
		this.message.set(null);
		try {
			const dataUrl = await this.fileToDataUrl(file);
			const fontFace = fontFaceFromFile(file.name, file.type, dataUrl);
			this.applyTokens({ fontFace });
			this.message.set(`Шрифт «${fontFace.family}» применён (${this.friendlySize(dataUrl)})`);
		} catch (err) {
			this.error.set(err instanceof Error ? err.message : 'Не удалось загрузить шрифт');
		}
	}

	private async setIcon(
		event: Event,
		key: keyof Pick<ThemeTokens, 'coinIcon' | 'tearIcon'>,
		label: string,
	): Promise<void> {
		const input = event.target;
		if (!(input instanceof HTMLInputElement)) {
			return;
		}
		const file = input.files?.[0];
		input.value = '';
		if (!file) {
			return;
		}
		this.error.set(null);
		this.message.set(null);
		try {
			const dataUrl = await this.fileToDataUrl(file);
			this.applyTokens({ [key]: dataUrl });
			this.message.set(`${label} заменена`);
		} catch (err) {
			this.error.set(err instanceof Error ? err.message : 'Не удалось загрузить картинку');
		}
	}

	/** Применяет токены и сохраняет их как кастомную тему. */
	private applyTokens(patch: Partial<ThemeTokens>): void {
		const tokens = { ...this.tokens(), ...patch };
		this.themeStore.applyTokens(tokens);
		this.settingsStore.update({
			themePreset: 'custom',
			themeTokens: tokens,
			activeSavedPresetId: null,
		});
	}

	protected resetIcon(key: keyof Pick<ThemeTokens, 'coinIcon' | 'tearIcon'>): void {
		this.applyTokens({ [key]: null });
		this.message.set('Иконка сброшена на стандартную');
	}

	protected resetFont(): void {
		this.applyTokens({ fontFace: null });
		this.message.set('Шрифт сброшен на стандартные');
	}

	private fileToDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
			reader.readAsDataURL(file);
		});
	}

	private friendlySize(dataUrl: string): string {
		const bytes = Math.round((dataUrl.length / 4) * 3);
		if (bytes > 1024 * 1024) {
			return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
		}
		return `${Math.round(bytes / 1024)} КБ`;
	}
}