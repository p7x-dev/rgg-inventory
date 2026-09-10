/**
 * Разрешает CSS-значение цвета темы в формате, подходящий для <input type="color">.
 * url(...)/none/transparent/неизвестный формат → чёрный, rgba() → hex.
 */
export function tokenColorPip(value: string): string {
	const s = value.trim();
	if (s.startsWith('url(') || s === 'none' || s === 'transparent') {
		return '#000000';
	}
	const rgba = s.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
	if (rgba) {
		const hex = (v: string): string => Number(v).toString(16).padStart(2, '0');
		return `#${hex(rgba[1])}${hex(rgba[2])}${hex(rgba[3])}`;
	}
	return /^#[0-9a-f]{3,8}$/i.test(s) ? s : '#000000';
}