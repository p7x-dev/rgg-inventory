import type { PercentRect } from '@core/design/rect-editor';
import type { DesignDerivedTheme, ThemeTokens } from '@core/models/theme.model';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DesignImageService } from '@core/design/design-image.service';
import { SettingsStore } from '@core/stores/settings.store';
import { ThemeStore } from '@core/stores/theme.store';
import { tokenColorPip } from '@core/theme/color.util';
import { SettingsSliderComponent } from '@shared/ui/settings-slider/settings-slider.component';
import { SettingsSwitchComponent } from '@shared/ui/settings-switch/settings-switch.component';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';
import { DesignEditorComponent } from './design-editor/design-editor.component';
import { ThemeAssetsComponent } from './theme-assets/theme-assets.component';
import { ThemeExportComponent } from './theme-export/theme-export.component';
import { ThemePresetsComponent } from './theme-presets/theme-presets.component';

/** Настройка вида токена и границы для детального редактора. */
interface NumericTokenDef {
	label: string;
	key: keyof ThemeTokens;
	min: number;
	max: number;
	step: number;
	unit: string;
}

@Component({
	selector: 'app-theme-settings',
	imports: [
		DesignEditorComponent,
		SettingsSliderComponent,
		SettingsSwitchComponent,
		ThemeAssetsComponent,
		ThemeExportComponent,
		ThemePresetsComponent,
		TuiButton,
		TuiTextfield,
	],
	templateUrl: './theme-settings.component.html',
	styleUrl: './theme-settings.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSettingsComponent {
	private readonly settingsStore = inject(SettingsStore);
	private readonly themeStore = inject(ThemeStore);
	private readonly designImageService = inject(DesignImageService);

	protected readonly themePreset = this.settingsStore.themePreset;

	protected readonly customDesign = this.settingsStore.customDesign;

	protected readonly overlay = this.settingsStore.overlay;

	protected readonly analyzing = signal(false);

	protected readonly analysisError = signal<string | null>(null);

	protected readonly preview = signal<DesignDerivedTheme | null>(null);

	protected readonly isCustomTheme = computed(() => this.themePreset() === 'custom');

	protected readonly tokens = this.themeStore.tokens;

	protected readonly designEditorEnabled = computed(() => this.overlay().designEditorEnabled);

	protected readonly colorTokens: { label: string; key: keyof ThemeTokens; value: () => string }[] = [
		{ label: 'Фон', key: 'background', value: () => this.tokens().background },
		{ label: 'Акцент', key: 'accent', value: () => this.tokens().accent },
		{ label: 'Текст', key: 'text', value: () => this.tokens().text },
		{ label: 'Вторичный текст', key: 'textMuted', value: () => this.tokens().textMuted },
		{ label: 'Слот', key: 'slotBg', value: () => this.tokens().slotBg },
		{ label: 'Рамка слота', key: 'slotBorderColor', value: () => this.tokens().slotBorderColor },
		{ label: 'Слот при наведении', key: 'slotHoverBg', value: () => this.tokens().slotHoverBg },
	];

	protected readonly numericTokens: NumericTokenDef[] = [
		{ label: 'Размер слота', key: 'slotSize', min: 24, max: 96, step: 1, unit: 'px' },
		{ label: 'Отступ между слотами', key: 'slotGap', min: 0, max: 24, step: 1, unit: 'px' },
		{ label: 'Внутренний отступ', key: 'padding', min: 0, max: 40, step: 1, unit: 'px' },
		{ label: 'Скругление', key: 'borderRadius', min: 0, max: 28, step: 1, unit: 'px' },
		{ label: 'Толщина рамки слота', key: 'slotBorderWidth', min: 0, max: 6, step: 1, unit: 'px' },
		{ label: 'Прозрачность фона', key: 'backgroundOpacity', min: 0.05, max: 1, step: 0.05, unit: '' },
	];

	protected readonly textTokens: { label: string; key: keyof ThemeTokens; placeholder: string }[] = [
		{ label: 'Шрифт', key: 'font', placeholder: '"Rubik", "Segoe UI", sans-serif' },
		{ label: 'Шрифт таймера', key: 'timerFont', placeholder: '"DS-DIGI", "Roboto Mono", monospace' },
		{ label: 'Тень оверлея', key: 'shadow', placeholder: '0 4px 24px rgba(0, 0, 0, 0.6)' },
	];

	protected readonly editorRects = computed<PercentRect[]>(() => {
		const design = this.preview()?.layout;
		if (!design) {
			return [];
		}
		return design.slots.map((slot) => ({
			left: (slot.x / design.imageWidth) * 100,
			top: (slot.y / design.imageHeight) * 100,
			width: (slot.width / design.imageWidth) * 100,
			height: (slot.height / design.imageHeight) * 100,
		}));
	});

	protected tokenColorPip(value: string): string {
		return tokenColorPip(value);
	}

	protected tokenNumber(key: keyof ThemeTokens): number {
		const value = this.tokens()[key];
		return typeof value === 'number' && Number.isFinite(value) ? value : 0;
	}

	protected tokenString(key: keyof ThemeTokens): string {
		const value = this.tokens()[key];
		return typeof value === 'string' ? value : '';
	}

	private applyCustomTokens(tokens: ThemeTokens): void {
		this.themeStore.applyTokens(tokens);
		this.settingsStore.update({
			themePreset: 'custom',
			themeTokens: tokens,
			activeSavedPresetId: null,
		});
	}

	protected onNumberChange(key: keyof ThemeTokens, value: number): void {
		this.applyCustomTokens({ ...this.tokens(), [key]: value });
	}

	protected onTextChange(key: keyof ThemeTokens, event: Event): void {
		const input = event.target;
		if (!(input instanceof HTMLInputElement)) {
			return;
		}
		this.applyCustomTokens({ ...this.tokens(), [key]: input.value });
	}

	protected onColorChange(key: keyof ThemeTokens, event: Event): void {
		const input = event.target;
		if (!(input instanceof HTMLInputElement)) {
			return;
		}
		this.applyCustomTokens({ ...this.tokens(), [key]: input.value });
	}

	protected setDesignEditorEnabled(value: boolean): void {
		this.settingsStore.update({ overlay: { ...this.overlay(), designEditorEnabled: value } });
	}

	protected async onDesignFileSelected(event: Event): Promise<void> {
		const input = event.target;
		if (!(input instanceof HTMLInputElement)) {
			return;
		}
		const file = input.files?.[0];
		input.value = '';
		if (!file) {
			return;
		}
		this.analyzing.set(true);
		this.analysisError.set(null);
		try {
			const result = await this.designImageService.analyzeFile(file);
			this.preview.set(result);
		} catch (error) {
			this.analysisError.set(error instanceof Error ? error.message : 'Не удалось проанализировать дизайн');
			this.preview.set(null);
		} finally {
			this.analyzing.set(false);
		}
	}

	protected applyDesign(): void {
		const design = this.preview();
		if (!design) {
			return;
		}
		this.settingsStore.update({
			themePreset: 'custom',
			customDesign: design.layout,
		});
	}

	protected removeDesign(): void {
		this.settingsStore.update({
			themePreset: 'rgg-retro',
			customDesign: null,
		});
		this.preview.set(null);
	}

	protected clearDesignPreview(): void {
		this.preview.set(null);
		this.analysisError.set(null);
	}

	/** Адаптирует layout дизайна под прямоугольники, изменённые пользователем в редакторе. */
	protected onEditorRectsChange(rects: PercentRect[]): void {
		const design = this.preview();
		if (!design) {
			return;
		}
		const layout = design.layout;
		const slots = layout.slots.map((slot, index) => {
			const rect = rects[index];
			if (!rect) {
				return slot;
			}
			return {
				...slot,
				x: Math.round((rect.left / 100) * layout.imageWidth),
				y: Math.round((rect.top / 100) * layout.imageHeight),
				width: Math.max(1, Math.round((rect.width / 100) * layout.imageWidth)),
				height: Math.max(1, Math.round((rect.height / 100) * layout.imageHeight)),
			};
		});
		this.preview.set({
			layout: { ...layout, slots },
			tokens: this.designImageService.deriveTokens({ ...layout, slots }),
		});
	}
}