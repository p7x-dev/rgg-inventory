import type { InventoryEntry } from '@core/models/inventory.model';
import { inject } from '@angular/core';
import { SettingsStore } from '@core/stores/settings.store';
import { signalStore, withMethods } from '@ngrx/signals';
import { unzipSync } from 'fflate';

/** Результат импорта zip-пака иконок. */
export interface IconImportReport {
	matched: string[];
	unknown: string[];
}

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'svg'];

/** Нормализация имени для сопоставления файла и предмета. */
export function normalizeIconName(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '');
}

function mimeFor(filename: string): string | null {
	const ext = filename.split('.').pop()?.toLowerCase() ?? '';
	if (!IMAGE_EXTENSIONS.includes(ext)) {
		return null;
	}
	if (ext === 'svg') {
		return 'image/svg+xml';
	}
	if (ext === 'jpg' || ext === 'jpeg') {
		return 'image/jpeg';
	}
	return `image/${ext}`;
}

function bytesToBase64(bytes: Uint8Array): string {
	let binary = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

/**
 * Иконки предметов. Персональные иконки хранятся в настройках (settings.icons).
 * Резолв: персональная > иконка источника > null. Импорт zip-пака и одиночных картинок.
 */
export const IconStore = signalStore(
	{ providedIn: 'root' },
	withMethods((store, settingsStore = inject(SettingsStore)) => {
		const icons = (): Record<string, string> => settingsStore.icons();

		/** Иконка для записи: персональная иконка предмета > иконка из источника > null. */
		const resolveIcon = (entry: InventoryEntry): string | null => {
			const personal = icons()[entry.name];
			return personal ?? entry.icon ?? null;
		};

		const setIcon = (itemName: string, icon: string): void => {
			settingsStore.updateWith((current) => ({
				...current,
				icons: { ...current.icons, [itemName]: icon },
			}));
		};

		const clearIcon = (itemName: string): void => {
			settingsStore.updateWith((current) => {
				const next = { ...current.icons };
				delete next[itemName];
				return { ...current, icons: next };
			});
		};

		return {
			resolveIcon,
			setIcon,
			clearIcon,
			/** Импорт zip-архива; имена файлов сопоставляются с именами предметов. */
			async importZipPack(file: File, itemNames: string[]): Promise<IconImportReport> {
				const bytes = new Uint8Array(await file.arrayBuffer());
				let entries: Record<string, Uint8Array>;
				try {
					entries = unzipSync(bytes);
				} catch (error) {
					throw new Error(
						`Архив повреждён: ${error instanceof Error ? error.message : 'не удалось распаковать'}`,
					);
				}

				const itemByName = new Map(itemNames.map((name) => [normalizeIconName(name), name]));
				const report: IconImportReport = { matched: [], unknown: [] };

				for (const [filename, content] of Object.entries(entries)) {
					const mime = mimeFor(filename);
					if (mime === null) {
						continue;
					}
					const stem = filename.split('/').pop()?.split('.').slice(0, -1).join('.') ?? '';
					const normalized = normalizeIconName(stem);
					const itemName = itemByName.get(normalized);
					if (!itemName) {
						report.unknown.push(filename);
						continue;
					}
					const dataUrl = `data:${mime};base64,${bytesToBase64(content)}`;
					setIcon(itemName, dataUrl);
					report.matched.push(itemName);
				}
				return report;
			},
			/** Импорт одной картинки как иконки конкретного предмета. */
			async importSingleIcon(file: File, itemName: string): Promise<void> {
				const dataUrl = await fileToDataUrl(file);
				setIcon(itemName, dataUrl);
			},
		};
	}),
);

function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
		reader.readAsDataURL(file);
	});
}