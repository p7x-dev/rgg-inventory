import type { DesignLayout, ThemeTokens } from '@core/models/theme.model';
import type { ThemeExportFormat } from '@core/theme/theme-export';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { buildThemeArchive, parseThemeArchive, themeArchiveName } from '@core/archive/theme-archive';
import { SettingsStore } from '@core/stores/settings.store';
import { ThemeStore } from '@core/stores/theme.store';
import { generateTheme, themeFileName } from '@core/theme/theme-export';
import { selectedFile } from '@core/utils/file.util';
import { SettingsActionsComponent } from '@shared/ui/settings-actions/settings-actions.component';
import { SettingsBlockComponent } from '@shared/ui/settings-block/settings-block.component';
import { SettingsHintComponent } from '@shared/ui/settings-hint/settings-hint.component';
import { SettingsPresetRowComponent } from '@shared/ui/settings-preset-row/settings-preset-row.component';
import { SettingsStatusComponent } from '@shared/ui/settings-status/settings-status.component';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';

const EXPORT_OPTIONS: readonly { id: ThemeExportFormat; label: string }[] = [
	{ id: 'css', label: '.css' },
	{ id: 'scss', label: '.scss' },
	{ id: 'sass', label: '.sass' },
	{ id: 'less', label: '.less' },
	{ id: 'stylus', label: '.styl' },
];

/** Экспорт темы (css/scss/… + zip) и импорт (css/…/zip). */
@Component({
	selector: 'app-theme-export',
	imports: [
		TuiButton,
		TuiTextfield,
		SettingsBlockComponent,
		SettingsHintComponent,
		SettingsActionsComponent,
		SettingsPresetRowComponent,
		SettingsStatusComponent,
	],
	templateUrl: './theme-export.component.html',
	styleUrl: './theme-export.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeExportComponent {
	private readonly settingsStore = inject(SettingsStore);
	private readonly themeStore = inject(ThemeStore);

	protected readonly exportFormats = EXPORT_OPTIONS;

	protected readonly exportFormat = signal<ThemeExportFormat>('css');

	protected readonly exportNick = signal('');

	protected readonly importError = signal<string | null>(null);

	protected readonly importMessage = signal<string | null>(null);

	protected readonly suggestedNick = computed(() =>
		this.settingsStore.settings().activeSource === 'rggland'
			? this.settingsStore.settings().sources.rggland.nick.trim()
			: '',
	);

	protected readonly exportFileName = computed(() =>
		themeFileName(this.exportNick() || this.suggestedNick(), this.exportFormat()),
	);

	protected readonly zipFileName = computed(() => themeArchiveName(this.exportNick() || this.suggestedNick()));

	protected setExportNick(value: string): void {
		this.exportNick.set(value);
	}

	protected useSuggestedNick(): void {
		this.exportNick.set(this.suggestedNick());
	}

	protected setExportFormat(format: ThemeExportFormat): void {
		this.exportFormat.set(format);
	}

	protected exportTheme(): void {
		const nick = this.exportNick() || this.suggestedNick();
		const content = generateTheme(this.themeStore.tokens(), nick, this.exportFormat());
		this.download(new Blob([content], { type: 'text/plain' }), themeFileName(nick, this.exportFormat()));
	}

	protected exportZip(): void {
		const nick = this.exportNick() || this.suggestedNick();
		const tokens = this.themeStore.tokens();
		const settings = this.settingsStore.settings();
		const archive = buildThemeArchive({
			version: 1,
			nick,
			tokens,
			design: settings.customDesign,
			fontFace: tokens.fontFace,
		});
		const buffer = archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength) as ArrayBuffer;
		const blob = new Blob([buffer], { type: 'application/zip' });
		this.download(blob, themeArchiveName(nick));
	}

	protected onThemeFileSelected(event: Event): void {
		const file = selectedFile(event);
		if (!file) {
			return;
		}
		void this.importFile(file);
	}

	protected async importFile(file: File): Promise<void> {
		this.importError.set(null);
		this.importMessage.set(null);
		try {
			const tokens = await this.readTheme(file);
			this.themeStore.applyTokens(tokens);
			this.settingsStore.update({
				themePreset: 'custom',
				themeTokens: tokens,
				activeSavedPresetId: null,
			});
			this.importMessage.set('Тема импортирована и применена');
		} catch (error) {
			this.importError.set(error instanceof Error ? error.message : 'Не удалось импортировать тему');
		}
	}

	private async readTheme(file: File): Promise<ThemeTokens> {
		if (file.name.endsWith('.zip')) {
			const archive = parseThemeArchive(new Uint8Array(await file.arrayBuffer()));
			this.applyDesignFromArchive(archive.design);
			this.applyFontFaceFromArchive(archive.tokens.fontFace ?? null);
			return archive.tokens;
		}
		return this.parseThemeText(await file.text());
	}

	/** Применяет layout дизайна из архива (переживает импорт). */
	private applyDesignFromArchive(design: DesignLayout | null): void {
		if (!design) {
			return;
		}
		this.settingsStore.update({ themePreset: 'custom', customDesign: design });
	}

	/** Переносит fontFace архива в токены. */
	private applyFontFaceFromArchive(face: ThemeTokens['fontFace']): void {
		if (!face) {
			return;
		}
		this.settingsStore.update({
			themeTokens: { ...this.themeStore.tokens(), fontFace: face },
		});
	}

	private parseThemeText(text: string): ThemeTokens {
		const tokens: ThemeTokens = { ...this.themeStore.tokens() };
		const rootMatch = text.match(/:root\s*\{([\s\S]*?)\}/);
		const block = rootMatch ? rootMatch[1] : text;
		const varRegex = /(--inv-[\w-]+)\s*:\s*([^;}\n]+)/g;
		for (const m of block.matchAll(varRegex)) {
			const key = m[1].replace('--inv-', '') as keyof ThemeTokens;
			if (key in tokens) {
				(tokens as unknown as Record<string, unknown>)[key] = this.cleanTokenValue(m[2]);
			}
		}
		return tokens;
	}

	private cleanTokenValue(value: string): string | number | null {
		const s = value.replace(/!important|;\s*$/g, '').trim();
		if (s.endsWith('px')) {
			return Number.parseInt(s, 10);
		}
		if (s === 'none' || s === 'null') {
			return null;
		}
		const num = Number(s);
		return Number.isFinite(num) ? num : s;
	}

	private download(blob: Blob, fileName: string): void {
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = fileName;
		anchor.click();
		URL.revokeObjectURL(url);
	}
}