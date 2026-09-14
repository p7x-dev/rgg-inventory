import type { WidgetId } from '@core/models/settings.model';
import { isWidgetId } from '@core/models/settings.model';

/** Хэш-фрагмент URL, включающий OBS-виджет оверлея без панели управления. */
export const OVERLAY_URL_HASH = '#/overlay';

/** Хэш-префикс отдельного виджета: `#/widget/<id>`. */
export const WIDGET_URL_HASH = '#/widget/';

/** Полный URL OBS-виджета для текущего origin (вставляется в браузерный источник OBS). */
export function overlayUrl(): string {
	return `${window.location.origin}${window.location.pathname}${OVERLAY_URL_HASH}`;
}

/** URL отдельного виджета (`#/widget/<id>`) для текущего origin. */
export function widgetUrl(widgetId: WidgetId): string {
	return `${window.location.origin}${window.location.pathname}${WIDGET_URL_HASH}${widgetId}`;
}

/**
 * Идентификатор виджета из URL (`#/widget/<id>`); null — это не URL виджета
 * или неизвестный id. Браузерный источник OBS считается обычным оверлеем (не виджетом).
 */
export function widgetIdFromUrl(url: string): WidgetId | null {
	const hash = url.split('#')[1] ?? '';
	if (!hash.startsWith(WIDGET_URL_HASH.slice(1))) {
		return null;
	}
	const id = hash.slice(WIDGET_URL_HASH.length - 1);
	return isWidgetId(id) ? id : null;
}

/** `true`, когда страница загружена внутри браузерного источника OBS (User-Agent содержит `obs`). */
export function isObsBrowserSource(): boolean {
	return typeof navigator !== 'undefined' && /obs/i.test(navigator.userAgent);
}

/** `true` для URL оверлей-виджета (хэш `#/overlay` или браузерный источник OBS). */
export function isOverlayUrl(url: string): boolean {
	return url.endsWith(OVERLAY_URL_HASH) || isObsBrowserSource();
}