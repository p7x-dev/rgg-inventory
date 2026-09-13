/* eslint-disable max-len -- короткие inline-SVG фрагменты */
/**
 * Глифы-символы для иконок предметов RGG Land.
 *
 * Каждый глиф — компактный SVG-фрагмент в координатах 24×24, рисуется по центру
 * «окна» иконки поверх цветной подложки. Глиф выбирается по ключевым словам
 * в названии предмета (регулярные выражения), поэтому у всех 674 предметов
 * банка есть знак-символ, а не абстрактная заглушка.
 */

const dark = '#221744';
const fg = '#e6dbff';
const gold = '#ffd27d';

/** Небольшая пятиугольная дырочка-декор (не обязательно). */
const dot = `<circle r="1" fill="${gold}"/>`;

/** Полный перечень: regex → тело глифа (24×24, рисуется поверх окна). */
export const GLYPHS: ReadonlyArray<{ re: RegExp; body: string; key: string }> = [
	{
		key: 'верблюд/живность',
		re: /крыс|мыш/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="4" y="15" width="6" height="3" rx="1.5"/><rect x="14" y="15" width="6" height="3" rx="1.5"/>
		 <rect x="6" y="9" width="12" height="8" rx="4"/>
		 <circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/>
		 <rect x="12" y="17" width="2" height="2"/></g>`,
	},
	{
		key: 'свинья',
		re: /свинь|хрюшк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="5" y="13" width="4" height="6" rx="2"/><rect x="15" y="13" width="4" height="6" rx="2"/>
		 <rect x="4" y="10" width="16" height="7" rx="3.5"/>
		 <ellipse cx="12" cy="15" rx="3" ry="2" fill="${fg}"/>
		 <circle cx="10.5" cy="14.5" r="0.6"/><circle cx="13.5" cy="14.5" r="0.6"/>
		 <circle cx="8" cy="11.5" r="0.8"/><circle cx="16" cy="11.5" r="0.8"/></g>`,
	},
	{
		key: 'гремлин',
		re: /гремлин/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="6" y="5" width="4" height="6" rx="1"/><rect x="14" y="5" width="4" height="6" rx="1"/>
		 <rect x="5" y="11" width="14" height="9" rx="3"/>
		 <circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>
		 <rect x="10" y="18" width="4" height="2"/></g>`,
	},
	{
		key: 'птица/птичкерс',
		re: /птичкерс|птиц|утк|гус|голуб|ворон/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="11" cy="10" r="5"/>
		 <path d="M5 12 L2 15 L6 14 Z"/><rect x="7" y="8" width="2" height="3" rx="1"/>
		 <path d="M13 16 L12 21 L15 18 Z"/><path d="M15 18 L18 21 L14 19 Z"/></g>`,
	},
	{
		key: 'кот',
		re: /кот|кошк|хиган/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M8 7 L5 3 L9 6 Z"/><path d="M16 7 L19 3 L15 6 Z"/>
		 <circle cx="12" cy="12" r="7"/>
		 <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
		 <rect x="10" y="15" width="4" height="2" rx="1"/></g>`,
	},
	{
		key: 'змей/червь/дракон',
		re: /змей|червь|дракон|глист|питон/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M5 6 Q9 3 13 6 T20 8"/>
		 <path d="M5 17 Q9 20 13 17 T20 15"/>
		 <circle cx="18" cy="8" r="2"/>
		 <circle cx="20" cy="9" r="0.5" fill="${fg}"/></g>`,
	},
	{
		key: 'бомба/динамит',
		re: /бомб|динамит|детонатор|взрыв/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="14" r="7"/>
		 <rect x="15" y="5" width="2" height="5" rx="1"/>
		 <path d="M12 12 L14 15 L12 18 L10 15 Z" fill="${gold}"/>
		 <rect x="7" y="17" width="10" height="1.5" fill="${gold}"/></g>`,
	},
	{
		key: 'сундук',
		re: /лутбокс|сундук|ящик|коробк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="4" y="8" width="16" height="11" rx="1"/>
		 <rect x="4" y="11" width="16" height="2"/>
		 <rect x="10" y="6" width="4" height="5"/>
		 <circle cx="12" cy="14" r="1.2" fill="${gold}"/></g>`,
	},
	{
		key: 'кубик/d4',
		re: /кубик|d\s*\d|кости/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="8" y="6" width="8" height="12" rx="1.5"/>
		 <circle cx="11" cy="10" r="1"/><circle cx="14" cy="10" r="1"/>
		 <circle cx="12" cy="14" r="1"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/></g>`,
	},
	{
		key: 'оружие',
		re: /пистолет|ружь|автомат|винтовк|дробовик|пушк|катапульт|мортир|рогатк|револьвер|волын/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="3" y="10" width="18" height="3" rx="1"/>
		 <rect x="4" y="7" width="3" height="6" rx="1"/>
		 <path d="M20 10 L21 13 L18 11.5 Z"/>
		 <circle cx="8" cy="12" r="0.8" fill="${gold}"/></g>`,
	},
	{
		key: 'клинок/меч',
		re: /меч|топор|нож|клинк|лопат|секир|алебард/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 3 L14 3 L8 19 L5 21 Z"/>
		 <rect x="13" y="10" width="2" height="4" rx="1"/>
		 <path d="M4 19 L20 19 L18 21 L6 21 Z" fill="${gold}"/></g>`,
	},
	{
		key: 'ракета/ядро',
		re: /ракет|ядро|баллистич|аннигиляторн|снаряд|гранат/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M9 4 Q15 4 15 10 L15 19 L13 21 L9 19 L9 10 Q9 4 9 4 Z"/>
		 <rect x="17" y="15" width="4" height="2" fill="${gold}"/>
		 <rect x="17" y="19" width="4" height="2" fill="${gold}"/>
		 <circle cx="12" cy="10" r="1.5" fill="${gold}"/></g>`,
	},
	{
		key: 'огнемет/лассо/шнур',
		re: /огнемет|лассо|шнур|фитиль|лент|канат|верев/iu,
		body: `<g fill="none" stroke="${dark}" stroke-width="2">
		 <path d="M6 6 Q12 2 18 8"/><path d="M6 6 Q12 8 18 10"/>
		 <path d="M3 2 L2 6 L6 4 Z" fill="${gold}" stroke="none"/></g>`,
	},
	{
		key: 'кольцо/талисман',
		re: /кольц|талисман|печать|гем|алтарь|ритуал|кристалл|амулет/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="6"/>
		 <circle cx="12" cy="12" r="2.5" fill="${gold}"/>
		 <path d="M4 4 L8 6 L6 9 Z" fill="${gold}"/></g>`,
	},
	{
		key: 'монеты/мошна',
		re: /мошн|меш|кошел|монетк|монет/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 8 Q8 4 12 4 Q16 4 18 8 L18 18 Q18 20 16 20 H8 Q6 20 6 18 Z"/>
		 <path d="M6 10 L18 10"/>
		 <circle cx="12" cy="15" r="2" fill="${gold}"/></g>`,
	},
	{
		key: 'одежда',
		re: /шляп|сапог|башмак|каск|шарф|перчатк|ботинк|тапк/i,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="7" y="6" width="10" height="5" rx="2"/>
		 <rect x="5" y="11" width="14" height="4" rx="1.5"/>
		 <path d="M9 10 L14 10" stroke="${gold}" stroke-width="0.6"/></g>`,
	},
	{
		key: 'ключ/отмычка',
		re: /отмычк|ключ/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="6" y="14" width="4" height="6" rx="1"/>
		 <rect x="4" y="6" width="8" height="4" rx="1"/>
		 <rect x="12" y="6" width="3" height="4" rx="1"/>
		 <circle cx="6" cy="8" r="1"/><circle cx="10" cy="8" r="1"/></g>`,
	},
	{
		key: 'фея/маска',
		re: /фея|маск|карт|талон|дух/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="9" r="5"/>
		 <path d="M8 2 L9 5 L6 5 Z"/><path d="M16 2 L15 5 L18 5 Z"/>
		 <path d="M12 14 L9 20 L15 20 Z"/>
		 <rect x="10" y="12" width="4" height="3" fill="${gold}"/></g>`,
	},
	{
		key: 'зерно/еда',
		re: /пицц|шоколад|печень|булочк|кекс|мед|яблок|арбуз|берри|огурец|гриб|морковк|мясо|суп|каш|бутерброд|хот-дог|колбас|творог/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="13" r="7"/>
		 <rect x="12" y="4" width="2" height="4" rx="1"/>
		 <rect x="6" y="10" width="4" height="6" rx="1" fill="${gold}"/>
		 <circle cx="11" cy="12" r="1.2" fill="${gold}"/>
		 <circle cx="15" cy="15" r="1.2" fill="${gold}"/></g>`,
	},
	{
		key: 'зелье/бутылка',
		re: /зелье|отвар|бутылк|банк|сода|пиво|энергетик|напитк|морс|квас|сироп/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M7 6 L17 6 L17 9 L18 21 L6 21 L7 9 Z"/>
		 <rect x="10" y="4" width="4" height="2" rx="0.5"/>
		 <circle cx="12" cy="15" r="2.5" fill="${gold}"/>
		 <rect x="9" y="11" width="6" height="1" fill="${gold}"/></g>`,
	},
	{
		key: 'слёзы/капля',
		re: /слез|фиал|дождь|роса/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 4 Q15 10 15 14 Q15 17 12 19 Q9 17 9 14 Q9 10 12 4 Z"/>
		 <path d="M7 17 L3 21 M7 21 L3 17" stroke="${gold}" stroke-width="1"/></g>`,
	},
	{
		key: 'рога',
		re: /рог|корон/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M9 3 L4 10 L9 8 Z"/><path d="M15 3 L20 10 L15 8 Z"/>
		 <circle cx="12" cy="12" r="5"/>
		 <path d="M12 14 L7 20 M12 14 L14 19 M12 14 L10 21" stroke="${gold}" stroke-width="0.6"/></g>`,
	},
	{
		key: 'реролл/удача',
		re: /реролл|переброс|удач|случай|шанс|счастлив|фортун/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 3 L14 8 L20 8 L15 12 L17 18 L12 14 L7 18 L9 12 L4 8 L10 8 Z"/>
		 <path d="M12 8 L13.5 12.5 L12 15 L10.5 12.5 Z" fill="${gold}"/></g>`,
	},
	{
		key: 'колесо/механизм',
		re: /колесо|механизм|шестер|мотора/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="5"/>
		 <rect x="11" y="4" width="2" height="3" rx="1"/>
		 <rect x="17" y="11" width="3" height="2" rx="1"/>
		 <rect x="11" y="17" width="2" height="3" rx="1"/>
		 <rect x="4" y="11" width="3" height="2" rx="1"/>
		 <circle cx="12" cy="12" r="1.5" fill="${gold}"/></g>`,
	},
	{
		key: 'феникс/химера/мистика',
		re: /феникс|химер|ифрит|джинн|хаос|безум|вулкан|нечист|демон/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 3 Q16 6 16 10 Q16 14 13 16 Q17 19 20 18 Q18 16 20 14 Q19 11 15 11 Q16 7 12 3 Z"/>
		 <rect x="9" y="11" width="6" height="2" fill="${gold}"/>
		 <path d="M10 7 L12 9 L14 7 L12 5 Z" fill="${gold}"/></g>`,
	},
	{
		key: 'железо/цепь',
		re: /желез|цепь|скоб|гайк|винт/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="4" y="7" width="16" height="3" rx="1.5"/>
		 <rect x="4" y="14" width="16" height="3" rx="1.5"/>
		 <rect x="8" y="5" width="3" height="14" rx="1"/>
		 <rect x="13" y="5" width="3" height="14" rx="1"/></g>`,
	},
	{
		key: 'примат/питек',
		re: /питек|обезьян|горилл|шимпанз|примат/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="10" r="6"/>
		 <circle cx="13" cy="7" r="2.5" fill="${fg}"/>
		 <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
		 <path d="M12 16 L11 21 L13 21 Z"/></g>`,
	},
	{
		key: 'рыба',
		re: /рыба|рыбк|судак|щук|карп|лещ|скумбр|тунец|селед|окунец|треск|форел|морж/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M4 12 Q8 5 16 8 Q20 10 21 12 Q17 15 12 17 Q8 19 4 12 Z"/>
		 <path d="M15 12 L21 12 L18 9 L18 15 Z" fill="${gold}"/>
		 <circle cx="9" cy="11" r="1"/>
		 <rect x="17" y="8" width="2" height="2" rx="0.4" fill="${gold}"/></g>`,
	},
	{
		key: 'море/вода',
		re: /устриц|краб|креветк|осьминог|медуз|миди|ракушк|морск|водоросл|планктон/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M7 16 Q7 8 12 7 Q17 8 17 16 L17 20 H7 Z"/>
		 <path d="M7 10 Q4 9 4 12 Q4 14 7 13"/>
		 <path d="M17 10 Q20 9 20 12 Q20 14 17 13"/>
		 <circle cx="12" cy="14" r="1.5" fill="${gold}"/></g>`,
	},
	{
		key: 'насекомые',
		re: /шершн|пчел|шмел|бабочк|жук|мотыль|мух|кома|пряник/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="9.5" y="7" width="5" height="11" rx="2.5"/>
		 <circle cx="7" cy="11" r="3"/><circle cx="17" cy="11" r="3"/>
		 <circle cx="7" cy="11" r="1" fill="${gold}"/><circle cx="17" cy="11" r="1" fill="${gold}"/>
		 <circle cx="11" cy="14" r="0.6" fill="${fg}"/><circle cx="13.5" cy="14" r="0.6" fill="${fg}"/></g>`,
	},
	{
		key: 'механизм/кнопка',
		re: /кнопк|клавиш|переключат|шестеренк|педаль/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="6"/>
		 <circle cx="12" cy="12" r="3" fill="${gold}"/>
		 <rect x="12" y="4" width="2" height="5" rx="1"/>
		 <rect x="15" y="8" width="2" height="4" rx="1"/></g>`,
	},
	{
		key: 'навигатор/компас',
		re: /компас|навигатор|указател|стрелк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="7"/>
		 <path d="M12 7 L14 12 L9 12 Z" fill="${gold}"/>
		 <path d="M12 17 L13 13 L11 13 Z" fill="${gold}"/>
		 <circle cx="12" cy="12" r="0.8" fill="${fg}"/></g>`,
	},
	{
		key: 'перец/маслина',
		re: /перчик|перц|маслин|оливк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 4 Q16 8 16 13 Q16 18 12 20 Q8 18 8 13 Q8 8 12 4 Z"/>
		 <circle cx="12" cy="13" r="2.5" fill="${gold}"/>
		 <path d="M8 5 L5 9" stroke="${gold}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'ягода/яйцо',
		re: /клубничк|черничк|земляничк|вишенк|крыжовник|смородинк|ежевик|брусник|клюкв/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 5 Q18 9 18 15 Q18 20 12 20 Q6 20 6 15 Q6 9 12 5 Z"/>
		 <ellipse cx="12" cy="15" rx="3.5" ry="2.5" fill="${gold}"/>
		 <circle cx="9" cy="13" r="0.8" fill="${gold}"/><circle cx="15" cy="13" r="0.8" fill="${gold}"/></g>`,
	},
	{
		key: 'икра/кубок',
		re: /икра|икрин|икр/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M5 8 Q8 5 12 5 Q16 5 19 8 L18 21 L6 21 Z"/>
		 <circle cx="12" cy="13" r="5" fill="${gold}"/>
		 <circle cx="12" cy="13" r="2.5" fill="${dark}"/></g>`,
	},
	{
		key: 'уголь/графит',
		re: /уголь|угля|графит/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M7 4 L17 4 L20 8 L19 20 L5 20 L4 8 Z" fill="${dark}"/>
		 <path d="M4 9 Q8 8 12 9 Q16 10 20 9 M5 20 Q10 19 19 20" stroke="${fg}" stroke-width="0.4"/>
		 <path d="M9 12 L15 12 M9 15 L15 15" stroke="${gold}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'варенье/банка',
		re: /варенье|варенья|сгущен|маринад|джем/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="7" y="8" width="10" height="12" rx="2"/>
		 <rect x="9" y="4" width="6" height="5" rx="1"/>
		 <rect x="7" y="11" width="10" height="3" fill="${gold}"/>
		 <circle cx="12" cy="17" r="1.5" fill="${gold}"/></g>`,
	},
	{
		key: 'гриб-вредный',
		re: /мухомор|поганк|трюфель|лисичк|сыроежк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M8 12 L8 21 M16 12 L16 21"/>
		 <path d="M6 8 Q12 3 18 8 L18 13 L6 13 Z"/>
		 <circle cx="9" cy="9" r="1" fill="${gold}"/>
		 <circle cx="13" cy="10" r="1" fill="${fg}"/>
		 <circle cx="15" cy="7" r="0.8" fill="${gold}"/></g>`,
	},
	{
		key: 'лягушка',
		re: /лягуш|жаб|квакш|могвай/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="11" cy="13" rx="6.5" ry="6"/>
		 <circle cx="8" cy="11" r="2.2"/><circle cx="14" cy="11" r="2.2"/>
		 <circle cx="8" cy="11" r="0.8" fill="${fg}"/><circle cx="14" cy="11" r="0.8" fill="${fg}"/>
		 <ellipse cx="11" cy="16" rx="2.5" ry="1.5" fill="${gold}"/></g>`,
	},
	{
		key: 'машина времени',
		re: /машин|двигател|варп|мотор/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="13" r="7"/>
		 <circle cx="12" cy="13" r="4" fill="${gold}"/>
		 <rect x="5" y="19" width="14" height="3" rx="1"/>
		 <path d="M12 8 L13.5 12.5 L12 16 L10.5 12.5 Z" fill="${dark}"/></g>`,
	},
	{
		key: 'хищная рыба/кит',
		re: /кит|акул|дельфин|моллюск|щук|карась|окун|минтай|килька|осетр|разрывн/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 10 Q12 6 18 9 L21 12 L18 15 Q12 18 6 14 Z"/>
		 <rect x="5" y="20" width="14" height="3" rx="1.5"/>
		 <path d="M15 12 L19 12 L17 10 L17 14 Z" fill="${gold}"/>
		 <circle cx="10" cy="12" r="1" fill="${fg}"/></g>`,
	},
	{
		key: 'молот/мьельнир',
		re: /мьёльнир|мьельнир|молот|кувалд/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="9" y="4" width="6" height="6" rx="1.5"/>
		 <rect x="11" y="9" width="2" height="7" rx="1"/>
		 <circle cx="12" cy="13" r="1" fill="${gold}"/></g>`,
	},
	{
		key: 'снег/мороз',
		re: /снежок|снег|мороз|холодн|лёд|льдинк|сустейн/iu,
		body: `<g fill="none" stroke="${dark}" stroke-width="1.4" stroke-linecap="round">
		 <path d="M12 4 L12 19 M7 8 L17 16 M17 8 L7 16"/>
		 <path d="M12 4 L14 6 M12 4 L10 6 M12 19 L14 17 M12 19 L10 17" stroke="${fg}" stroke-width="0.8"/>
		 <path d="M7 8 L9 9 M7 8 L8 6 M17 16 L15 15 M17 16 L16 18 M17 8 L15 9 M17 8 L16 6 M7 16 L9 15 M7 16 L8 18" stroke="${gold}" stroke-width="0.7" fill="none"/></g>`,
	},
	{
		key: 'космос/свет',
		re: /солнц|лун|комет|звездопад|метеор|сияни/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="5"/>
		 <path d="M12 3 L12 5 M12 19 L12 21 M3 12 L5 12 M19 12 L21 12 M6 6 L7.5 7.5 M16.5 16.5 L18 18 M18 6 L16.5 7.5 M7.5 16.5 L6 18" stroke="${gold}" stroke-width="1" />
		 <circle cx="12" cy="12" r="2" fill="${gold}"/></g>`,
	},
	{
		key: 'подарок/лот',
		re: /подарок|приз|билет|купон|халяв|сюрприз|award/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="5" y="9" width="14" height="11" rx="1.5"/>
		 <rect x="5" y="9" width="14" height="4" rx="1.5"/>
		 <path d="M12 6 L12 20" stroke="${gold}" stroke-width="1"/>
		 <path d="M9 8 Q10 5 12 5.5 Q14 5 15 8" fill="none" stroke="${gold}" stroke-width="1"/>
		 <circle cx="12" cy="12" r="0.8" fill="${gold}"/></g>`,
	},
	{
		key: 'одежда/броня',
		re: /броня|сапож|плащ|нагади|перчатк|шляп/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 6 L18 6 L16 20 L8 20 Z"/>
		 <path d="M6 10 L9 4 L15 4 L18 10" stroke="${gold}" stroke-width="0.7" fill="none"/>
		 <rect x="15" y="11" width="3" height="1.5" fill="${gold}"/></g>`,
	},
	{
		key: 'рычаг/вкл-выкл',
		re: /переключ|тумбл|вкл|hkпедаль/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="7" y="4" width="10" height="3" rx="1.5"/>
		 <path d="M12 7 L10 14 L14 14 Z" fill="${gold}"/>
		 <rect x="8" y="14" width="8" height="2" rx="1"/></g>`,
	},
	{
		key: 'планета/комета',
		re: /планет|галактик|туманност/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="6"/>
		 <rect x="2" y="11" width="20" height="2" fill="${gold}" opacity="0.6"/>
		 <path d="M6 6 L14 18 Q11 20 6 18 Z" fill="${gold}" opacity="0.5"/></g>`,
	},
	{
		key: 'пустота/вихрь',
		re: /пустот|вихрь|воронк|круговерт/iu,
		body: `<g fill="none" stroke="${dark}" stroke-width="1.3" stroke-linecap="round">
		 <path d="M12 5 Q16 12 12 19 Q8 12 12 5 Z"/>
		 <path d="M12 5 Q9 12 12 19" stroke="${gold}" stroke-width="0.8" fill="none" opacity="0.6"/></g>`,
	},
	{
		key: 'лотерея/судьба',
		re: /жетон|бусина|символ|судьб/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="4" y="10" width="8" height="10" rx="1"/>
		 <rect x="12" y="10" width="8" height="10" rx="1"/>
		 <rect x="8" y="4" width="8" height="8" rx="1"/>
		 <rect x="8" y="12" width="4" height="1.5" fill="${gold}"/>
		 <rect x="8" y="15.5" width="4" height="1.5" fill="${gold}"/>
		 <rect x="7" y="7" width="4" height="2" fill="${gold}"/></g>`,
	},
	{
		key: 'оружие-энерго',
		re: /плазмаган|лазер|рельсотрон|шредер|оружинатор|плазмоган|фаерболл|инферно/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="3" y="11" width="16" height="3" rx="1"/>
		 <rect x="5" y="8" width="2" height="7" rx="1"/>
		 <path d="M19 12 L22 10 L22 14 Z" fill="${gold}"/>
		 <circle cx="9" cy="12.5" r="0.7" fill="${gold}"/><circle cx="13" cy="12.5" r="0.7" fill="${gold}"/></g>`,
	},
	{
		key: 'торт/праздник',
		re: /торт|праздник|колобок|матреш/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 12 L18 12 L17 21 L7 21 Z"/>
		 <path d="M6 12 L18 12 L16.5 9 L7.5 9 Z"/>
		 <circle cx="8" cy="10" r="0.8" fill="${gold}"/><circle cx="12" cy="10" r="0.8" fill="${gold}"/><circle cx="16" cy="10" r="0.8" fill="${gold}"/>
		 <path d="M6 16 L18 16" stroke="${gold}" stroke-width="0.6"/></g>`,
	},
	{
		key: 'анти-, зеркало',
		re: /анти|зеркальн|отражени/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="8" y="4" width="8" height="16" rx="1.5"/>
		 <path d="M9 6 L15 6 M9 10 L15 10 M9 14 L15 14 M9 18 L15 18" stroke="${gold}" stroke-width="0.6"/></g>`,
	},
	{
		key: 'мед/сладкое',
		re: /мед|конфет|карамель|ириск|леденец/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 8 Q12 4 18 8 Z"/>
		 <path d="M6 9 L18 9 L17 14 L7 14 Z" fill="${gold}"/>
		 <path d="M7 14 Q6 18 7 20 Q12 22 17 20 Q18 16 17 14 Z"/>
		 <rect x="8" y="11" width="8" height="1.5" fill="${dark}"/></g>`,
	},
	{
		key: 'огонь/магия',
		re: /сапресс|пламя|магм|вспышк|взрывн/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M10 21 Q6 16 8 12 Q9 9 12 8 Q11 11 12 12 Q14 10 14 7 Q16 11 16 14 Q18 10 19 12 Q20 15 17 19 Q15 21 10 21 Z" fill="${gold}"/></g>`,
	},
	{
		key: 'деньги/билет',
		re: /кэшбек|кредит|руб|ценник/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="4" y="6" width="16" height="12" rx="1"/>
		 <rect x="4" y="8" width="16" height="3" fill="${gold}"/>
		 <circle cx="12" cy="14" r="2.2" fill="${dark}"/>
		 <path d="M8 7 L16 7 M8 18 L16 18" stroke="${fg}" stroke-width="0.4"/></g>`,
	},
	{
		key: 'паук/сеть',
		re: /паук\b|паутин|сетью|сеть/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="9" r="4"/>
		 <circle cx="11" cy="8" r="0.8" fill="${fg}"/><circle cx="13" cy="8" r="0.8" fill="${fg}"/>
		 <rect x="4" y="21" width="16" height="2" rx="1"/>
		 <path d="M5 10 L8 13 L8 18 L4 21 Z M19 10 L16 13 L16 18 L20 21 Z M12 13 L9 21 M12 13 L15 21" stroke="${dark}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'гриб-съедобный',
		re: /гриб|шампиньон|мох/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M9 11 L9 21 M15 11 L15 21 Z"/>
		 <path d="M5 10 Q12 4 19 10 L16 13 L8 13 Z" fill="${dark}"/>
		 <path d="M8 13 L16 13 L15 21 L9 21 Z" fill="${dark}"/>
		 <rect x="10" y="13" width="4" height="3" fill="${gold}"/></g>`,
	},
	{
		key: 'жидкость/раствор',
		re: /растворител|распылител|глянец|масл/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M10 7 L14 7 L14 10 L17 21 L7 21 L10 10 Z"/>
		 <rect x="10" y="4" width="4" height="3" rx="1"/>
		 <path d="M8 14 L16 14 M10 18 L14 18" stroke="${gold}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'пекарня/хлеб',
		re: /багет|бублик|булочк|хлеб|корзина|булочная/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="14" rx="6" ry="4"/>
		 <path d="M12 4 Q16 6 17 9 Q14 7 12 4 Q10 7 7 9 Q8 6 12 4 Z"/>
		 <path d="M7 9 Q6 18 7 20 Q12 21 17 20 Q18 12 16 9" stroke="${fg}" stroke-width="0.5" fill="none"/></g>`,
	},
	{
		key: 'фрукт-экзот',
		re: /карамбола|гравиол|дуриан|маракуй|помело/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="14" r="7"/>
		 <path d="M12 3 Q14 6 12 8 Q10 6 12 3 Z" fill="${gold}"/>
		 <path d="M5 9 L8 12 M19 9 L16 12 M5 19 L8 16 M19 19 L16 16" stroke="${gold}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'змея/дракон',
		re: /гадюшник|гадюк|дракар|драгон|вайпер|аспид/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 4 Q10 4 12 8 T20 10 L22 16 L18 14 Q10 16 8 20 L4 18 Q8 14 6 12 Z"/>
		 <circle cx="6" cy="6" r="1.5" fill="${fg}"/>
		 <path d="M16 12 Q17 13 16 14" stroke="${fg}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'броня-шлем',
		re: /шлем|каск|воинс|рамб|нагадивш/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M7 10 Q7 4 12 4 Q17 4 17 10 L17 14 Q17 17 14 19 L14 21 L10 21 L10 19 Q7 17 7 14 Z"/>
		 <rect x="8" y="12" width="8" height="2" fill="${fg}"/>
		 <circle cx="7" cy="11" r="1" fill="${gold}"/><circle cx="17" cy="11" r="1" fill="${gold}"/></g>`,
	},
	{
		key: 'дейлик/квест',
		re: /дейлик|дейли|квест|задани/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="4" y="8" width="16" height="12" rx="1.5"/>
		 <path d="M4 8 L12 3 L20 8 Z"/>
		 <path d="M8 14 L16 14 M8 17 L13 17" stroke="${gold}" stroke-width="1"/>
		 <circle cx="12" cy="13" r="0.8" fill="${gold}"/></g>`,
	},
	{
		key: 'гибрид/чудо',
		re: /гибрид|химер|франкен|мутант/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="12" rx="5" ry="7"/>
		 <path d="M7 6 L4 2 M9 8 L7 4 M17 6 L20 2 M15 8 L17 4" stroke="${fg}" stroke-width="0.8"/>
		 <circle cx="10" cy="11" r="1" fill="${fg}"/><circle cx="14" cy="11" r="1" fill="${fg}"/>
		 <rect x="10" y="16" width="4" height="2" fill="${fg}"/></g>`,
	},
	{
		key: 'спирт/алкоголь',
		re: /алкоголь|настойк|бутылка к/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="9" y="9" width="6" height="12" rx="2"/>
		 <rect x="10" y="4" width="4" height="5" rx="1"/>
		 <rect x="9" y="14" width="6" height="3" fill="${gold}"/></g>`,
	},
	{
		key: 'деньги/безделушка',
		re: /купон|без/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="6" y="5" width="12" height="16" rx="0"/>
		 <rect x="6" y="5" width="12" height="2"/>
		 <rect x="4" y="9" width="16" height="2"/></g>`,
	},
	{
		key: 'палка/жезл',
		re: /палк|жезл/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 3 Q14 5 12 7 Q10 5 12 3 Z"/>
		 <rect x="9" y="6" width="3" height="16" rx="1.5"/>
		 <circle cx="14" cy="17" r="1" fill="${gold}"/></g>`,
	},
	{
		key: 'стакан/колба',
		re: /склянк|стекло|пробирк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="8" r="4"/>
		 <path d="M9 12 Q9 20 12 21 Q15 20 15 12 Z"/>
		 <path d="M9 14 L15 14" stroke="${gold}" stroke-width="0.6"/></g>`,
	},
	{
		key: 'головной убор',
		re: /кепк|фуражк|панамк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M5 9 Q12 4 19 9 L19 12 L5 12 Z"/>
		 <ellipse cx="12" cy="13" rx="7" ry="2"/>
		 <rect x="4" y="11" width="4" height="2" rx="1" fill="${gold}"/></g>`,
	},
	{
		key: 'конфета',
		re: /конфет|ириск/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="12" rx="6" ry="4"/>
		 <path d="M6 12 Q6 8 12 8 Q18 8 18 12" fill="${gold}"/>
		 <path d="M6 12 Q6 16 12 16" stroke="${fg}" stroke-width="0.4"/></g>`,
	},
	{
		key: 'pack/подарочный набор',
		re: /pack/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="4" y="10" width="16" height="10" rx="1.5"/>
		 <rect x="4" y="10" width="16" height="3" rx="1"/>
		 <path d="M12 5 L12 20" stroke="${gold}" stroke-width="1"/>
		 <path d="M9 7 Q9 5 12 5 Q15 5 15 7" fill="none" stroke="${gold}" stroke-width="0.9"/>
		 <circle cx="12" cy="13.5" r="0.8" fill="${gold}"/></g>`,
	},
	{
		key: 'копьё/древковое',
		re: /копье|томагавк|бумеранг|дротик|секир/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M4 18 L20 4" stroke="${dark}" stroke-width="1.4"/>
		 <path d="M16 5 L20 3 L19 8 Z" fill="${gold}"/>
		 <circle cx="6" cy="16" r="1.5" fill="${gold}"/></g>`,
	},
	{
		key: 'пиранья/зубастая',
		re: /пирань|зуб|акул/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M4 12 Q9 4 16 8 L20 11 L16 14 Q9 18 4 12 Z"/>
		 <rect x="13" y="11" width="4" height="2" fill="${gold}"/>
		 <path d="M8 10 L7 12 L9 11 M9 13 L8 15 L10 14" stroke="${fg}" stroke-width="0.6" fill="none"/>
		 <circle cx="7" cy="10" r="0.8"/></g>`,
	},
	{
		key: 'цветок/ромашка',
		re: /ромашк|цветочк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="8" r="5"/>
		 <circle cx="12" cy="8" r="1.8" fill="${gold}"/>
		 <path d="M12 13 L12 19 M12 16 Q8 16 7 14 M12 16 Q16 16 17 14" stroke="${dark}" stroke-width="1"/>
		 <rect x="4" y="12" width="3" height="5" rx="1.5" fill="${gold}"/></g>`,
	},
	{
		key: 'обходешник/прохождение',
		re: /обходешник/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="4" y="7" width="16" height="12" rx="1.5"/>
		 <path d="M9 6 Q9 3 15 3 L15 7" fill="none" stroke="${dark}" stroke-width="1.3"/>
		 <path d="M9 12 L12 15 L15 12" fill="none" stroke="${gold}" stroke-width="1.2"/>
		 <rect x="4" y="7" width="16" height="2" fill="${gold}" opacity="0.5"/></g>`,
	},
	{
		key: 'мусор/хлам',
		re: /мусор|хлам|шредер/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 5 L18 5 L20 21 L4 21 Z" fill="${dark}"/>
		 <path d="M4 9 L20 9 M6 13 L18 13 M5 17 L19 17" stroke="${gold}" stroke-width="0.6"/>
		 <path d="M8 5 L10 2 L14 2 L16 5" stroke="${dark}" stroke-width="1" fill="none"/></g>`,
	},
	{
		key: 'карандаш/инструмент',
		re: /карандаш|ручк|маркер/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M5 19 L9 15 L15 21 L13 22 L6 22 Z"/>
		 <path d="M6 16 L8 21 L3 21 Z" fill="${gold}"/>
		 <path d="M16 4 L21 9 L10 20 L5 20 L5 15 Z" fill="${dark}"/></g>`,
	},
	{
		key: 'кнопка/клавиша',
		re: /кнопк|клавиш/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="5" y="8" width="14" height="8" rx="4"/>
		 <circle cx="12" cy="12" r="2.5" fill="${gold}"/>
		 <path d="M9 6 L15 6" stroke="${gold}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'масло/жир',
		re: /масл|жир/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="7" y="9" width="10" height="8" rx="2"/>
		 <path d="M7 9 Q12 2 17 9" fill="${gold}"/>
		 <circle cx="12" cy="13" r="1.2" fill="${dark}"/></g>`,
	},
	{
		key: 'инструмент/замок',
		re: /замок|открывалк|крючок|иголк|отмычк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="9" cy="14" r="5"/>
		 <path d="M9 9 L9 5 Q9 2 12 2 L12 8" stroke="${dark}" stroke-width="1.5" fill="none"/>
		 <rect x="14" y="9" width="2" height="10" rx="1"/>
		 <path d="M14 9 L18 12 L15 13 Z" fill="${gold}"/></g>`,
	},
	{
		key: 'блок/геометрия',
		re: /блок|квадрат|куб\b|кубическ|L-блок|S-блок/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M5 8 L12 4 L19 8 L19 16 L12 20 L5 16 Z" fill="${dark}"/>
		 <path d="M5 8 L12 12 L19 8 M12 12 L12 20" stroke="${gold}" stroke-width="0.7" fill="none"/></g>`,
	},
	{
		key: 'огонь/вспышка',
		re: /рокетджамп|разрывн|взрыв\b/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 3 L14 7 L19 5 L16 9 L21 12 L16 15 L19 19 L14 17 L12 21 L10 17 L5 19 L8 15 L3 12 L8 9 L5 5 L10 7 Z" fill="${gold}"/>
		 <circle cx="12" cy="12" r="2.5" fill="${dark}"/></g>`,
	},
	{
		key: 'кепка/сапог',
		re: /сапог|сапож|ботин|башмак/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M7 6 L17 6 L17 13 Q17 17 13 18 L13 22 L9 22 L9 18 Q7 16 7 13 Z" fill="${dark}"/>
		 <path d="M7 13 L17 13" stroke="${gold}" stroke-width="0.7"/>
		 <circle cx="10" cy="10" r="0.8" fill="${gold}"/></g>`,
	},
	{
		key: 'шерсть/нить',
		re: /ниточк|нить|клубок|пряж/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="13" r="7" fill="${dark}"/>
		 <path d="M12 6 Q17 8 15 13 Q13 17 8 15" fill="none" stroke="${gold}" stroke-width="1"/>
		 <path d="M18 18 L21 21 M18 21 L21 18" stroke="${dark}" stroke-width="1"/></g>`,
	},
	{
		key: 'дверь/скрытое',
		re: /подкоп|подмен|подарок|сговор|подозрительн/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="4" y="6" width="16" height="14" rx="1.5"/>
		 <rect x="8" y="6" width="2" height="14" fill="${gold}"/>
		 <circle cx="16" cy="13" r="1" fill="${gold}"/>
		 <path d="M4 10 L20 10" stroke="${dark}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'перо/крыло',
		re: /перо|крыл|перь/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M5 6 Q12 2 18 4 Q14 10 18 14 Q10 14 6 10 Q3 8 5 6 Z"/>
		 <path d="M12 4 L8 20 L12 16 L14 22" stroke="${dark}" stroke-width="1" fill="none"/></g>`,
	},
	{
		key: 'время/часы',
		re: /времени|часы|таймер|секундом/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="7"/>
		 <path d="M12 6 L12 12 L15 14" stroke="${gold}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
		 <circle cx="12" cy="12" r="0.8" fill="${gold}"/></g>`,
	},
	{
		key: 'птица/совиный',
		re: /сова|сови/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="7"/>
		 <path d="M9 8 L6 4 L10 7 Z M15 8 L18 4 L14 7 Z" fill="${gold}"/>
		 <circle cx="9.5" cy="12" r="1.8"/><circle cx="14.5" cy="12" r="1.8"/>
		 <circle cx="9.5" cy="12" r="0.7" fill="${fg}"/><circle cx="14.5" cy="12" r="0.7" fill="${fg}"/>
		 <path d="M10 16 Q12 14 14 16" stroke="${fg}" stroke-width="0.7" fill="none"/></g>`,
	},
	{
		key: 'свеча/лампочка',
		re: /ламп|фонар|свет|иллюмин/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="9" y="7" width="6" height="13" rx="2"/>
		 <path d="M12 4 Q13 6 12 7 Q11 6 12 4 Z" fill="${gold}"/>
		 <path d="M8 10 L6 10 M16 10 L18 10 M9 14 L7 14 M15 14 L17 14" stroke="${gold}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'животное/питомец',
		re: /питомец|домашн/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="14" rx="7" ry="6"/>
		 <circle cx="9" cy="11" r="3.5"/>
		 <path d="M7 9 L5 5 L9 8 Z M11 9 L13 5 L12 8 Z" fill="${gold}"/>
		 <circle cx="8" cy="10" r="0.8" fill="${fg}"/><circle cx="11" cy="10" r="0.8" fill="${fg}"/>
		 <rect x="12" y="14" width="4" height="2" rx="1"/></g>`,
	},
	{
		key: 'молитва/благословение',
		re: /молитва|благослов|колесу добра/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="14" r="6"/>
		 <circle cx="12" cy="14" r="2.5" fill="${gold}"/>
		 <path d="M12 3 L13.5 8 L18 8 L14.5 11 L16 16 L12 13 L8 16 L9.5 11 L6 8 L10.5 8 Z" fill="${gold}"/>
		 <path d="M3 19 L21 19" stroke="${gold}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'легендарное оружие',
		re: /мьельнир|громовержец|перун/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="10" y="4" width="4" height="8" rx="1"/>
		 <rect x="6" y="12" width="12" height="4" rx="1"/>
		 <path d="M4 6 L6 10 L8 6 L6 8 Z M16 6 L18 10 L20 6 L18 8 Z" fill="${gold}"/>
		 <rect x="10" y="16" width="4" height="5" rx="1"/></g>`,
	},
	{
		key: 'оружие-энерго/плазма',
		re: /плазма|лазер|рельс|энергетическ/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="3" y="11" width="15" height="3" rx="1"/>
		 <rect x="4" y="8" width="2" height="7" rx="1"/>
		 <path d="M18 12.5 L22 11 L22 14 Z" fill="${gold}"/>
		 <circle cx="10" cy="12.5" r="0.8" fill="${gold}"/></g>`,
	},
	{
		key: 'борщ/суп-свекла',
		re: /борщ|солянк|свекл|щи|уха/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M5 7 Q12 3 19 7 L18 20 L6 20 Z"/>
		 <path d="M5 7 Q12 10 19 7" stroke="${gold}" stroke-width="0.8" fill="none"/>
		 <circle cx="9" cy="13" r="1.2" fill="${gold}"/>
		 <circle cx="13" cy="16" r="1.2" fill="${gold}"/>
		 <path d="M6 9 Q12 12 18 9" stroke="${fg}" stroke-width="0.5" fill="none"/></g>`,
	},
	{
		key: 'шаурма/хлеб-лепёшка',
		re: /шаурм|шавух|лаваш|буррит|лепёшк|тортилья/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 5 L18 19 L6 19 Z" fill="${dark}"/>
		 <path d="M12 7 L16 17 L8 17 Z" fill="${gold}"/>
		 <path d="M9 10 Q11 9 13 10 M9 13 Q11 12 13 13" stroke="${fg}" stroke-width="0.7" fill="none"/></g>`,
	},
	{
		key: 'сыр/молочка',
		re: /сыр|творог|сметан|молок|йогурт|кефир|простокваш/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 9 L18 9 L20 18 L4 18 Z"/>
		 <circle cx="10" cy="13" r="1.3" fill="${gold}"/>
		 <circle cx="14" cy="15" r="1.3" fill="${gold}"/>
		 <rect x="8" y="9" width="3" height="3" fill="${fg}"/></g>`,
	},
	{
		key: 'пончик/батончик',
		re: /пончик|батончик|твикс|баунти|сникерс/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="6.5"/>
		 <circle cx="12" cy="12" r="2.5" fill="${gold}"/>
		 <path d="M12 4 Q15 6 15 9 Q12 11 9 9 Q9 6 12 4 Z" fill="${gold}"/></g>`,
	},
	{
		key: 'мясо/шашлык',
		re: /шашлык|шампур|фрикадель|сосиск|колбас|бекон|ветчин/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 18 L18 6" stroke="${dark}" stroke-width="1.3"/>
		 <circle cx="8" cy="14" r="2" fill="${gold}"/>
		 <circle cx="12" cy="10" r="2" fill="${gold}"/>
		 <circle cx="15" cy="7" r="1.8" fill="${gold}"/></g>`,
	},
	{
		key: 'фрукт-тропический',
		re: /ананас|апельсин|банан|дын|арбуз|манго|кокос|лимон|виноград|персик|абрикос/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="13" r="7"/>
		 <path d="M16 7 L17 3 M12 6 L12 2 M8 7 L7 3" stroke="${gold}" stroke-width="1"/>
		 <circle cx="12" cy="13" r="1.2" fill="${gold}"/></g>`,
	},
	{
		key: 'арбуз-вариант',
		re: /рбуз|арбус/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="13" rx="8" ry="6"/>
		 <path d="M4 13 Q12 2 20 13" stroke="${fg}" stroke-width="1"/>
		 <path d="M4 14 Q12 20 20 14" stroke="${fg}" stroke-width="0.8"/>
		 <circle cx="9" cy="14" r="1" fill="${gold}"/><circle cx="12" cy="17" r="1" fill="${gold}"/><circle cx="15" cy="14" r="1" fill="${gold}"/></g>`,
	},
	{
		key: 'овощ-свежий',
		re: /баклажан|редис|сельдере|хрен|чеснок|фасоль|тыкв|томат|кабачк|капуст|морков|огурец|лук/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M8 7 Q12 3 16 7 Q17 13 14 19 Q12 21 10 19 Q7 13 8 7 Z"/>
		 <path d="M6 5 L8 8 M18 5 L16 8" stroke="${gold}" stroke-width="0.8"/>
		 <circle cx="12" cy="13" r="1" fill="${gold}"/></g>`,
	},
	{
		key: 'напиток/кола',
		re: /кока-кола|нюка-кола|кола|лимонад|квас|морс/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="8" y="7" width="8" height="13" rx="2"/>
		 <rect x="10" y="4" width="4" height="4" rx="1"/>
		 <path d="M8 10 L16 10 M8 13 L16 13 M8 16 L16 16" stroke="${gold}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'спиртное',
		re: /вино|ром|шнапс|самогон|ликер|пиво\b/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M7 5 L17 5 L17 8 L18 21 L6 21 L7 8 Z"/>
		 <rect x="10" y="5" width="4" height="4" rx="1"/>
		 <path d="M9 12 L15 12 M9 15 L15 15" stroke="${gold}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'кофе/чай',
		re: /кофе|чай|какао/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="6" y="8" width="11" height="10" rx="2"/>
		 <path d="M17 10 Q20 10 20 13 Q20 16 17 16" fill="none" stroke="${dark}" stroke-width="1.2"/>
		 <path d="M8 8 Q12 4 15 8" stroke="${gold}" stroke-width="1" fill="none"/>
		 <path d="M6 13 L17 13" stroke="${gold}" stroke-width="0.6"/></g>`,
	},
	{
		key: 'рука/ладонь',
		re: /рука|ладон|кулак/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="8" y="4" width="4" height="7" rx="2"/>
		 <rect x="12" y="2" width="4" height="9" rx="2"/>
		 <rect x="4" y="9" width="16" height="4" rx="2"/>
		 <rect x="5" y="13" width="14" height="7" rx="2"/></g>`,
	},
	{
		key: 'оружие-булава',
		re: /булав|моргенштерн/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="10" y="6" width="4" height="14" rx="2"/>
		 <circle cx="12" cy="4" r="4" fill="${dark}"/>
		 <circle cx="12" cy="4" r="1.5" fill="${gold}"/>
		 <path d="M8 4 L16 4 M12 0 L12 8" stroke="${gold}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'броня/щит',
		re: /щит|броня|доспех|панцир|бронежилет/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 2 L19 5 L19 13 Q19 19 12 22 Q5 19 5 13 L5 5 Z" fill="${dark}"/>
		 <path d="M12 4 L17 6 L17 13 Q17 17 12 19 Q7 17 7 13 L7 6 Z" fill="${gold}"/>
		 <circle cx="12" cy="11" r="2" fill="${dark}"/></g>`,
	},
	{
		key: 'мешок/сумка',
		re: /меш|сумк|рюкзак|кошел/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 9 Q9 5 12 5 Q15 5 18 9 L18 19 Q18 21 16 21 H8 Q6 21 6 19 Z"/>
		 <path d="M6 12 L18 12"/>
		 <path d="M10 5 Q10 2 12 2 Q14 2 14 5" stroke="${dark}" stroke-width="1" fill="none"/>
		 <circle cx="12" cy="16" r="1.5" fill="${gold}"/></g>`,
	},
	{
		key: 'сейв/зона',
		re: /сейв|защитн/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 3 L19 6 L19 12 Q19 17 12 21 Q5 17 5 12 L5 6 Z"/>
		 <path d="M12 7 L16 9 L16 12 Q16 15 12 17 Q8 15 8 12 L8 9 Z" fill="${gold}"/>
		 <circle cx="12" cy="12" r="1" fill="${dark}"/></g>`,
	},
	{
		key: 'животное-мелкое',
		re: /хомяк|ежик|крот|бурундук|белк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="13" rx="7" ry="5.5"/>
		 <circle cx="9" cy="11" r="3"/>
		 <circle cx="7.5" cy="9.5" r="0.9" fill="${fg}"/><circle cx="10.5" cy="9.5" r="0.9" fill="${fg}"/>
		 <rect x="11" y="14" width="4" height="2" rx="1" fill="${gold}"/></g>`,
	},
	{
		key: 'осёл/ишачок',
		re: /осли|ишак|осёл/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="15" rx="6" ry="5"/>
		 <rect x="8" y="10" width="3" height="5" rx="1"/>
		 <rect x="6" y="12" width="2" height="3" rx="1"/>
		 <circle cx="10" cy="12" r="1"/><circle cx="15" cy="13" r="1"/>
		 <path d="M12 20 L12 23 M10 20 L10 22 M14 20 L14 22" stroke="${dark}" stroke-width="1"/></g>`,
	},
	{
		key: 'обмен/реролл-спец',
		re: /обмен|переработ|перерабатыв/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M4 10 Q8 4 14 5 L14 3 L18 7 L14 9 L14 7 Q9 6.5 7 10 Z" fill="${gold}"/>
		 <path d="M20 14 Q16 20 10 19 L10 21 L6 17 L10 15 L10 17 Q15 17.5 17 14 Z" fill="${gold}"/>
		 <rect x="3" y="12" width="18" height="2" stroke="${fg}" stroke-width="0.4"/></g>`,
	},
	{
		key: 'печка/лаборатория',
		re: /плавильн|печь|лаборатори|алхим/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="5" y="9" width="14" height="12" rx="2"/>
		 <path d="M5 9 Q5 5 12 5 Q19 5 19 9" fill="none" stroke="${dark}" stroke-width="1.2"/>
		 <rect x="9" y="13" width="6" height="5" rx="1.5" fill="${gold}"/>
		 <path d="M9 15 L15 15" stroke="${dark}" stroke-width="0.6"/></g>`,
	},
	{
		key: 'сброс/обмен-стрелки',
		re: /решаффл|перетас|сброс/iu,
		body: `<g fill="none" stroke="${dark}" stroke-width="1.3" stroke-linecap="round">
		 <path d="M5 8 Q8 4 12 4 Q16 4 19 8"/>
		 <path d="M19 12 Q19 16 15 19 L12 19 M19 12 L19 16" stroke="${gold}" stroke-width="1.1" fill="none"/>
		 <path d="M12 22 L14 20 M12 22 L10 20" stroke="${dark}" stroke-width="1"/></g>`,
	},
	{
		key: 'неизвестный артефакт',
		re: /крисалид|ракерищ|хорадрич|стар платинум|квантов|странн/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="6.5"/>
		 <circle cx="12" cy="12" r="3" fill="${gold}"/>
		 <path d="M12 4 L14 8 L19 8 L15 11 L17 16 L12 13 L7 16 L9 11 L5 8 L10 8 Z" fill="${gold}"/></g>`,
	},
	{
		key: 'дерево/растение',
		re: /дерев|куст|пень\b|корень/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M11 21 L11 13 L9 15 L7 13 L11 8 L11 4 L13 4 L13 8 L17 13 L15 15 L13 13 L13 21 Z" fill="${dark}"/>
		 <rect x="8" y="21" width="8" height="2" rx="1" fill="${gold}"/></g>`,
	},
	{
		key: 'камень/самоцвет',
		re: /камень|алмаз|сапфир|рубин|изумруд|топаз|кварц|графит/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 3 L17 7 L17 17 L12 21 L7 17 L7 7 Z" fill="${gold}"/>
		 <path d="M7 7 L17 7 M12 3 L12 21 M7 17 L12 21 L17 17" stroke="${fg}" stroke-width="0.5" fill="none"/></g>`,
	},
	{
		key: 'шкатулка/ларчик',
		re: /шкатулк|ларчик|сундучок/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="5" y="10" width="14" height="10" rx="1.5"/>
		 <path d="M5 10 Q5 6 12 6 Q19 6 19 10" fill="none" stroke="${dark}" stroke-width="1.2"/>
		 <circle cx="12" cy="14" r="1.5" fill="${gold}"/>
		 <rect x="5" y="13" width="14" height="1.5" fill="${fg}" opacity="0.4"/></g>`,
	},
	{
		key: 'вата/пушистое',
		re: /вата|пух|облако/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M5 16 Q4 11 9 10 Q9 6 14 8 Q17 5 19 9 Q22 9 21 14 Q20 18 15 18 L7 18 Z" fill="${gold}"/>
		 <path d="M9 13 Q11 12 13 13 M10 15 Q12 14 14 15" stroke="${dark}" stroke-width="0.8" fill="none"/></g>`,
	},
	{
		key: 'вода/жидкость',
		re: /вода|жидкост|раствор|микстур/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 4 Q15 9 15 13 Q15 17 12 19 Q9 17 9 13 Q9 9 12 4 Z"/>
		 <path d="M7 19 Q9 21 12 21 Q15 21 17 19" stroke="${gold}" stroke-width="1" fill="none"/></g>`,
	},
	{
		key: 'пропеллер/механизм-летающий',
		re: /пропеллер|вертолет|винтокрыл/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="5" rx="8" ry="2.2" fill="${gold}"/>
		 <rect x="11" y="6" width="2" height="12" rx="1"/>
		 <path d="M9 10 L7 19 L11 14 Z M15 10 L17 19 L13 14 Z" fill="${dark}"/>
		 <rect x="9" y="18" width="6" height="3" rx="1" fill="${gold}"/></g>`,
	},
	{
		key: 'магический посох',
		re: /посох|жезл|волшебн|магическ/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="10" y="4" width="3" height="16" rx="1.5"/>
		 <circle cx="11.5" cy="3.5" r="2.5" fill="${gold}"/>
		 <path d="M10 9 L8 12 L10 15 M14 9 L16 12 L14 15" stroke="${fg}" stroke-width="0.7" fill="none"/></g>`,
	},
	{
		key: 'джокер/карта-джокер',
		re: /джокер|карт\b|шут/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="5" y="4" width="14" height="17" rx="2"/>
		 <rect x="5" y="4" width="14" height="3" fill="${gold}"/>
		 <path d="M12 11 Q14 12 14 14 Q14 16 12 17 Q10 16 10 14 Q10 12 12 11 Z" fill="${gold}"/>
		 <path d="M9 9 L15 9 M9 19 L15 19" stroke="${fg}" stroke-width="0.6"/></g>`,
	},
	{
		key: 'оружие-холодное',
		re: /шпаг|рапир|сабл|меч\b|клин/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 3 L14 3 L8 20 L5 22 Z"/>
		 <rect x="13" y="10" width="2" height="5" rx="1" fill="${gold}"/>
		 <path d="M4 20 L20 20 L18 22 L6 22 Z" fill="${gold}"/></g>`,
	},
	{
		key: 'хомяк-домашний',
		re: /хомяк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="14" rx="6.5" ry="6"/>
		 <circle cx="8" cy="11" r="2.5"/><circle cx="16" cy="11" r="2.5"/>
		 <circle cx="8" cy="11" r="0.8" fill="${fg}"/><circle cx="16" cy="11" r="0.8" fill="${fg}"/>
		 <ellipse cx="12" cy="17" rx="2" ry="1.3" fill="${gold}"/></g>`,
	},
	{
		key: 'черепаха/панцирь',
		re: /черепах/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="13" rx="7" ry="5.5"/>
		 <path d="M12 8 L15 13 L12 18 L9 13 Z" fill="${gold}"/>
		 <circle cx="12" cy="13" r="1" fill="${dark}"/>
		 <rect x="5" y="11" width="2" height="3" rx="1"/><rect x="17" y="11" width="2" height="3" rx="1"/></g>`,
	},
	{
		key: 'мышь/паразит',
		re: /паразит|глист/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M5 14 Q9 10 14 12 T21 10" stroke="${dark}" stroke-width="1.3" fill="none"/>
		 <path d="M8 14 L7 12 L9 13 M12 16 L11 14 L13 15" stroke="${gold}" stroke-width="0.7" fill="none"/>
		 <circle cx="17" cy="12" r="1" fill="${gold}"/></g>`,
	},
	{
		key: 'рулетка/игра-случай',
		re: /рулетк|колесо\b/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="8"/>
		 <circle cx="12" cy="12" r="2" fill="${gold}"/>
		 <path d="M12 4 L14 8 L10 8 Z" fill="${gold}"/>
		 <path d="M12 12 L16 10" stroke="${dark}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'утка/гусь',
		re: /утк|гусь|гус\b|гусён/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="10" r="5"/>
		 <path d="M6 12 L3 15 L7 14 Z"/>
		 <rect x="13" y="8" width="3" height="4" rx="1" fill="${gold}"/>
		 <path d="M10 15 L9 21 L12 18 L14 21 L13 15 Z"/></g>`,
	},
	{
		key: 'сюрстремминг/рыба-гнилая',
		re: /сюрстреминг/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="6" y="6" width="12" height="15" rx="2"/>
		 <rect x="9" y="2" width="6" height="5" rx="1.5"/>
		 <path d="M6 11 L18 11" stroke="${gold}" stroke-width="0.8"/>
		 <path d="M8 15 Q12 13 16 15" stroke="${fg}" stroke-width="0.6" fill="none"/></g>`,
	},
	{
		key: 'свинья-спец',
		re: /спецсвин|свиномет/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="5" y="12" width="4" height="7" rx="2"/><rect x="15" y="12" width="4" height="7" rx="2"/>
		 <rect x="4" y="9" width="16" height="7" rx="3.5"/>
		 <ellipse cx="12" cy="13" rx="2.5" ry="2" fill="${gold}"/>
		 <circle cx="10" cy="12" r="0.6"/><circle cx="14" cy="12" r="0.6"/></g>`,
	},
	{
		key: 'банка/консерва',
		re: /банка|консерв|тушенк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="7" y="8" width="10" height="12" rx="2"/>
		 <rect x="7" y="11" width="10" height="3" fill="${gold}"/>
		 <circle cx="12" cy="16" r="1.2" fill="${gold}"/></g>`,
	},
	{
		key: 'молоко/сгущёнка',
		re: /сгущёнк|сгущенк|молоко/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 8 Q8 3 12 3 Q16 3 18 8 L17 21 L7 21 Z"/>
		 <path d="M8 12 L16 12 M8 15 L16 15" stroke="${gold}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'мешок-золото',
		re: /купюра|деньг|монет/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="6" y="9" width="12" height="10" rx="1"/>
		 <rect x="6" y="9" width="12" height="3" fill="${gold}"/>
		 <circle cx="12" cy="15" r="2.5"/>
		 <path d="M9 10 L15 10" stroke="${fg}" stroke-width="0.5"/></g>`,
	},
	{
		key: 'банка-жесть',
		re: /жесть|консерв/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="8" y="4" width="8" height="3" rx="1"/>
		 <rect x="7" y="7" width="10" height="13" rx="1.5"/>
		 <rect x="7" y="10" width="10" height="2" fill="${gold}"/>
		 <circle cx="12" cy="16" r="1" fill="${gold}"/></g>`,
	},
	{
		key: 'пентаграмма/мистика',
		re: /пентаграмм|пентакл/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="7.5" fill="none" stroke="${fg}" stroke-width="0.5"/>
		 <path d="M12 5 L14.5 17 L5 11 L19 11 L9.5 17 Z" fill="none" stroke="${gold}" stroke-width="1"/>
		 <circle cx="12" cy="12" r="0.9" fill="${gold}"/></g>`,
	},
	{
		key: 'клюв/нос',
		re: /клюв/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M5 8 Q12 6 19 8 Q19 13 12 16 Q5 13 5 8 Z" fill="${gold}"/>
		 <path d="M9 9 L14 12" stroke="${dark}" stroke-width="0.8"/>
		 <circle cx="8" cy="10" r="0.8"/><circle cx="15" cy="11" r="0.8"/></g>`,
	},
	{
		key: 'буквы/символы-ЪЬ',
		re: /^[ЪЬ]$/u,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="6" y="5" width="12" height="15" rx="2"/>
		 <path d="M9 5 L9 11 L15 11 L15 20 L9 20" fill="none" stroke="${gold}" stroke-width="1.2"/>
		 <circle cx="9" cy="8" r="0.8" fill="${gold}"/></g>`,
	},
	{
		key: 'шум/глитч',
		re: /о̕|ш͡|и̕|б͏/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="4" y="6" width="16" height="3" fill="${gold}"/>
		 <rect x="6" y="10" width="13" height="3" fill="${gold}"/>
		 <rect x="5" y="14" width="15" height="3" fill="${gold}"/>
		 <rect x="8" y="18" width="9" height="3" fill="${gold}"/></g>`,
	},
	{
		key: 'кабачок/брокколи',
		re: /кабач|брокколи|цветная|кукумб|огурч/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="9" y="4" width="2" height="4" rx="1"/>
		 <ellipse cx="12" cy="14" rx="6" ry="8"/>
		 <path d="M6 14 Q6 10 12 10 Q18 10 18 14" stroke="${gold}" stroke-width="0.8" fill="none"/>
		 <rect x="6" y="12" width="12" height="1" fill="${gold}"/></g>`,
	},
	{
		key: 'лук-оборотень/лук',
		re: /лук/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="13" r="5.5" fill="none" stroke="${dark}" stroke-width="1.3"/>
		 <circle cx="12" cy="13" r="1" fill="${gold}"/>
		 <path d="M6 13 L8 13 M16 13 L18 13 M12 6 L12 8 M12 18 L12 20" stroke="${dark}" stroke-width="1"/></g>`,
	},
	{
		key: 'птица-курица',
		re: /куриц|петух|цыпленок/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="11" cy="10" r="5"/>
		 <path d="M5 12 L2 15 L6 14 Z"/><rect x="7" y="8" width="2" height="3" rx="1"/>
		 <path d="M13 16 L12 21 L15 18 Z"/><path d="M15 18 L18 21 L14 19 Z"/>
		 <circle cx="14" cy="14" r="1.5" fill="${gold}"/></g>`,
	},
	{
		key: 'хищник-птица',
		re: /ястреб|сокол|орёл\b/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 3 L15 8 L20 6 L16 11 L20 13 L14 12 L15 18 L11 13 L9 21 L7 12 L2 12 L6 10 L4 5 Z" fill="${dark}"/>
		 <circle cx="12" cy="10" r="1.5" fill="${gold}"/></g>`,
	},
	{
		key: 'кот-манул',
		re: /манул|дикий кот/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M8 7 L5 3 L9 6 Z"/><path d="M16 7 L19 3 L15 6 Z"/>
		 <circle cx="12" cy="12" r="7"/>
		 <path d="M9 15 Q12 12 15 15 Q12 18 9 15 Z" fill="${gold}"/>
		 <circle cx="9" cy="12" r="0.8"/><circle cx="15" cy="12" r="0.8"/></g>`,
	},
	{
		key: 'цветок-роза',
		re: /роза|розочк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 5 Q15 5 15 8 Q15 11 12 12 Q9 11 9 8 Q9 5 12 5 Z" fill="${gold}"/>
		 <path d="M12 12 Q14 13 13 16 Q11 18 9 16 Q8 13 12 12 Z" fill="${gold}"/>
		 <path d="M12 12 L12 20 M12 16 Q8 16 7 14 M12 16 Q16 16 17 14" stroke="${dark}" stroke-width="1"/></g>`,
	},
	{
		key: 'карты-таро',
		re: /таро|гадани|карт\b/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="7" y="4" width="12" height="17" rx="2"/>
		 <rect x="7" y="4" width="12" height="3" fill="${gold}"/>
		 <circle cx="13" cy="13" r="3.5" fill="none" stroke="${gold}" stroke-width="1"/>
		 <path d="M13 10 L13 16 M10 13 L16 13" stroke="${gold}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'волчок/юла',
		re: /юла|волчок/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 4 L17 20 L7 20 Z" fill="${dark}"/>
		 <path d="M12 4 L15 20 L9 20 Z" fill="${gold}"/>
		 <circle cx="12" cy="19" r="1.5" fill="${dark}"/></g>`,
	},
	{
		key: 'черная свеча',
		re: /свеч|фитиль|воск/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="8" y="7" width="8" height="13" rx="1.5"/>
		 <path d="M12 4 Q13 6 12 7 Q11 6 12 4 Z" fill="${gold}"/>
		 <path d="M10 10 L14 10 M10 13 L14 13" stroke="${gold}" stroke-width="0.6"/></g>`,
	},
	{
		key: 'вампир/вампиризм',
		re: /вампир/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M10 3 L7 8 L10 6 Z M14 3 L17 8 L14 6 Z"/>
		 <rect x="5" y="8" width="14" height="12" rx="3"/>
		 <path d="M10 14 L12 16 L14 14" stroke="${gold}" stroke-width="1" fill="none"/>
		 <circle cx="9" cy="12" r="0.8"/><circle cx="15" cy="12" r="0.8"/></g>`,
	},
	{
		key: 'гарпун/копье-метательное',
		re: /гарпун/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M4 18 L20 4" stroke="${dark}" stroke-width="1.4"/>
		 <path d="M18 5 L21 3 L20 8 Z" fill="${gold}"/>
		 <path d="M14 9 L12 14 L16 12 Z" fill="${gold}"/>
		 <path d="M6 14 L4 12 L8 12 Z" fill="${gold}"/></g>`,
	},
	{
		key: 'слонобой',
		re: /слон/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="13" cy="14" rx="6" ry="5"/>
		 <circle cx="7" cy="11" r="4"/>
		 <path d="M9 15 Q7 18 8 21 Q6 19 6 16" stroke="${dark}" stroke-width="1.2" fill="none"/>
		 <path d="M5 8 L3 5 M7 6 L6 3" stroke="${fg}" stroke-width="0.8"/>
		 <circle cx="6" cy="11" r="0.9"/></g>`,
	},
	{
		key: 'яйцо',
		re: /яйцо|яичк|яиц/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="13" rx="5.5" ry="7"/>
		 <path d="M12 6 Q14 9 14 12 Q14 15 12 17 Q10 15 10 12 Q10 9 12 6 Z" fill="${gold}"/>
		 <path d="M12 6 Q11 4 12 3" stroke="${fg}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'клубочек/малинка-ягода',
		re: /малинк|малина|клубник/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="13" r="6"/>
		 <circle cx="10" cy="11" r="1.5" fill="${gold}"/><circle cx="14" cy="11" r="1.5" fill="${gold}"/><circle cx="12" cy="15" r="1.5" fill="${gold}"/>
		 <path d="M12 7 L12 4 M10 9 L8 6 M14 9 L16 6" stroke="${gold}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'неготь/коготь',
		re: /коготь|когти/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M4 20 Q8 12 14 6 Q17 4 19 6 Q17 8 12 14 Q8 18 4 20 Z" fill="${gold}"/>
		 <path d="M14 6 Q17 5 19 6" stroke="${dark}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'резинка/ластик',
		re: /ластик|резинк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M8 4 L16 4 L20 14 L16 21 L8 21 L4 14 Z" fill="${gold}"/>
		 <path d="M8 4 L8 21 M4 14 L20 14" stroke="${dark}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'аптечка',
		re: /аптечк|медиц/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="6" y="4" width="12" height="16" rx="2"/>
		 <path d="M6 8 L18 8 M6 12 L18 12 M6 16 L18 16" stroke="${gold}" stroke-width="0.7"/>
		 <circle cx="9" cy="6" r="0.8" fill="${fg}"/><circle cx="15" cy="6" r="0.8" fill="${fg}"/></g>`,
	},
	{
		key: 'квашеная/варёнка',
		re: /варенк|варёная|вареный/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="12" rx="6" ry="7"/>
		 <path d="M10 8 Q12 6 14 8 Q15 12 13 15 Q11 17 9 15 Q8 12 10 8 Z" fill="${gold}"/>
		 <path d="M6 20 L18 20" stroke="${fg}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'онигири/рисовый',
		re: /онигири|рисов/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M8 10 Q12 4 16 10 L16 19 L8 19 Z" fill="${gold}"/>
		 <path d="M8 14 Q12 12 16 14" stroke="${dark}" stroke-width="0.8" fill="none"/>
		 <rect x="9" y="16" width="6" height="2" rx="1" fill="${dark}"/></g>`,
	},
	{
		key: 'рычаг',
		re: /рычаг/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="10" y="4" width="4" height="3" rx="1"/>
		 <path d="M12 7 L12 17" stroke="${dark}" stroke-width="1.2"/>
		 <circle cx="12" cy="18" r="2.5" fill="${gold}"/>
		 <rect x="4" y="20" width="16" height="2" rx="1"/></g>`,
	},
	{
		key: 'тазик',
		re: /тазик/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M4 12 Q4 7 12 7 Q20 7 20 12 L20 19 L4 19 Z" fill="${gold}"/>
		 <path d="M4 12 Q12 15 20 12" stroke="${dark}" stroke-width="0.8" fill="none"/>
		 <rect x="8" y="19" width="8" height="2" rx="1" fill="${dark}"/></g>`,
	},
	{
		key: 'шпилька',
		re: /шпильк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M4 6 Q8 2 12 6 L20 16 L16 19 L8 9 Z" fill="${gold}"/>
		 <circle cx="5" cy="5" r="1.5" fill="${dark}"/>
		 <path d="M8 9 L10 7 M12 11 L14 9" stroke="${dark}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'машина/пинковоз',
		re: /пинковоз|танк|машина\b/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="3" y="10" width="15" height="8" rx="2"/>
		 <path d="M8 10 Q10 6 14 7 L17 10" fill="${dark}"/>
		 <circle cx="7" cy="18" r="2.5"/><circle cx="15" cy="18" r="2.5"/>
		 <circle cx="7" cy="18" r="1" fill="${gold}"/><circle cx="15" cy="18" r="1" fill="${gold}"/></g>`,
	},
	{
		key: 'сено/ферма',
		re: /сено|солом|удобрен/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M8 10 L16 10 L14 20 L10 20 Z" fill="${gold}"/>
		 <path d="M8 10 Q12 6 16 10" stroke="${dark}" stroke-width="0.8" fill="none"/>
		 <path d="M10 13 L14 13 M10 16 L14 16" stroke="${dark}" stroke-width="0.6"/></g>`,
	},
	{
		key: 'хмель/шишка',
		re: /хмель/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="13" rx="4" ry="7" fill="${gold}"/>
		 <path d="M8 8 Q12 4 16 8" stroke="${dark}" stroke-width="0.9" fill="none"/>
		 <path d="M12 6 L10 9 L12 12 L14 9 Z" fill="${dark}"/></g>`,
	},
	{
		key: 'осёл',
		re: /осёл|ослик|ишак/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="13" cy="14" rx="6" ry="5"/>
		 <rect x="8" y="9" width="3" height="6" rx="1"/>
		 <rect x="6" y="11" width="2" height="3" rx="1"/>
		 <circle cx="10" cy="13" r="1"/><circle cx="16" cy="14" r="1"/>
		 <path d="M12 19 L12 22 M10 19 L10 21 M14 19 L14 21" stroke="${dark}" stroke-width="1"/></g>`,
	},
	{
		key: 'чин/звание',
		re: /значок|звание|бейдж/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="9" r="6"/>
		 <path d="M8 15 L8 21 L12 19 L16 21 L16 15" fill="${gold}"/>
		 <path d="M12 4 L14 9 L12 12 L10 9 Z" fill="${gold}"/></g>`,
	},
	{
		key: 'поросёнок',
		re: /поросён|поросенок/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="5" y="13" width="4" height="6" rx="2"/><rect x="15" y="13" width="4" height="6" rx="2"/>
		 <rect x="4" y="10" width="16" height="7" rx="3.5"/>
		 <ellipse cx="12" cy="15" rx="2" ry="1.5" fill="${gold}"/>
		 <circle cx="10" cy="12" r="0.6"/><circle cx="14" cy="12" r="0.6"/></g>`,
	},
	{
		key: 'кепка/значок',
		re: /кепк|пилотк|фуражк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M5 9 Q12 4 19 9 L19 12 L5 12 Z"/>
		 <ellipse cx="12" cy="13" rx="7" ry="2"/>
		 <rect x="10" y="6" width="4" height="3" rx="1" fill="${gold}"/></g>`,
	},
	{
		key: 'пеликан',
		re: /пеликан/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="10" r="5"/>
		 <path d="M4 12 L1 16 L6 14 Z"/><rect x="7" y="8" width="2" height="3" rx="1"/>
		 <path d="M13 16 L12 21 L16 18 Z"/><path d="M16 18 L19 21 L15 19 Z"/>
		 <path d="M14 14 Q17 15 17 18 Q14 17 12 16" fill="${gold}"/></g>`,
	},
	{
		key: 'стрела-белая',
		re: /стрел|эпическая белая/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M4 4 L20 20" stroke="${fg}" stroke-width="1.5"/>
		 <path d="M20 20 L20 12 L16 17 Z" fill="${gold}"/>
		 <circle cx="4" cy="4" r="2" fill="${gold}"/></g>`,
	},
	{
		key: 'золото/спецролл',
		re: /золотой спецролл/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M12 3 L14 9 L21 9 L15 13 L17 19 L12 15 L7 19 L9 13 L3 9 L10 9 Z" fill="${gold}"/>
		 <path d="M12 15 L12 21" stroke="${fg}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'обменник',
		re: /обменщик|торгов|лавка/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="4" y="6" width="16" height="15" rx="2"/>
		 <path d="M4 6 Q4 4 8 4 Q12 4 20 6" fill="${gold}"/>
		 <path d="M8 12 L16 12 M8 15 L13 15" stroke="${dark}" stroke-width="0.9"/></g>`,
	},
	{
		key: 'помощь/поддержка',
		re: /помощь|поддержк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="14" r="7"/>
		 <path d="M12 4 Q14 6 14 8 Q14 10 12 11 Q10 10 10 8 Q10 6 12 4 Z" fill="${gold}"/>
		 <path d="M12 14 L12 17 M12 18 Q12 18.5 12 18.5" stroke="${dark}" stroke-width="1"/></g>`,
	},
	{
		key: 'вихрь/флип',
		re: /флип-фатум|флип/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 4 L10 4 L10 8 L14 8 L14 12 L10 12 L10 16 L6 16 Z" fill="${gold}"/>
		 <path d="M18 20 L14 20 L14 16 L10 16 L10 12 L14 12 L14 8 L18 8 Z" fill="${gold}"/>
		 <circle cx="12" cy="12" r="1.5" fill="${dark}"/></g>`,
	},
	{
		key: 'ракерштекс/снаряд',
		re: /ракерш|снаряд\b/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M4 20 Q8 14 14 10 Q18 8 20 6 Q20 10 16 12 Q12 14 8 18 Z" fill="${gold}"/>
		 <circle cx="17" cy="8" r="1.5" fill="${dark}"/></g>`,
	},
	{
		key: 'пустой бланк',
		re: /последний штрих|сговор/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="6" y="8" width="12" height="13" rx="1.5"/>
		 <rect x="6" y="8" width="12" height="3" fill="${gold}"/>
		 <path d="M9 14 L15 14 M9 17 L13 17" stroke="${fg}" stroke-width="0.7"/></g>`,
	},
	{
		key: 'добрый/лучезарный',
		re: /добр|посыл/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="6.5" fill="${gold}"/>
		 <circle cx="9" cy="10" r="0.9" fill="${dark}"/><circle cx="15" cy="10" r="0.9" fill="${dark}"/>
		 <path d="M9 14 Q12 17 15 14" stroke="${dark}" stroke-width="1" fill="none"/></g>`,
	},
	{
		key: 'сова-облеванная',
		re: /сова|сови/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="7"/>
		 <path d="M9 8 L6 4 L10 7 Z M15 8 L18 4 L14 7 Z" fill="${gold}"/>
		 <circle cx="9.5" cy="12" r="1.8"/><circle cx="14.5" cy="12" r="1.8"/>
		 <path d="M10 16 Q12 18 14 16" stroke="${fg}" stroke-width="0.7" fill="none"/></g>`,
	},
	{
		key: 'удача/флип',
		re: /флип|рикардо/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="8" y="5" width="8" height="14" rx="1.5" transform="rotate(12 12 12)"/>
		 <path d="M8 10 L8 16 L13 18 L16 14 L14 8 Z" fill="${gold}"/>
		 <circle cx="11" cy="12" r="1.5" fill="${dark}"/></g>`,
	},
	{
		key: 'буква-символ',
		re: /буква|символ/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="6" y="5" width="12" height="15" rx="2"/>
		 <path d="M9 8 L15 8 L15 10 L11 10 L11 11 L14 11 L14 13 L11 13 L11 15 L15 15 L15 17 L9 17 Z" fill="${gold}"/></g>`,
	},
	{
		key: 'пушка-картофельная',
		re: /бульбамет/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="3" y="11" width="14" height="4" rx="1.5"/>
		 <circle cx="18" cy="13" r="3" fill="${gold}"/>
		 <rect x="6" y="7" width="3" height="5" rx="1"/>
		 <path d="M18 9 L20 5 M19 10 L22 8" stroke="${gold}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'шарик-воздушный',
		re: /шарик|воздушн/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="11" r="7" fill="${gold}"/>
		 <path d="M12 18 L11 22 M12 18 L13 22" stroke="${dark}" stroke-width="0.8"/>
		 <path d="M8 7 Q12 5 16 7" stroke="${dark}" stroke-width="0.7" fill="none"/></g>`,
	},
	{
		key: 'жидкий кал',
		re: /кал|поджопник/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M7 10 Q5 14 6 18 Q7 21 12 21 Q17 21 18 18 Q19 14 17 10 Q15 6 12 7 Q9 6 7 10 Z" fill="${gold}"/>
		 <path d="M8 13 Q12 11 16 13" stroke="${dark}" stroke-width="0.7" fill="none"/>
		 <circle cx="11" cy="16" r="1" fill="${dark}"/></g>`,
	},
	{
		key: 'кораблик-аврора',
		re: /аврора|кройсер|крейсер|корабл/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M4 16 L8 7 L16 7 L20 16 Z" fill="${gold}"/>
		 <rect x="10" y="7" width="4" height="9" fill="${dark}"/>
		 <path d="M2 18 L22 18" stroke="${dark}" stroke-width="1.2"/>
		 <path d="M10 4 L10 7 M12 4 L12 7 M14 4 L14 7" stroke="${dark}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'магазинный ролл',
		re: /ролл|спецролл/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="7"/>
		 <circle cx="12" cy="12" r="3" fill="none" stroke="${gold}" stroke-width="1.5"/>
		 <circle cx="12" cy="8" r="1" fill="${gold}"/></g>`,
	},
	{
		key: 'носок',
		re: /носок/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="7" y="5" width="10" height="9" rx="2"/>
		 <path d="M7 11 Q4 14 7 18 L10 14" fill="${gold}"/>
		 <path d="M7 8 L17 8" stroke="${dark}" stroke-width="0.6"/></g>`,
	},
	{
		key: 'ложечка',
		re: /ложечк|ложк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <ellipse cx="12" cy="7" rx="4" ry="5" fill="${gold}"/>
		 <rect x="11" y="11" width="2" height="9" rx="1"/>
		 <circle cx="12" cy="20" r="1.5" fill="${dark}"/></g>`,
	},
	{
		key: 'лук-овощ',
		re: /лук/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="13" r="5.5" fill="none" stroke="${dark}" stroke-width="1.2"/>
		 <path d="M9 6 L7 3 M12 5 L12 2 M15 6 L17 3" stroke="${gold}" stroke-width="0.8"/>
		 <circle cx="12" cy="13" r="1" fill="${gold}"/></g>`,
	},
	{
		key: 'книга-библиотека',
		re: /библиотек|книг/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M5 5 L12 3 L12 20 L5 22 Z" fill="${gold}"/>
		 <path d="M19 5 L12 3 L12 20 L19 22 Z" fill="${dark}"/>
		 <path d="M12 4 L19 6 M12 12 L19 14 M12 17 L19 19" stroke="${fg}" stroke-width="0.5"/></g>`,
	},
	{
		key: 'пенис-мем',
		re: /пенис|пипи|член\b/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M8 4 Q7 9 9 11 Q11 13 13 13 Q17 13 18 10 Q15 8 14 9 Q13 10 12 10 Q10 9 11 5 Z" fill="${gold}"/>
		 <ellipse cx="9" cy="12" rx="2.5" ry="1.8" fill="${gold}"/></g>`,
	},
	{
		key: 'оса/насекомое',
		re: /оса|осы/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="9.5" y="7" width="5" height="11" rx="2.5"/>
		 <circle cx="7" cy="11" r="3"/><circle cx="17" cy="11" r="3"/>
		 <circle cx="11" cy="10" r="0.6" fill="${fg}"/><circle cx="13" cy="13" r="0.6" fill="${fg}"/>
		 <path d="M12 12 L10 12 L12 11" fill="${dark}"/></g>`,
	},
	{
		key: 'очконавт/очки',
		re: /очконавт|очков|очк\b/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="8" cy="12" r="4.5"/>
		 <circle cx="16" cy="12" r="4.5"/>
		 <rect x="11" y="12" width="2" height="2" rx="1"/>
		 <path d="M5 8 L3 5 M19 8 L21 5" stroke="${fg}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'паук',
		re: /паук/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="10" r="5"/>
		 <path d="M6 8 L4 6 M8 6 L6 4 M10 5 L10 3 M14 5 L14 3 M16 6 L18 4 M18 8 L20 6" stroke="${dark}" stroke-width="0.9"/>
		 <circle cx="9" cy="11" r="1" fill="${fg}"/><circle cx="15" cy="11" r="1" fill="${fg}"/>
		 <path d="M10 13 Q12 15 14 13" stroke="${fg}" stroke-width="0.7" fill="none"/></g>`,
	},
	{
		key: 'подсолнух',
		re: /подсолнух|семечк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="9" r="5"/>
		 <circle cx="12" cy="9" r="2" fill="${gold}"/>
		 <path d="M9 5 L7 3 M15 5 L17 3 M12 4 L12 2 M5 9 L3 9 M21 9 L19 9" stroke="${gold}" stroke-width="0.9"/>
		 <path d="M12 14 L12 20 M12 17 Q8 17 7 15 M12 17 Q16 17 17 15" stroke="${dark}" stroke-width="1"/></g>`,
	},
	{
		key: 'рывок/рывок-скилл',
		re: /рывок/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M4 18 L10 12 L7 10 L14 4 L15 9 L12 11 L8 15 L10 16 Z" fill="${gold}"/>
		 <path d="M14 4 Q18 2 20 6 Q17 8 15 9" fill="${dark}"/></g>`,
	},
	{
		key: 'чешуя/щит-змея',
		re: /чешуя|чешуи/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 6 L18 6 L18 18 L6 18 Z" fill="${dark}"/>
		 <path d="M8 8 L10 10 L8 12 L10 14 L8 16 M13 8 L15 10 L13 12 L15 14 L13 16" stroke="${gold}" stroke-width="0.8" fill="none"/></g>`,
	},
	{
		key: 'сладкий пирожок',
		re: /пирожок|пирожк/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 10 Q6 6 12 6 Q18 6 18 10 Q18 16 12 18 Q6 16 6 10 Z" fill="${gold}"/>
		 <path d="M9 8 L15 8" stroke="${dark}" stroke-width="0.7"/>
		 <path d="M8 12 L16 12" stroke="${dark}" stroke-width="0.5"/></g>`,
	},
	{
		key: 'чай-кружка',
		re: /чай/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="6" y="9" width="10" height="9" rx="2"/>
		 <path d="M16 11 Q19 11 19 14 Q19 17 16 17" fill="none" stroke="${dark}" stroke-width="1.2"/>
		 <path d="M8 9 Q12 5 14 9" stroke="${gold}" stroke-width="1" fill="none"/></g>`,
	},
	{
		key: 'цыганский',
		re: /цыганск|чури/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="4" y="10" width="16" height="4" rx="1.5"/>
		 <path d="M6 10 Q6 5 12 5 Q18 5 18 10" fill="none" stroke="${dark}" stroke-width="1"/>
		 <circle cx="8" cy="10" r="0.8" fill="${gold}"/><circle cx="16" cy="10" r="0.8" fill="${gold}"/></g>`,
	},
	{
		key: 'шершень',
		re: /шершень/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="9.5" y="6" width="5" height="12" rx="2.5"/>
		 <circle cx="7" cy="10" r="3"/><circle cx="17" cy="10" r="3"/>
		 <circle cx="12" cy="16" r="2.5" fill="none" stroke="${gold}" stroke-width="0.9"/>
		 <path d="M7 9 L5 7 M17 9 L19 7" stroke="${dark}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'клубочек',
		re: /клубочек/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <circle cx="12" cy="12" r="7" fill="${dark}"/>
		 <path d="M12 5 Q17 8 15 13 Q13 17 9 15" fill="none" stroke="${gold}" stroke-width="1"/>
		 <path d="M6 15 L4 17 M18 15 L20 17" stroke="${dark}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'снаряд-c',
		re: /снаряд/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M9 3 Q14 3 15 8 L15 19 L14 21 L10 19 L9 8 Q9 3 9 3 Z" fill="${gold}"/>
		 <circle cx="12" cy="9" r="1.2" fill="${dark}"/>
		 <path d="M16 15 L19 15 M16 18 L19 18" stroke="${dark}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'пакет-суп',
		re: /campbell|суп пакет|puck/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <rect x="7" y="4" width="10" height="16" rx="1.5"/>
		 <rect x="7" y="7" width="10" height="4" fill="${gold}"/>
		 <circle cx="12" cy="15" r="2.5" fill="none" stroke="${gold}" stroke-width="1"/></g>`,
	},
	{
		key: 'снаряд-латиница',
		re: /cнаряд/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M9 3 Q14 3 15 8 L15 19 L14 21 L10 19 L9 8 Q9 3 9 3 Z" fill="${gold}"/>
		 <circle cx="12" cy="9" r="1.2" fill="${dark}"/>
		 <path d="M16 15 L19 15 M16 18 L19 18" stroke="${dark}" stroke-width="0.8"/></g>`,
	},
	{
		key: 'рулет-сладкий',
		re: /рулет/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M7 12 Q9 8 12 10 Q15 8 17 12 L17 18 Q15 20 12 18 Q9 20 7 18 Z" fill="${gold}"/>
		 <path d="M9 12 Q12 14 15 12" stroke="${dark}" stroke-width="0.8" fill="none"/>
		 <path d="M7 14 L17 14" stroke="${dark}" stroke-width="0.5"/></g>`,
	},
	{
		key: 'кек-кубок',
		re: /к\.е\.к|кека|кек\b/iu,
		body: `<g fill="${dark}" stroke="${fg}" stroke-width="0.3">
		 <path d="M6 8 L18 8 L17 21 L7 21 Z" fill="${gold}"/>
		 <path d="M6 8 Q12 4 18 8" fill="none" stroke="${dark}" stroke-width="1"/>
		 <path d="M9 12 L15 12 M9 15 L13 15" stroke="${dark}" stroke-width="0.6"/></g>`,
	},
];
export function glyphForName(name: string): { key: string; body: string } | null {
	for (const glyph of GLYPHS) {
		if (glyph.re.test(name)) {
			return { key: glyph.key, body: glyph.body };
		}
	}
	return null;
}

/** Количество определённых глифов (для диагностики покрытия). */
export const GLYPH_COUNT = GLYPHS.length;

export { dark as glyphDark, dot as glyphDot, fg as glyphFg, gold as glyphGold };