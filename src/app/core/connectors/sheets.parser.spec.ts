import { describe, expect, it } from 'vitest';
import { categoryFromText, parseCsv, parseSheetCsv, parseSoloCsv } from './sheets.parser';

describe('parseCsv', () => {
	it('парсит простые строки', () => {
		expect(parseCsv('a,b,c\n1,2,3')).toEqual([
			['a', 'b', 'c'],
			['1', '2', '3'],
		]);
	});

	it('поддерживает кавычки, экранирование и переносы строк в поле', () => {
		const csv = 'name,note\n"Паук","Выкопан\nв садике"\n"Апперкот, улучшенный","x"';
		const rows = parseCsv(csv);
		expect(rows).toHaveLength(3);
		expect(rows[1]).toEqual(['Паук', 'Выкопан\nв садике']);
		expect(rows[2]).toEqual(['Апперкот, улучшенный', 'x']);
	});

	it('отбрасывает пустые строки', () => {
		expect(parseCsv('a,b\n\n\n1,2\n')).toHaveLength(2);
	});
});

describe('categoryFromText', () => {
	it('определяет категорию по значению ячейки', () => {
		expect(categoryFromText('Эффект')).toBe('effects');
		expect(categoryFromText('effect')).toBe('effects');
		expect(categoryFromText('Спецролл')).toBe('specials');
		expect(categoryFromText('special roll')).toBe('specials');
		expect(categoryFromText('Паук')).toBe('items');
		expect(categoryFromText('')).toBe('items');
	});
});

describe('parseSheetCsv', () => {
	const CSV = [
		'Предмет,Категория,Заметка,Описание',
		'Паук,Обычный,Выкопан в садике,"Уничтожает Птичкерсов"',
		'Могвай,Обычный,,',
		'Дейликовое проклятие,Эффект,,"Минус очко за дейлик"',
		'Игра от Хоста,Спецролл,приоритет,',
	].join('\n');

	it('раскладывает записи по категориям и подхватывает заметки', () => {
		const data = parseSheetCsv(
			CSV,
			{
				name: 'Предмет',
				category: 'Категория',
				note: 'Заметка',
				description: 'Описание',
			},
			'таблица',
		);

		expect(data.categories.map((category) => category.id)).toEqual(['effects', 'items', 'specials']);
		expect(data.categories[0].entries[0].name).toBe('Дейликовое проклятие');
		expect(data.categories[0].entries[0].description).toBe('Минус очко за дейлик');
		expect(data.categories[1].entries[0].note).toBe('Выкопан в садике');
		expect(data.categories[2].entries[0].note).toBe('приоритет');
	});

	it('кидает ошибку при неизвестной колонке', () => {
		expect(() =>
			parseSheetCsv(
				CSV,
				{
					name: 'Нет такой колонки',
					category: 'Категория',
					note: 'Заметка',
					description: 'Описание',
				},
				'таблица',
			),
		).toThrow('Не найдена колонка');
	});

	it('кидает ошибку на пустой таблице', () => {
		expect(() =>
			parseSheetCsv(
				'Предмет\n',
				{
					name: 'Предмет',
					category: 'Категория',
					note: 'Заметка',
					description: 'Описание',
				},
				'таблица',
			),
		).toThrow('пустая');
	});
});

describe('parseSoloCsv', () => {
	const CSV = [
		'Платформа,Игра,Статус,Причина,Описание,Текущая',
		'NES,Супер Марио 3,Пройдено,,Классика платформера,',
		'NES,Battletoads,Пропущено через реролл,Слишком сложно,Знаменитый бобёр-переросток,',
		'NES,Zelda,Пропущено,Не интересно,,',
		'NES,Контра,Пройдено,,,',
		'SMD,Соник 2,Реролльнуто,Рандом дал дубль,,',
		'SMD,Алоха,Пройдено,,,да',
	].join('\n');

	it('собирает категории по платформам и считает статистику', () => {
		const data = parseSoloCsv(CSV, {}, 'стример');

		expect(data.player).toBe('стример');
		expect(data.categories.map((category) => category.platform)).toEqual(['NES', 'SMD']);

		const nes = data.categories[0];
		expect(nes.stats).toEqual({ completed: 2, reroll: 1, skip: 1 });
		expect(nes.rows).toHaveLength(4);

		const smd = data.categories[1];
		expect(smd.stats).toEqual({ completed: 1, reroll: 1, skip: 0 });
		expect(smd.current?.game).toBe('Алоха');
		expect(smd.current?.action).toBe('completed');
	});

	it('считает итоги по всем платформам', () => {
		const data = parseSoloCsv(CSV);
		expect(data.total).toEqual({ completed: 3, reroll: 2, skip: 1 });
	});

	it('подтягивает причину для скипа/реролла, для пройденных — нет', () => {
		const data = parseSoloCsv(CSV);
		const rows = data.categories.flatMap((category) => category.rows);
		expect(rows.find((row) => row.game === 'Battletoads')?.reason).toBe('Слишком сложно');
		expect(rows.find((row) => row.game === 'Соник 2')?.reason).toBe('Рандом дал дубль');
		expect(rows.find((row) => row.game === 'Супер Марио 3')?.reason).toBeUndefined();
	});

	it('подтягивает описание игры, если колонка есть', () => {
		const data = parseSoloCsv(CSV);
		const rows = data.categories.flatMap((category) => category.rows);
		expect(rows.find((row) => row.game === 'Супер Марио 3')?.description).toBe('Классика платформера');
		expect(rows.find((row) => row.game === 'Battletoads')?.description).toBe('Знаменитый бобёр-переросток');
		expect(rows.find((row) => row.game === 'Zelda')?.description).toBeUndefined();
	});

	it('кидает ошибку при отсутствии обязательных колонок', () => {
		expect(() => parseSoloCsv('Платформа,Игра\nNES,Марио\n')).toThrow('Не найдены');
	});

	it('игнорирует строки с нераспознанным статусом', () => {
		const data = parseSoloCsv(['Платформа,Игра,Статус', 'NES,Марио,Пройдено', 'NES,Хз,Начал проходить'].join('\n'));
		expect(data.total.completed).toBe(1);
		expect(data.categories.flatMap((category) => category.rows)).toHaveLength(1);
	});

	it('находит заголовки под «шапкой» платформ (реальная таблица стримера)', () => {
		const withHeader = [
			',NES * PS1 * SNES * STEAM * SMD+2 * N64 * 3DO * PS2 * ZXspec * DOS,',
			',Дата,Платформа,Мод,Игра,Результат,Примечание,,Инвентарь,,Цена,Событие,Описание,Результат',
			',31.08.2026,,,,,Хорошая игра.,,Рерол,,300,Спецролл,Крутите Спецролл,',
			',,NES,,Stant Kids,Реролл,"прикольная, но она не проходима",,,,,600,Генезиздас,Доп две игра для сеги,',
			',,NES,,World Class Track Meet,Реролл,Спорт,,,,900,Дроп-позор,,',
			',,NES,,Jiqiren Dazhan,Реролл,Японский,,,,,,,',
			',,NES,,Bao Qingtian (NES),Пройдено,Китайский Волгар Викинг оценка 7/10,,Дроп,,,,,',
		].join('\n');

		const data = parseSoloCsv(withHeader);

		expect(data.categories.map((category) => category.platform)).toEqual(['NES']);
		expect(data.total).toEqual({ completed: 1, reroll: 3, skip: 0 });
		const rows = data.categories[0].rows;
		expect(rows).toHaveLength(4);
		expect(rows[0].game).toBe('Stant Kids');
		expect(rows[0].action).toBe('reroll');
		expect(rows[0].reason).toBe('прикольная, но она не проходима');
		expect(rows.find((row) => row.game === 'Bao Qingtian (NES)')?.action).toBe('completed');
		// Строка-дата без игры и строки без статуса игнорируются.
		expect(rows.some((row) => row.game === '')).toBe(false);
	});

	it('игнорирует произвольную шапку из нескольких мусорных строк', () => {
		const csv = [
			'SEASON 12, Solo RGG, 2026',
			'стример: XaKoH; таблица: игры по платформам',
			'',
			'Платформа,Игра,Статус,Причина',
			'NES,Марио,Пройдено,Классика',
			'PS1,Крэш,Реролл,Глючит',
		].join('\n');

		const data = parseSoloCsv(csv);

		expect(data.categories.map((category) => category.platform)).toEqual(['NES', 'PS1']);
		expect(data.total).toEqual({ completed: 1, reroll: 1, skip: 0 });
		expect(data.categories[0].rows[0].game).toBe('Марио');
		expect(data.categories[1].rows[0].reason).toBe('Глючит');
	});
});
