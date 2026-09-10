import { describe, expect, it } from 'vitest';
import { categoryFromText, parseCsv, parseSheetCsv } from './sheets.parser';

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
