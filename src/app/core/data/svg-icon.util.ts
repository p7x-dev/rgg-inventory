/**
 * Утилита превращения inline-SVG в data:image/svg+xml;base64 URI.
 * Используется для встроенных pixel-art иконок (играем без внешних файлов).
 */
export function svgDataUri(svg: string): string {
	const b64 =
		typeof btoa === 'function'
			? btoa(svg)
			: btoaFromBytes(new TextEncoder().encode(svg));
	return `data:image/svg+xml;base64,${b64}`;
}

function btoaFromBytes(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return typeof btoa === 'function' ? btoa(binary) : '';
}