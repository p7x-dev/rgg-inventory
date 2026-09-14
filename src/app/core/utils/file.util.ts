/**
 * Хелперы работы с файлами (input[type=file]) — общая логика для всех загрузок.
 */

/** Берёт выбранный файл из input и сбрасывает input (можно выбрать тот же файл повторно). */
export function selectedFile(event: Event): File | null {
	const input = event.target;
	if (!(input instanceof HTMLInputElement)) {
		return null;
	}
	const file = input.files?.[0] ?? null;
	input.value = '';
	return file;
}

/** Читает файл как data-url (base64). */
export function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
		reader.readAsDataURL(file);
	});
}

/** Размер файла по длине data-url: «123 КБ», «1,2 МБ». */
export function dataUrlSize(dataUrl: string): string {
	const bytes = Math.round((dataUrl.length / 4) * 3);
	if (bytes > 1024 * 1024) {
		return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
	}
	return `${Math.round(bytes / 1024)} КБ`;
}