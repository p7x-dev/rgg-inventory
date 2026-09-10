/** Хэш-фрагмент URL, включающий OBS-виджет оверлея без панели управления. */
export const OVERLAY_URL_HASH = '#/overlay';

/** Полный URL OBS-виджета для текущего origin (вставляется в браузерный источник OBS). */
export function overlayUrl(): string {
	return `${window.location.origin}${window.location.pathname}${OVERLAY_URL_HASH}`;
}

/** `true`, когда страница загружена внутри браузерного источника OBS (User-Agent содержит `obs`). */
export function isObsBrowserSource(): boolean {
	return typeof navigator !== 'undefined' && /obs/i.test(navigator.userAgent);
}

/** `true` для URL оверлей-виджета (хэш `#/overlay` или браузерный источник OBS). */
export function isOverlayUrl(url: string): boolean {
	return url.endsWith(OVERLAY_URL_HASH) || isObsBrowserSource();
}