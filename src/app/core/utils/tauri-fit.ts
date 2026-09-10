import { isTauri } from './platform';

/**
 * Подгонка размера окна Tauri под актуальную ширину и высоту бара.
 * Использует CSS-класс .tauri-fit для измерения натуральных размеров,
 * а затем вызывает setSize через JS API Tauri.
 *
 * Host-паддинг app-overlay-bar: 8px 10px (суммарно 16px высота, 20px ширина).
 */
export async function fitTauriWindow(hostElement: HTMLElement | null): Promise<void> {
	if (!isTauri() || !hostElement) {
		return;
	}

	const bar = hostElement.querySelector('.bar') as HTMLElement | null;
	if (!bar) {
		return;
	}

	const prevWidth = bar.style.width;

	// Временно снимаем width: 100%, чтобы замерить натуральную ширину контента.
	bar.style.width = 'max-content';
	const rect = bar.getBoundingClientRect();
	bar.style.width = prevWidth;

	const width = Math.ceil(rect.width) + 20;
	const height = Math.ceil(rect.height) + 16;

	try {
		const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
		await getCurrentWindow().setSize(new LogicalSize(width, height));
	} catch {
		// Если setSize недоступен (нет capability) — просто игнорируем.
	}
}