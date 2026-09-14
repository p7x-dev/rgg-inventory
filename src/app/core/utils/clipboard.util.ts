/** Копирует текст в буфер обмена; `false`, если буфер недоступен (нет API, запрещён). */
export async function copyText(text: string): Promise<boolean> {
	if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Устаревший путь ниже — для окружений без async Clipboard API.
		}
	}
	return copyViaHiddenTextarea(text);
}

/** Фолбэк через скрытый textarea и execCommand (старые webview). */
function copyViaHiddenTextarea(text: string): boolean {
	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	textarea.style.pointerEvents = 'none';
	document.body.appendChild(textarea);
	textarea.select();
	try {
		return document.execCommand('copy');
	} catch {
		return false;
	} finally {
		document.body.removeChild(textarea);
	}
}