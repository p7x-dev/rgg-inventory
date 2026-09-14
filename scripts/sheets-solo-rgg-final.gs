/**
 * ФИНАЛЬНАЯ SOLO RGG-ТАБЛИЦА ДЛЯ ИВЕНТА (по образцу «СОЛО РГГ.xlsx»).
 *
 * Структура (строка платформ из шапки УДАЛЕНА):
 *   A1:J1 — заголовок «Solo RGG»
 *   A2:J2 — шапка: Дата | Платформа | Мод | Игра | Результат | Примечание
 *           | Инвентарь | Цена | Событие | Описание
 *   A3:J102 — 100 строк
 *
 * Автоматика:
 *  • Дата (A) — формула TODAY (проставляется сама)
 *  • Платформа (B) — выпадающий список всех платформ (+PC, +STEAM)
 *  • Мод (C) — выпадающий (Рулетка / Спецролл / ...)
 *  • Игра (D) — каскад по платформе (база + игры ивента); можно ввести свою
 *    игру вручную. Платформу можно НЕ указывать — тогда в списке все игры.
 *  • Результат (E) — Пройдено / Реролл / Дроп
 *  • Инвентарь (G) — выпадающий (Реролл / Спецролл / Дроп / Пройдено / Сейчас)
 *  • Цена (H) — число (свободный ввод)
 *  • Событие (I) — выпадающий список событий ивента
 *  • Примечание (F) и Описание (J) — свободный текст
 *  • УСЛОВНОЕ ФОРМАТИРОВАНИЕ: ячейка красится в цвет ВЫБРАННОГО значения
 *    (платформа — цвет группы, результат/мод/инвентарь/событие — свой цвет)
 *
 * Запуск: Расширения → Apps Script → вставить всё →
 *         выбрать buildSoloRggTable → ▶ Запустить.
 * Каскад «Игра» работает БЕЗ установки триггеров: простые onEdit/onOpen
 * копируются вместе с таблицей и срабатывают автоматически в любой копии.
 * buildSoloRggTable дополнительно ставит installable-триггер onEdit —
 * это запасной вариант (выполняется от имени владельца).
 * Игры тянутся из двух источников:
 *   • https://games.rgg.land/itch/ — игры ивента (названия со страниц itch.io);
 *   • https://rgg.land/lists/cat.txt — полный список игр по платформам
 *     (до CAT_GAMES_LIMIT на платформу).
 * Запуск докачки: downloadRggGames → ▶ (можно повторять сколько нужно).
 * Если UI недоступен (запуск без таблицы/триггер) — итог пишется в журнал:
 *         Просмотр → Журналы (Логи).
 */

/** Платформа, под которую складываются игры ивента со списка games.rgg.land/itch/. */
const RGG_GAMES_PLATFORM = 'PC'; // ← можно поменять, напр. «Аркада»

/** Полный список игр RGG (101 тыс. строк вида «Игра (Платформа)»). */
const CAT_LIST_URL = 'https://rgg.land/lists/cat.txt';

/** Сколько игр максимум брать на платформу из cat.txt (0 — без лимита). */
const CAT_GAMES_LIMIT = 5000;

/** RAWG: ключ и сколько страниц (по 100 топ-игр) тянуть на платформу. */
const RAWG_KEY = '159a78471a7141bbafe4c1592b12162a'; // ← твой ключ RAWG
const RAWG_PAGES = 3; // 3 × 100 = до 300 игр на платформу

/**
 * Дополнительный источник: категории Википедии «Игры платформы» (бесплатно,
 * без ключа). Платформа → название категории en.wikipedia.
 */
const WIKI_CATEGORIES = [
  ['NES', 'Nintendo_Entertainment_System_games'],
  ['SNES', 'Super_Nintendo_Entertainment_System_games'],
  ['SMD', 'Sega_Genesis_games'],
  ['Game Boy', 'Game_Boy_games'],
  ['Game Boy Color', 'Game_Boy_Color_games'],
  ['GBA', 'Game_Boy_Advance_games'],
  ['N64', 'Nintendo_64_games'],
  ['GameCube', 'Nintendo_GameCube_games'],
  ['Virtual Boy', 'Virtual_Boy_games'],
  ['Famicom Disk System', 'Famicom_Disk_System_games'],
  ['Sega CD', 'Sega_CD_games'],
  ['32X', 'Sega_32X_games'],
  ['Master System', 'Master_System_games'],
  ['Game Gear', 'Game_Gear_games'],
  ['Saturn', 'Sega_Saturn_games'],
  ['Dreamcast', 'Dreamcast_games'],
  ['PS1', 'PlayStation_(console)_games'],
  ['PS2', 'PlayStation_2_games'],
  ['PSP', 'PlayStation_Portable_games'],
  ['TG16', 'TurboGrafx-16_games'],
  ['Neo Geo', 'Neo_Geo_games'],
  ['Atari 2600', 'Atari_2600_games'],
  ['Atari 5200', 'Atari_5200_games'],
  ['Atari 7800', 'Atari_7800_games'],
  ['Atari Lynx', 'Atari_Lynx_games'],
  ['Atari Jaguar', 'Atari_Jaguar_games'],
  ['Atari ST', 'Atari_ST_games'],
  ['ZX Spectrum', 'ZX_Spectrum_games'],
  ['DOS', 'DOS_games'],
  ['Commodore 64', 'Commodore_64_games'],
  ['Amiga', 'Amiga_games'],
  ['MSX', 'MSX_games'],
  ['Amstrad CPC', 'Amstrad_CPC_games'],
  ['Apple II', 'Apple_II_games'],
  ['X68000', 'Sharp_X68000_games'],
  ['FM Towns', 'FM_Towns_games'],
  ['3DO', '3DO_games'],
  ['CD-i', 'Philips_CD-i_games'],
  ['WonderSwan', 'WonderSwan_games'],
  ['ColecoVision', 'ColecoVision_games'],
  ['Intellivision', 'Intellivision_games'],
  ['Vectrex', 'Vectrex_games'],
  ['Аркада', 'Arcade_video_games'],
];

/**
 * Соответствие платформ cat.txt нашим платформам (из platformList).
 * Платформы, которых тут нет (DS, PS3, Wii и т.п.), пропускаются.
 */
const CAT_PLATFORM_ALIASES = {
  'NES': 'NES',
  'SNES': 'SNES',
  'SMD': 'SMD',
  'Sega CD': 'Sega CD',
  'Sega 32X': '32X',
  'Master System': 'Master System',
  'GG': 'Game Gear',
  'Saturn': 'Saturn',
  'DC': 'Dreamcast',
  'SG-1000': 'SG-1000',
  'GB': 'Game Boy',
  'GBC': 'Game Boy Color',
  'GBA': 'GBA',
  'N64': 'N64',
  'GC': 'GameCube',
  'VB': 'Virtual Boy',
  'FDS': 'Famicom Disk System',
  'PS1': 'PS1',
  'PS2': 'PS2',
  'PSP': 'PSP',
  'Steam': 'STEAM',
  'Windows': 'PC',
  'DOS': 'DOS',
  'C64': 'Commodore 64',
  'Amiga': 'Amiga',
  'MSX': 'MSX',
  'ZX': 'ZX Spectrum',
  'Amstrad CPC': 'Amstrad CPC',
  'Sharp X68000': 'X68000',
  'TG16': 'TG16',
  'TG16-CD': 'TG16',
  '3DO': '3DO',
  'WS': 'WonderSwan',
  'NGP': 'Neo Geo Pocket',
  'Atari 2600': 'Atari 2600',
  'Atari 5200': 'Atari 5200',
  'Atari 7800': 'Atari 7800',
  'Atari Lynx': 'Atari Lynx',
  'Atari Jaguar': 'Atari Jaguar',
};

function buildSoloRggTable() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ============ 1. СПРАВОЧНИК «Платформы» ============
  const platformDefs = platformList(); // [название, группа, цвет]
  const platformsRef = ss.getSheetByName('Платформы') || ss.insertSheet('Платформы');
  platformsRef.clear();
  platformsRef.getRange(1, 1, platformDefs.length, 3)
    .setValues(platformDefs.map((p) => [p[0], p[1], p[2]]));
  platformsRef.hideSheet();

  // ============ 2. СПРАВОЧНИК «Игры» ============
  // База популярных игр записывается СРАЗУ (до RAWG): даже если докачка
  // не успеет за лимит времени или RAWG недоступен — каскад уже работает.
  const pairs = new Map();
  const merge = (platform, game) => {
    const pl = String(platform).trim();
    const gm = String(game).trim();
    if (!pl || !gm) return;
    if (!pairs.has(pl)) pairs.set(pl, new Set());
    pairs.get(pl).add(gm);
  };
  for (const [pl, games] of gameCatalog()) for (const g of games) merge(pl, g);
  const gamesRef = ss.getSheetByName('Игры') || ss.insertSheet('Игры');
  readGamesFromSheet(gamesRef, pairs);
  writeGamesToSheet(gamesRef, pairs);
  gamesRef.hideSheet();

  // ============ 3. ЛИСТ «Solo RGG» ============
  const sheet = ss.getSheetByName('Solo RGG') || ss.insertSheet('Solo RGG');
  sheet.clear();
  sheet.getDataRange().clearDataValidations();

  // Заголовок.
  sheet.getRange('A1:J1').merge();
  sheet.getRange('A1')
    .setValue('Solo RGG')
    .setFontSize(28).setFontWeight('bold').setFontColor('#ffffff')
    .setBackground('#3b2f63')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 52);
  sheet.getRange('A1:J1').setBorder(true, true, true, true, false, false, '#5a4a8a', SpreadsheetApp.BorderStyle.SOLID);

  // Шапка.
  const headers = ['Дата', 'Платформа', 'Мод', 'Игра', 'Результат', 'Примечание', 'Инвентарь', 'Цена', 'Событие', 'Описание'];
  const headerColors = ['#4c6ef5', '#12b886', '#fd7e14', '#845ef7', '#f03e3e', '#495057', '#e64980', '#1098ad', '#f59f00', '#5c7cfa'];
  const headerRange = sheet.getRange('A2:J2');
  headerRange.setValues([headers]);
  for (let i = 0; i < headers.length; i++) {
    sheet.getRange(2, i + 1)
      .setFontWeight('bold').setFontColor('#ffffff')
      .setBackground(headerColors[i])
      .setHorizontalAlignment('center').setVerticalAlignment('middle')
      .setFontSize(12);
  }
  sheet.setRowHeight(2, 34);
  headerRange.setBorder(true, true, true, true, false, false, '#ffffff', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Дата: пустая; проставляется автоматически через onEdit при заполнении строки.
  sheet.getRange('A3:A102').setNumberFormat('dd.mm.yyyy').setFontColor('#4c6ef5');

  // Ширина колонок.
  sheet.setColumnWidth(1, 110);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 260);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(6, 220);
  sheet.setColumnWidth(7, 120);
  sheet.setColumnWidth(8, 80);
  sheet.setColumnWidth(9, 150);
  sheet.setColumnWidth(10, 260);
  sheet.setFrozenRows(2);

  // ============ 4. ВЫПАДАЮЩИЕ СПИСКИ ============
  // B: Платформа.
  sheet.getRange('B3:B102').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(platformsRef.getRange(1, 1, platformDefs.length, 1), true)
    .setAllowInvalid(false).setHelpText('Выбери платформу').build());

  // C: Мод.
  sheet.getRange('C3:C102').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['Рулетка', 'Спецролл', 'Свои игры', 'Доп игры'], true)
    .setAllowInvalid(false).setHelpText('Мод игры').build());

  // D: Игра — каскад по платформе.
  applyGameValidationForRows(sheet, gamesRef, 3, 102);

  // E: Результат.
  sheet.getRange('E3:E102').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['Пройдено', 'Реролл', 'Дроп'], true)
    .setAllowInvalid(false).setHelpText('Результат').build());

  // G: Инвентарь.
  sheet.getRange('G3:G102').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['Реролл', 'Спецролл', 'Дроп', 'Пройдено', 'Сейчас'], true)
    .setAllowInvalid(false).setHelpText('Статус инвентаря').build());

  // I: Событие.
  sheet.getRange('I3:I102').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['Рулетка', 'Генесиздас', 'Дроп-позор', 'Спецролл', 'Бонус'], true)
    .setAllowInvalid(false).setHelpText('Событие ивента').build());

  // H: Цена — число.
  sheet.getRange('H3:H102').setNumberFormat('#,##0');

  // ============ 5. УСЛОВНОЕ ФОРМАТИРОВАНИЕ (ячейка = цвет выбранного) ============
  const rules = sheet.getConditionalFormatRules();

  // Платформа: цвет по группе.
  const groups = [
    ['Nintendo', '#ffe3e3', '#8a1010'],
    ['Sega', '#e3f0ff', '#103a8a'],
    ['Sony', '#e0f5e4', '#105a1a'],
    ['NEC', '#f0e3ff', '#4a108a'],
    ['SNK', '#ffe9e0', '#8a3a10'],
    ['Atari', '#f0e8e0', '#5a3a10'],
    ['Компьютеры', '#e8f0f5', '#103a5a'],
    ['Прочее', '#f0f0f0', '#3a3a3a'],
  ];
  for (const [group, bg, fg] of groups) {
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied("=VLOOKUP($B3,'Платформы'!$A:$B,2,FALSE)=\"" + group + '"')
      .setBackground(bg).setFontColor(fg)
      .setRanges([sheet.getRange('B3:B102')]).build());
  }

  // Результат (E): свои цвета.
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Пройдено').setBackground('#34c759').setFontColor('#ffffff')
    .setRanges([sheet.getRange('E3:E102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Реролл').setBackground('#ff9500').setFontColor('#ffffff')
    .setRanges([sheet.getRange('E3:E102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Дроп').setBackground('#ff3b30').setFontColor('#ffffff')
    .setRanges([sheet.getRange('E3:E102')]).build());

  // Мод (C).
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Рулетка').setBackground('#ff9f43').setFontColor('#ffffff')
    .setRanges([sheet.getRange('C3:C102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Спецролл').setBackground('#9b59b6').setFontColor('#ffffff')
    .setRanges([sheet.getRange('C3:C102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Свои игры').setBackground('#2e86de').setFontColor('#ffffff')
    .setRanges([sheet.getRange('C3:C102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Доп игры').setBackground('#00b894').setFontColor('#ffffff')
    .setRanges([sheet.getRange('C3:C102')]).build());

  // Инвентарь (G).
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Пройдено').setBackground('#34c759').setFontColor('#ffffff')
    .setRanges([sheet.getRange('G3:G102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Реролл').setBackground('#ff9500').setFontColor('#ffffff')
    .setRanges([sheet.getRange('G3:G102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Дроп').setBackground('#ff3b30').setFontColor('#ffffff')
    .setRanges([sheet.getRange('G3:G102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Спецролл').setBackground('#9b59b6').setFontColor('#ffffff')
    .setRanges([sheet.getRange('G3:G102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Сейчас').setBackground('#00b894').setFontColor('#ffffff')
    .setRanges([sheet.getRange('G3:G102')]).build());

  // Событие (I).
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Рулетка').setBackground('#ff9f43').setFontColor('#ffffff')
    .setRanges([sheet.getRange('I3:I102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Генесиздас').setBackground('#1e90ff').setFontColor('#ffffff')
    .setRanges([sheet.getRange('I3:I102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Дроп-позор').setBackground('#ff3b30').setFontColor('#ffffff')
    .setRanges([sheet.getRange('I3:I102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Спецролл').setBackground('#9b59b6').setFontColor('#ffffff')
    .setRanges([sheet.getRange('I3:I102')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Бонус').setBackground('#00b894').setFontColor('#ffffff')
    .setRanges([sheet.getRange('I3:I102')]).build());

  // Игра (D): подсветка, если заполнена.
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(ISBLANK($B3)=FALSE,ISBLANK($D3)=FALSE)')
    .setBackground('#eef4ff')
    .setRanges([sheet.getRange('D3:D102')]).build());

  sheet.setConditionalFormatRules(rules);

  // ============ 6. БОРДЕРЫ ============
  sheet.getRange('A1:J102').setBorder(true, true, true, true, true, true, '#c9c9e0', SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange('A2:J2').setBorder(false, false, true, false, false, false, '#ffffff', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  SpreadsheetApp.flush();

  // ============ 7. ИГРЫ С games.rgg.land И rgg.land/lists (не критичны: база уже записана) ============
  const rawgStatus = [];
  let added = 0;
  try {
    added = fetchRggGames(pairs, rawgStatus);
  } catch (err) {
    rawgStatus.push('games.rgg.land:ошибка — ' + err.message);
  }
  try {
    added += fetchCatGames(pairs, rawgStatus);
  } catch (err) {
    rawgStatus.push('cat.txt:ошибка — ' + err.message);
  }
  try {
    added += fetchRawgGames(pairs, rawgStatus);
  } catch (err) {
    rawgStatus.push('rawg.io:ошибка — ' + err.message);
  }
  try {
    added += fetchWikiGames(pairs, rawgStatus);
  } catch (err) {
    rawgStatus.push('wikipedia:ошибка — ' + err.message);
  }
  writeGamesToSheet(gamesRef, pairs);
  applyGameValidationForRows(sheet, gamesRef, 3, 102);
  gamesRef.hideSheet();

  installOnEditTrigger();
  notify(
    'Готово! Таблица «Solo RGG» развёрнута.\n\n' +
    '• Дата — проставляется сама при заполнении строки\n' +
    '• Платформа/Мод/Результат/Инвентарь/Событие — выпадающие списки\n' +
    '• Игра — каскад по платформе (база + игры ивента)\n' +
    '• Ячейки красятся в цвет выбранного значения\n' +
    'Игр добавлено: ' + added + '.\n\n' +
    rawgStatus.join(', ') +
    '\n\nТриггер onEdit установлен автоматически — каскад «Игра»\n' +
    'работает в любом браузере и для всех, у кого есть доступ.\n' +
    'Продолжить докачку: запусти downloadRggGames ещё раз.',
  );
}

/**
 * УСТАНОВКА ТРИГГЕРА onEdit на текущую таблицу (идемпотентно).
 * Без него каскад «Игра» не обновляется при выборе платформы.
 * Вызывается сам из buildSoloRggTable; для копий можно запустить вручную.
 */
function installOnEditTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const has = ScriptApp.getProjectTriggers().some(
    (t) =>
      t.getHandlerFunction() === 'onEdit' &&
      t.getEventType() === ScriptApp.EventType.ON_EDIT &&
      t.getTriggerSourceId() === ss.getId(),
  );
  if (has) {
    return;
  }
  ScriptApp.newTrigger('onEdit').forSpreadsheet(ss).onEdit().create();
}

/**
 * ПОКАЗ ИТОГА: alert, если UI доступен; иначе (запуск из триггера или
 * без контекста таблицы) — пишем в журнал «Просмотр → Журналы».
 */
function notify(message) {
  Logger.log(message);
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (err) {
    // UI недоступен (Cannot call getUi() from this context) — итог уже в журнале.
  }
}

/** Сливает строки листа «Игры» (платформа,игра) в Map платформа → Set(игры). */
function readGamesFromSheet(gamesRef, pairs) {
  if (gamesRef.getLastRow() < 1) return;
  const values = gamesRef.getRange(1, 1, gamesRef.getLastRow(), 2).getValues();
  for (const row of values) {
    const pl = String(row[0]).trim();
    const gm = String(row[1]).trim();
    if (!pl || !gm) continue;
    if (!pairs.has(pl)) pairs.set(pl, new Set());
    pairs.get(pl).add(gm);
  }
}

/** Пишет Map платформа → Set(игры) в лист «Игры» (без дублей). */
function writeGamesToSheet(gamesRef, pairs) {
  const flat = [];
  for (const [platform, games] of pairs) for (const game of games) flat.push([platform, game]);
  gamesRef.clear();
  if (flat.length) gamesRef.getRange(1, 1, flat.length, 2).setValues(flat);
}

/**
 * Тянет список игр ивента с https://games.rgg.land/itch/ и сливает в pairs
 * под платформу RGG_GAMES_PLATFORM. Названия берутся со страниц itch.io
 * (тег <title> до « by »), slug — только как запасной вариант.
 * Возвращает число добавленных игр.
 */
function fetchRggGames(pairs, status) {
  const res = UrlFetchApp.fetch('https://games.rgg.land/itch/', { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    status.push('HTTP' + res.getResponseCode());
    return 0;
  }
  const html = res.getContentText();
  const linkRe = /<a href="[a-z0-9-]+">(https:\/\/[a-z0-9.-]+\.itch\.io\/[a-z0-9-]+)<\/a>/g;
  const urls = [...html.matchAll(linkRe)].map((m) => m[1]);
  const pl = RGG_GAMES_PLATFORM.trim();
  if (!pairs.has(pl)) pairs.set(pl, new Set());
  let added = 0;
  const BATCH = 8;
  for (let i = 0; i < urls.length; i += BATCH) {
    const chunk = urls.slice(i, i + BATCH);
    const responses = UrlFetchApp.fetchAll(chunk.map((url) => ({ url, muteHttpExceptions: true })));
    chunk.forEach((url, idx) => {
      const page = responses[idx];
      let name = '';
      if (page && page.getResponseCode() === 200) {
        const match = /<title>([^<]*)<\/title>/.exec(page.getContentText());
        if (match) {
          name = unescapeHtml(match[1].split(' by ')[0].trim());
        }
      }
      if (!name) {
        // Запасной вариант — имя из slug: six-cats-under → Six Cats Under.
        const slug = url.split('/').pop();
        name = slug.split('-').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      if (!name) return;
      if (!pairs.get(pl).has(name)) {
        pairs.get(pl).add(name);
        added++;
      }
    });
    if (i + BATCH < urls.length) Utilities.sleep(500);
  }
  status.push('itch.io: ' + added + ' игр с названиями под «' + pl + '»');
  return added;
}

/** Раскодирует HTML-сущности в названии игры. */
function unescapeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Тянет полный список игр RGG (rgg.land/lists/cat.txt, строки «Игра (Платформа)»)
 * и сливает в pairs под наши платформы — не больше CAT_GAMES_LIMIT на каждую.
 * Возвращает число добавленных игр.
 */
function fetchCatGames(pairs, status) {
  const res = UrlFetchApp.fetch(CAT_LIST_URL, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    status.push('cat.txt:HTTP' + res.getResponseCode());
    return 0;
  }
  const counts = new Map();
  let added = 0;
  for (const rawLine of res.getContentText().split('\n')) {
    const match = /^(.+) \(([^)]+)\)\s*$/.exec(rawLine.trim());
    if (!match) continue;
    const pl = CAT_PLATFORM_ALIASES[match[2]];
    if (!pl) continue;
    const used = counts.get(pl) || 0;
    if (used >= CAT_GAMES_LIMIT) continue;
    const name = match[1].trim();
    if (!name) continue;
    if (!pairs.has(pl)) pairs.set(pl, new Set());
    if (pairs.get(pl).has(name)) continue;
    pairs.get(pl).add(name);
    counts.set(pl, used + 1);
    added++;
  }
  status.push('cat.txt: +' + added + ' игр по ' + counts.size + ' платформам');
  return added;
}

/**
 * Дополняет списки топ-играми с RAWG (до RAWG_PAGES × 100 на платформу,
 * по рейтингу) — теми, которых нет в cat.txt. Возвращает число добавленных.
 */
function fetchRawgGames(pairs, status) {
  const BATCH = 6;
  const sleep = (ms) => Utilities.sleep(ms);
  const requests = [];
  for (const [pl, id] of rawgPlatformMap()) {
    for (let page = 1; page <= RAWG_PAGES; page++) {
      requests.push({
        pl,
        url: 'https://api.rawg.io/api/games?key=' + RAWG_KEY +
          '&platforms=' + id + '&page_size=100&page=' + page + '&ordering=-rating',
      });
    }
  }
  let added = 0;
  let errors = 0;
  for (let i = 0; i < requests.length; i += BATCH) {
    const chunk = requests.slice(i, i + BATCH);
    const responses = UrlFetchApp.fetchAll(
      chunk.map((r) => ({ url: r.url, muteHttpExceptions: true })),
    );
    chunk.forEach((req, idx) => {
      const res = responses[idx];
      if (!res || res.getResponseCode() !== 200) {
        errors++;
        return;
      }
      try {
        const json = JSON.parse(res.getContentText());
        for (const g of json.results || []) {
          const name = String(g.name || '').trim();
          if (!name) continue;
          if (!pairs.has(req.pl)) pairs.set(req.pl, new Set());
          if (pairs.get(req.pl).has(name)) continue;
          pairs.get(req.pl).add(name);
          added++;
        }
      } catch (err) {
        errors++;
      }
    });
    if (i + BATCH < requests.length) sleep(2500);
  }
  status.push('rawg.io: +' + added + ' игр' + (errors > 0 ? ' (' + errors + ' ошибок)' : ''));
  return added;
}

/** Наши платформы → id платформ RAWG (проверено по API). */
function rawgPlatformMap() {
  return [
    ['NES', 49], ['SNES', 79], ['N64', 83], ['GameCube', 105],
    ['Game Boy', 26], ['Game Boy Color', 43], ['GBA', 24],
    ['Virtual Boy', 10], ['Famicom Disk System', 58],
    ['SMD', 167], ['Sega CD', 119], ['32X', 117],
    ['Master System', 74], ['Game Gear', 77], ['Saturn', 107], ['Dreamcast', 106],
    ['SG-1000', 14], ['PS1', 27], ['PS2', 15], ['PSP', 17],
    ['STEAM', 4], ['PC', 4], ['Neo Geo', 12],
    ['Atari 2600', 23], ['Atari 5200', 31], ['Atari 7800', 28],
    ['Atari Lynx', 46], ['Atari Jaguar', 112], ['Atari ST', 34],
    ['Commodore 64', 166], ['Amiga', 166], ['Apple II', 41],
    ['3DO', 111], ['TG16', 86],
  ];
}

/**
 * Дополняет списки играми из категорий Википедии (до 2 порций по 500 на
 * платформу). Запросы последовательные с паузами — Википедия банит за
 * параллельный скрейпинг (429). Возвращает число добавленных игр.
 */
function fetchWikiGames(pairs, status) {
  const sleep = (ms) => Utilities.sleep(ms);
  let added = 0;
  const skipped = [];
  for (const [pl, cat] of WIKI_CATEGORIES) {
    const names = [];
    let continueToken = null;
    for (let chunk = 0; chunk < 2; chunk++) {
      let url = 'https://en.wikipedia.org/w/api.php?action=query&list=categorymembers' +
        '&cmtitle=Category:' + encodeURIComponent(cat) +
        '&cmtype=page&cmlimit=500&format=json';
      if (continueToken) url += '&cmcontinue=' + encodeURIComponent(continueToken);
      const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (res.getResponseCode() !== 200) {
        skipped.push(pl);
        break;
      }
      try {
        const json = JSON.parse(res.getContentText());
        for (const member of json.query.categorymembers || []) {
          const name = String(member.title || '').trim();
          // Пропускаем служебные статьи «List of ...».
          if (name && !name.toLowerCase().startsWith('list of ')) names.push(name);
        }
        continueToken = json.continue ? json.continue.cmcontinue : null;
        if (!continueToken) break;
        sleep(1500);
      } catch (err) {
        skipped.push(pl);
        break;
      }
    }
    if (names.length > 0) {
      if (!pairs.has(pl)) pairs.set(pl, new Set());
      for (const name of names) {
        if (pairs.get(pl).has(name)) continue;
        pairs.get(pl).add(name);
        added++;
      }
    }
    sleep(1500);
  }
  status.push(
    'wikipedia: +' + added + ' игр' +
    (skipped.length > 0 ? ' (пропущено: ' + skipped.join(', ') + ')' : ''),
  );
  return added;
}

/**
 * ДОКАЧКА ИГР — запускай отдельно, сколько нужно раз.
 * Дописывает новые игры (ивент + cat.txt + RAWG) в лист «Игры» (без дублей).
 */
function downloadRggGames() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gamesRef = ss.getSheetByName('Игры') || ss.insertSheet('Игры');
  const pairs = new Map();
  readGamesFromSheet(gamesRef, pairs);
  const status = [];
  let added = 0;
  try {
    added += fetchRggGames(pairs, status);
  } catch (err) {
    status.push('games.rgg.land:ошибка');
  }
  try {
    added += fetchCatGames(pairs, status);
  } catch (err) {
    status.push('cat.txt:ошибка');
  }
  try {
    added += fetchRawgGames(pairs, status);
  } catch (err) {
    status.push('rawg.io:ошибка');
  }
  try {
    added += fetchWikiGames(pairs, status);
  } catch (err) {
    status.push('wikipedia:ошибка');
  }
  writeGamesToSheet(gamesRef, pairs);
  gamesRef.hideSheet();
  const sheet = ss.getSheetByName('Solo RGG');
  if (sheet && gamesRef.getLastRow() > 0) {
    applyGameValidationForRows(sheet, gamesRef, 3, 102);
  }
  notify(
    'Докачка завершена.\n\n' +
    'Добавлено игр: ' + added + '.\n\n' +
    status.join(', ') +
    '\n\nЗапусти downloadRggGames ещё раз, чтобы продолжить.',
  );
}

/**
 * onOpen: при открытии таблицы обновляет каскад «Игра» (D) для строк,
 * где платформа уже выбрана. Простой триггер — работает автоматически
 * в любой копии таблицы, без установки и авторизации.
 */
function onOpen() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Solo RGG');
    if (!sheet) {
      return;
    }
    const gamesRef = ss.getSheetByName('Игры');
    if (!gamesRef || gamesRef.getLastRow() < 1) {
      return;
    }
    applyGameValidationForRows(sheet, gamesRef, 3, 102);
  } catch (err) {
    // Копия без справочника игр или открыта не в режиме редактора — молча пропускаем.
  }
}

/**
 * onEdit: при выборе платформы в колонке B — ставит валидацию на игру (D)
 * той же строки со списком игр этой платформы.
 */
function onEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== 'Solo RGG') return;
  const row = e.range.getRow();
  const col = e.range.getColumn();
  if (row < 3) return;

  // Дата: при заполнении любой колонки B..J (2..10) ставим сегодня в A, если там пусто.
  if (col >= 2 && col <= 10) {
    const dateCell = sheet.getRange(row, 1);
    if (dateCell.isBlank()) {
      dateCell.setValue(new Date()).setNumberFormat('dd.mm.yyyy');
    }
  }

  // Каскад игр: при выборе платформы в B — валидация на игру (D) той же строки.
  if (col !== 2) return;

  const platform = String(e.value || '').trim();
  const gamesRef = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Игры');
  if (!gamesRef || gamesRef.getLastRow() < 1) return;

  const values = gamesRef.getRange(1, 1, gamesRef.getLastRow(), 2).getValues();
  let startRow = -1;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === platform) {
      if (startRow < 0) startRow = i + 1;
      count++;
    }
  }
  const cell = sheet.getRange(row, 4);
  if (startRow < 0) {
    // Платформа не выбрана или в списке нет её игр — показываем ВСЕ игры.
    setAllGamesValidation(sheet, gamesRef, row);
    return;
  }
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(gamesRef.getRange(startRow, 2, count, 1), true)
    .setAllowInvalid(true) // можно ввести свою игру, которой нет в списке
    .setHelpText('Игры платформы: ' + platform)
    .build();
  cell.setDataValidation(rule);
}

/** Ставит на колонку D список ВСЕХ игр (когда платформа не выбрана). */
function setAllGamesValidation(sheet, gamesRef, row) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(gamesRef.getRange(1, 2, gamesRef.getLastRow(), 1), true)
    .setAllowInvalid(true)
    .setHelpText('Все игры — можно ввести свою')
    .build();
  sheet.getRange(row, 4).setDataValidation(rule);
}

/** Ставит каскадные валидации на колонку D по текущим платформам (B). */
function applyGameValidationForRows(sheet, gamesRef, startRow, endRow) {
  const values = gamesRef.getRange(1, 1, gamesRef.getLastRow(), 2).getValues();
  const rangesOf = new Map();
  for (let i = 0; i < values.length; i++) {
    const platform = String(values[i][0]).trim();
    if (!platform) continue;
    if (!rangesOf.has(platform)) rangesOf.set(platform, { startRow: i + 1, count: 0 });
    rangesOf.get(platform).count++;
  }
  const platforms = sheet.getRange('B' + startRow + ':B' + endRow).getValues();
  for (let r = 0; r < platforms.length; r++) {
    const platform = String(platforms[r][0]).trim();
    const info = rangesOf.get(platform);
    const cell = sheet.getRange(startRow + r, 4);
    if (!info) {
      // Платформа не выбрана — показываем ВСЕ игры (можно ввести свою).
      setAllGamesValidation(sheet, gamesRef, startRow + r);
      continue;
    }
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(gamesRef.getRange(info.startRow, 2, info.count, 1), true)
      .setAllowInvalid(true) // можно ввести свою игру, которой нет в списке
      .setHelpText('Игры платформы: ' + platform)
      .build();
    cell.setDataValidation(rule);
  }
}

/** Все платформы: [название, группа, цвет]. */
function platformList() {
  return [
    ['NES', 'Nintendo', '#e53935'], ['SNES', 'Nintendo', '#e53935'],
    ['N64', 'Nintendo', '#e53935'], ['GameCube', 'Nintendo', '#e53935'],
    ['Game Boy', 'Nintendo', '#e53935'], ['Game Boy Color', 'Nintendo', '#e53935'],
    ['GBA', 'Nintendo', '#e53935'], ['Virtual Boy', 'Nintendo', '#e53935'],
    ['Famicom Disk System', 'Nintendo', '#e53935'],
    ['SMD', 'Sega', '#1e88e5'],
    ['Sega CD', 'Sega', '#1e88e5'], ['32X', 'Sega', '#1e88e5'],
    ['Master System', 'Sega', '#1e88e5'], ['Game Gear', 'Sega', '#1e88e5'],
    ['Saturn', 'Sega', '#1e88e5'], ['Dreamcast', 'Sega', '#1e88e5'],
    ['SG-1000', 'Sega', '#1e88e5'],
    ['PS1', 'Sony', '#43a047'], ['PS2', 'Sony', '#43a047'],
    ['PSP', 'Sony', '#43a047'], ['STEAM', 'Sony', '#43a047'],
    ['PC', 'Sony', '#43a047'],
    ['TG16', 'NEC', '#8e24aa'], ['PC-FX', 'NEC', '#8e24aa'],
    ['Neo Geo', 'SNK', '#f4511e'], ['Neo Geo Pocket', 'SNK', '#f4511e'],
    ['Atari 2600', 'Atari', '#6d4c41'], ['Atari 5200', 'Atari', '#6d4c41'],
    ['Atari 7800', 'Atari', '#6d4c41'], ['Atari Lynx', 'Atari', '#6d4c41'],
    ['Atari Jaguar', 'Atari', '#6d4c41'], ['Atari ST', 'Atari', '#6d4c41'],
    ['ZX Spectrum', 'Компьютеры', '#546e7a'],
    ['DOS', 'Компьютеры', '#546e7a'], ['Commodore 64', 'Компьютеры', '#546e7a'],
    ['Amiga', 'Компьютеры', '#546e7a'], ['MSX', 'Компьютеры', '#546e7a'],
    ['Amstrad CPC', 'Компьютеры', '#546e7a'], ['Apple II', 'Компьютеры', '#546e7a'],
    ['BBC Micro', 'Компьютеры', '#546e7a'], ['X68000', 'Компьютеры', '#546e7a'],
    ['FM Towns', 'Компьютеры', '#546e7a'],
    ['3DO', 'Прочее', '#757575'], ['CD-i', 'Прочее', '#757575'],
    ['WonderSwan', 'Прочее', '#757575'], ['ColecoVision', 'Прочее', '#757575'],
    ['Intellivision', 'Прочее', '#757575'], ['Vectrex', 'Прочее', '#757575'],
    ['Аркада', 'Прочее', '#757575'],
  ];
}

/** База популярных игр (стартовая, RAWG докачивает остальное). */
function gameCatalog() {
  return [
    ['NES', ['Super Mario Bros.', 'The Legend of Zelda', 'Metroid', 'Castlevania', 'Contra', 'Mega Man 2', 'Final Fantasy', 'Dragon Quest', 'Kirby\'s Adventure', 'Ninja Gaiden', 'Battletoads', 'Excitebike', 'Punch-Out!!', 'River City Ransom', 'Duck Hunt']],
    ['SNES', ['Super Mario World', 'The Legend of Zelda: A Link to the Past', 'Super Metroid', 'Chrono Trigger', 'Final Fantasy VI', 'Donkey Kong Country', 'EarthBound', 'Mega Man X', 'Street Fighter II', 'Secret of Mana', 'Super Mario Kart', 'F-Zero', 'Star Fox', 'Super Castlevania IV', 'Kirby Super Star']],
    ['N64', ['Super Mario 64', 'The Legend of Zelda: Ocarina of Time', 'The Legend of Zelda: Majora\'s Mask', 'GoldenEye 007', 'Mario Kart 64', 'Banjo-Kazooie', 'Star Fox 64', 'Perfect Dark', 'Super Smash Bros.', 'Paper Mario', 'Donkey Kong 64', 'Jet Force Gemini', 'Diddy Kong Racing']],
    ['GameCube', ['Super Mario Sunshine', 'The Legend of Zelda: The Wind Waker', 'Metroid Prime', 'Super Smash Bros. Melee', 'Mario Kart: Double Dash', 'Animal Crossing', 'Pikmin', 'Luigi\'s Mansion', 'Resident Evil 4', 'F-Zero GX', 'Paper Mario: The Thousand-Year Door']],
    ['Game Boy', ['Tetris', 'Pokémon Red/Blue', 'Kirby\'s Dream Land', 'The Legend of Zelda: Link\'s Awakening', 'Super Mario Land', 'Metroid II: Return of Samus', 'Wario Land', 'Donkey Kong', 'Final Fantasy Legend']],
    ['Game Boy Color', ['Pokémon Gold/Silver', 'The Legend of Zelda: Oracle of Seasons', 'Dragon Quest Monsters', 'Wario Land 3', 'Shantae', 'Mario Tennis', 'Metal Gear Solid']],
    ['GBA', ['Pokémon Ruby/Sapphire', 'Metroid Fusion', 'The Legend of Zelda: The Minish Cap', 'Advance Wars', 'Fire Emblem', 'Golden Sun', 'Mario & Luigi: Superstar Saga', 'Castlevania: Aria of Sorrow', 'WarioWare, Inc.', 'Final Fantasy Tactics Advance']],
    ['Virtual Boy', ['Mario Tennis', 'Virtual Boy Wario Land', 'Red Alarm', 'Jack Bros.', 'Galactic Pinball']],
    ['Famicom Disk System', ['The Legend of Zelda', 'Metroid', 'Castlevania', 'Kid Icarus', 'Super Mario Bros. 2 (JP)', 'Doki Doki Panic']],
    ['SMD', ['Sonic the Hedgehog', 'Sonic the Hedgehog 2', 'Streets of Rage 2', 'Golden Axe', 'Mortal Kombat', 'Phantasy Star IV', 'Gunstar Heroes', 'Comix Zone', 'Shining Force II', 'Altered Beast', 'Earthworm Jim', 'Castlevania: Bloodlines']],
    ['SMD+2', ['Sonic 3 & Knuckles', 'Streets of Rage 3', 'Vectorman', 'Ristar', 'Sonic Spinball', 'Ecco the Dolphin']],
    ['Sega CD', ['Sonic CD', 'Snatcher', 'Lunar: Silver Star Story', 'Keio Flying Squadron', 'Final Fight CD', 'Sewer Shark']],
    ['32X', ['Knuckles Chaotix', 'Virtua Fighter', 'Star Wars Arcade', 'Space Harrier 32X', 'Cosmic Carnage']],
    ['Master System', ['Alex Kidd in Miracle World', 'Sonic the Hedgehog', 'Phantasy Star', 'Wonder Boy III', 'R-Type', 'Shinobi', 'Out Run', 'Hang-On', 'Space Harrier', 'Golden Axe']],
    ['Game Gear', ['Sonic the Hedgehog', 'Sonic Chaos', 'Streets of Rage', 'Shinobi', 'Tails Adventure', 'Ristar', 'Defenders of Oasis']],
    ['Saturn', ['NiGHTS into Dreams', 'Panzer Dragoon Saga', 'Saturn Bomberman', 'Radiant Silvergun', 'Virtua Fighter 2', 'Sega Rally', 'Guardian Heroes', 'Shining Force III', 'Dragon Force']],
    ['Dreamcast', ['Shenmue', 'Soulcalibur', 'Jet Set Radio', 'Crazy Taxi', 'Sonic Adventure', 'Power Stone', 'Rez', 'Skies of Arcadia', 'Phantasy Star Online', 'Resident Evil: Code Veronica']],
    ['SG-1000', ['Sega Ninja', 'Girl\'s Garden', 'Congo Bongo', 'Champion Boxing']],
    ['PS1', ['Final Fantasy VII', 'Metal Gear Solid', 'Resident Evil', 'Crash Bandicoot', 'Spyro the Dragon', 'Tomb Raider', 'Gran Turismo', 'Castlevania: Symphony of the Night', 'Tekken 3', 'Silent Hill', 'Wipeout', 'Twisted Metal', 'Tony Hawk\'s Pro Skater']],
    ['PS2', ['Grand Theft Auto: San Andreas', 'Final Fantasy X', 'Metal Gear Solid 2', 'Metal Gear Solid 3', 'God of War', 'Shadow of the Colossus', 'Kingdom Hearts', 'Devil May Cry', 'Jak and Daxter', 'Ratchet & Clank', 'Silent Hill 2', 'Gran Turismo 4', 'Resident Evil 4', 'Persona 4']],
    ['PSP', ['God of War: Chains of Olympus', 'Monster Hunter Freedom', 'Lumines', 'Crisis Core: Final Fantasy VII', 'Daxter', 'GTA: Liberty City Stories', 'Ridge Racer', 'Patapon']],
    ['STEAM', ['Half-Life 2', 'Portal', 'Counter-Strike', 'Dota 2', 'The Witcher 3', 'Dark Souls', 'Hollow Knight', 'Stardew Valley', 'Celeste', 'Hades', 'Terraria', 'Undertale', 'RimWorld']],
    ['PC', ['Half-Life 2', 'Portal', 'Counter-Strike', 'Dota 2', 'The Witcher 3', 'Dark Souls', 'Hollow Knight', 'Stardew Valley', 'Celeste', 'Hades', 'Terraria', 'Undertale', 'RimWorld']],
    ['TG16', ['Bonk\'s Adventure', 'R-Type', 'Splatterhouse', 'Castlevania: Rondo of Blood', 'Bomberman', 'Ys I & II', 'Gate of Thunder', 'Parodius']],
    ['PC-FX', ['Battle Heat', 'Far East of Eden Zero', 'Chou Aniki']],
    ['Neo Geo', ['Metal Slug', 'The King of Fighters \'94', 'Fatal Fury', 'Samurai Shodown', 'Art of Fighting', 'The Last Blade', 'Garou: Mark of the Wolves', 'Magician Lord', 'Shock Troopers']],
    ['Neo Geo Pocket', ['Sonic the Hedgehog Pocket Adventure', 'Metal Slug: 1st Mission', 'Card Fighters Clash', 'King of Fighters R-2']],
    ['Atari 2600', ['Pac-Man', 'Space Invaders', 'Pitfall!', 'Adventure', 'River Raid', 'Asteroids', 'Missile Command', 'Yars\' Revenge', 'Combat', 'Breakout']],
    ['Atari 5200', ['Pac-Man', 'Centipede', 'Qix', 'Galaxian', 'Space Invaders', 'Dig Dug']],
    ['Atari 7800', ['Galaga', 'Pole Position II', 'Ballblazer', 'Food Fight', 'Joust', 'Xevious']],
    ['Atari Lynx', ['Chip\'s Challenge', 'California Games', 'Klax', 'Electrocop', 'Battle Wheels']],
    ['Atari Jaguar', ['Tempest 2000', 'Rayman', 'Doom', 'Alien vs Predator', 'Iron Soldier']],
    ['Atari ST', ['Another World', 'Lemmings', 'Dungeon Master', 'Stunt Car Racer', 'Elite', 'Oids']],
    ['ZX Spectrum', ['Manic Miner', 'Jet Set Willy', 'The Hobbit', 'Knight Lore', 'Sabre Wulf', 'Atic Atac', 'Chaos', 'Elite', 'Chuckie Egg', 'Target Renegade']],
    ['ZXspec', ['Manic Miner', 'Jet Set Willy', 'The Hobbit', 'Knight Lore', 'Sabre Wulf', 'Chaos', 'Elite', 'Chuckie Egg']],
    ['DOS', ['DOOM', 'Wolfenstein 3D', 'Prince of Persia', 'Commander Keen', 'Duke Nukem 3D', 'X-COM: UFO Defense', 'Warcraft', 'SimCity', 'The Secret of Monkey Island', 'Alone in the Dark', 'Day of the Tentacle', 'Myst', 'Civilization']],
    ['Commodore 64', ['Bubble Bobble', 'Elite', 'Maniac Mansion', 'The Last Ninja', 'Impossible Mission', 'Paradroid', 'Great Giana Sisters', 'Turrican', 'Boulder Dash', 'Summer Games']],
    ['Amiga', ['Lemmings', 'Another World', 'Syndicate', 'Speedball 2', 'Sensible Soccer', 'Cannon Fodder', 'The Secret of Monkey Island', 'Turrican II', 'Flashback', 'Wings']],
    ['MSX', ['Metal Gear', 'Vampire Killer', 'Penguin Adventure', 'Golvellius', 'Aleste', 'Nemesis', 'King\'s Valley', 'Parodius']],
    ['Amstrad CPC', ['Manic Miner', 'Chase HQ', 'RoboCop', 'Batman', 'Head over Heels', 'Roland in the Caves', 'Commando']],
    ['Apple II', ['The Oregon Trail', 'Prince of Persia', 'Lode Runner', 'Karateka', 'Ultima', 'Wizardry', 'Choplifter', 'Zork']],
    ['BBC Micro', ['Elite', 'Chuckie Egg', 'Repton', 'Frak!', 'Castle Quest', 'Starship Command']],
    ['X68000', ['Gradius II', 'Castlevania Chronicles', 'Parodius', 'Akumajou Dracula', 'Strider Hiryu', 'Mr. Heli']],
    ['FM Towns', ['Ys', 'Dyna Gear', 'Shadow of the Beast', 'Volfied']],
    ['3DO', ['Need for Speed', 'Road Rash', 'Star Fighter', 'Alone in the Dark', 'Policenauts', 'D']],
    ['CD-i', ['Zelda\'s Adventure', 'Hotel Mario', 'Burn: Cycle', 'Alien Gate']],
    ['WonderSwan', ['Gunpey', 'Makaimura', 'Judgement Silversword', 'Dicing Knight']],
    ['ColecoVision', ['Donkey Kong', 'Zaxxon', 'Smurf: Rescue in Gargamel\'s Castle', 'Venture', 'Q*bert', 'Lady Bug']],
    ['Intellivision', ['Astrosmash', 'Night Stalker', 'B-17 Bomber', 'Tron: Deadly Discs', 'BurgerTime', 'Microsurgeon']],
    ['Vectrex', ['Star Castle', 'Berzerk', 'Minestorm', 'Pole Position', 'Armor Attack', 'Scramble']],
    ['Аркада', ['Pac-Man', 'Space Invaders', 'Donkey Kong', 'Galaga', 'Street Fighter II', 'Metal Slug', 'Mortal Kombat', 'Out Run', 'After Burner', 'NBA Jam', 'Double Dragon', 'Bubble Bobble', 'Frogger', 'Joust']],
  ];
}
/**
 * ДИАГНОСТИКА: показывает состояние таблицы и триггеров.
 * Запусти и пришли текст результата (или смотри в Просмотр → Журналы).
 */
function diagnose() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const out = [];
  const gamesRef = ss.getSheetByName('Игры');
  out.push('Лист «Игры»: ' + (gamesRef ? 'ЕСТЬ' : 'НЕТ'));
  if (gamesRef) {
    const last = gamesRef.getLastRow();
    out.push('Строк в «Игры»: ' + last);
    if (last > 0) {
      const values = gamesRef.getRange(1, 1, last, 2).getValues();
      const byPlat = new Map();
      for (const row of values) {
        const p = String(row[0]).trim();
        if (!p) continue;
        if (!byPlat.has(p)) byPlat.set(p, 0);
        byPlat.set(p, byPlat.get(p) + 1);
      }
      out.push('Игр по платформам: ' + [...byPlat.entries()].map(([p, c]) => p + '=' + c).join(', '));
    }
  }
  const sheet = ss.getSheetByName('Solo RGG');
  out.push('Лист «Solo RGG»: ' + (sheet ? 'ЕСТЬ' : 'НЕТ'));
  if (sheet) {
    const b = sheet.getRange('B3:B102').getValues().flat();
    const filled = b.filter((x) => String(x).trim() !== '').length;
    out.push('Заполнено платформ в B3:B102: ' + filled);
  }
  const triggers = ScriptApp.getProjectTriggers()
    .map((t) => t.getHandlerFunction() + ' (' + t.getEventType() + ')')
    .join(', ');
  out.push('Триггеры: ' + (triggers || 'НЕТ'));
  notify(out.join('\n'));
}

/**
 * СТАВИТ СПИСКИ ИГР ПРЯМО СЕЙЧАС: для всех строк, где платформа уже выбрана,
 * применяет каскад (без ожидания onEdit). Запусти после diagnose.
 */
function setupGameLists() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Solo RGG');
  const gamesRef = ss.getSheetByName('Игры');
  if (!sheet || !gamesRef) {
    notify('Не найден лист «Solo RGG» или «Игры» — сначала запусти buildSoloRggTable.');
    return;
  }
  if (gamesRef.getLastRow() < 1) {
    notify('Справочник «Игры» пуст — сначала запусти buildSoloRggTable (или downloadRggGames).');
    return;
  }
  applyGameValidationForRows(sheet, gamesRef, 3, 102);
  installOnEditTrigger();
  notify('Готово: каскад «Игра» применён к строкам с выбранной платформой.');
}
