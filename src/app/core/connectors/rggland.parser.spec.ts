import { describe, expect, it } from 'vitest';
import { parseInventoryHtml, parseOverviewCurrencies } from './rggland.parser';

const FIXTURE = `
<!doctype html>
<html>
<body>
<script>window.__DATA = {x: 1};</script>
<li class="MuiListSubheader-root MuiListSubheader-gutters mui-1fv16ue">Заметки</li>
<p class="MuiTypography-root MuiTypography-body1 mui-db63ox">НЕВЕРОЯТНАЯ ШЛЯПА ВЕРНЕТСЯ.\n\n07.09.2026 В 3:20</p>
<ul class="MuiList-root MuiList-padding MuiList-subheader mui-llfg3i">
<li class="MuiListSubheader-root MuiListSubheader-gutters mui-1fv16ue">Эффекты</li>
<li class="MuiListItem-root MuiListItem-padding mui-w2yvg3">
<div class="MuiListItemText-root MuiListItemText-multiline mui-zaykrd">
<div class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary mui-9l4f17">
<div class="break-all"><span>Дейликовое проклятие<!-- -->&nbsp;</span></div>
</div>
</div>
</li>
</ul>
<ul class="MuiList-root MuiList-padding MuiList-subheader mui-llfg3i">
<li class="MuiListSubheader-root MuiListSubheader-gutters mui-1fv16ue">Обычные предметы</li>
<li class="MuiListItem-root MuiListItem-padding mui-w2yvg3">
<div class="MuiListItemText-root MuiListItemText-multiline mui-zaykrd">
<div class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary mui-9l4f17">
<div class="break-all"><span>Паук<!-- -->&nbsp;</span></div>
</div>
<div class="MuiTypography-root MuiTypography-body2 MuiListItemText-secondary mui-1w8jbks">
<div><div class="break-all">Выкопано в садике</div></div>
</div>
</div>
</li>
<li class="MuiListItem-root MuiListItem-padding mui-w2yvg3">
<div class="MuiListItemText-root MuiListItemText-multiline mui-zaykrd">
<div class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary mui-9l4f17">
<div class="break-all"><span>Могвай<!-- -->&nbsp;</span></div>
</div>
</div>
</li>
</ul>
<ul class="MuiList-root MuiList-padding MuiList-subheader mui-llfg3i">
<li class="MuiListSubheader-root MuiListSubheader-gutters mui-1fv16ue">Спецроллы</li>
<li class="MuiListItem-root MuiListItem-padding mui-w2yvg3">
<div class="MuiListItemText-root MuiListItemText-multiline mui-zaykrd">
<div class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary mui-9l4f17">
<div class="break-all"><span>Игра от Хоста<!-- -->&nbsp;</span></div>
</div>
</div>
</li>
</ul>
</body>
</html>
`;

describe('parseInventoryHtml', () => {
	it('извлекает заметки, категории и записи в порядке RGG', () => {
		const data = parseInventoryHtml(FIXTURE, 'bradhi');

		expect(data.player).toBe('bradhi');
		expect(data.notes).toContain('НЕВЕРОЯТНАЯ ШЛЯПА');
		expect(data.categories.map((category) => category.id)).toEqual(['effects', 'items', 'specials']);

		const effects = data.categories[0];
		expect(effects.entries).toHaveLength(1);
		expect(effects.entries[0].name).toBe('Дейликовое проклятие');

		const items = data.categories[1];
		expect(items.entries.map((entry) => entry.name)).toEqual(['Паук', 'Могвай']);
		expect(items.entries[0].note).toBe('Выкопано в садике');

		const specials = data.categories[2];
		expect(specials.entries[0].name).toBe('Игра от Хоста');
	});

	it('игнорирует скрипты и не даёт пустых категорий', () => {
		const data = parseInventoryHtml('<script>window.x = 1</script><div>пусто</div>', 'x');
		expect(data.categories).toHaveLength(0);
		expect(data.notes).toBe('');
	});
});

describe('parseOverviewCurrencies', () => {
	const OVERVIEW = `
	<table>
	<tr><th>Участник</th><th>Монеток</th><th>Слёз</th></tr>
	<tr><td>Bradhi</td><td>100</td><td>114</td></tr>
	<tr><td>chelovekgleb</td><td>196</td><td>84</td></tr>
	</table>
	`;

	it('находит монетки и слёзы по нику (регистронезависимо)', () => {
		expect(parseOverviewCurrencies(OVERVIEW, 'bradhi')).toEqual({ coins: 100, tears: 114 });
		expect(parseOverviewCurrencies(OVERVIEW, 'chelovekgleb')).toEqual({ coins: 196, tears: 84 });
	});

	it('возвращает нули для отсутствующего игрока', () => {
		expect(parseOverviewCurrencies(OVERVIEW, 'nobody')).toEqual({ coins: 0, tears: 0 });
	});
});
