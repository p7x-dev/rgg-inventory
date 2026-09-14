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
 *  • Игра (D) — каскад: только игры выбранной платформы (RAWG + база-фоллбек)
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
 * После запуска один раз: Триггеры → Добавить → onEdit, «При изменении».
 */
function buildSoloRggTable() {
  const RAWG_KEY = '159a78471a7141bbafe4c1592b12162a'; // ← твой ключ RAWG
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ============ 1. СПРАВОЧНИК «Платформы» ============
  const platformDefs = platformList(); // [название, группа, цвет]
  const platformsRef = ss.getSheetByName('Платформы') || ss.insertSheet('Платформы');
  platformsRef.clear();
  platformsRef.getRange(1, 1, platformDefs.length, 3)
    .setValues(platformDefs.map((p) => [p[0], p[1], p[2]]));
  platformsRef.hideSheet();

  // ============ 2. СПРАВОЧНИК «Игры» ============
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
  if (gamesRef.getLastRow() > 0) {
    const oldRows = gamesRef.getRange(1, 1, gamesRef.getLastRow(), 2).getValues();
    for (const row of oldRows) merge(row[0], row[1]);
  }
  const props = PropertiesService.getScriptProperties();
  let added = 0;
  let rawgStatus = [];
  if (RAWG_KEY) {
    const rawgIds = rawgPlatformMap();
    // Мелкие батчи (по 4) + повторы при 429: RAWG лимитирует ~20 запросов/мин.
    const BATCH = 4;
    const sleep = (ms) => Utilities.sleep(ms);
    for (let i = 0; i < rawgIds.length; i += BATCH) {
      const chunk = rawgIds.slice(i, i + BATCH);
      const attempts = 3; // до 3 попыток на батч при rate-limit
      for (let attempt = 0; attempt < attempts; attempt++) {
        const requests = chunk.map(([, rawgId]) => {
          const page = Number(props.getProperty('page_' + rawgId) || '1');
          return {
            url: 'https://api.rawg.io/api/games?key=' + RAWG_KEY +
              '&platforms=' + rawgId + '&page_size=100&page=' + page + '&ordering=-rating',
            muteHttpExceptions: true,
          };
        });
        const responses = UrlFetchApp.fetchAll(requests);
        const retry = [];
        chunk.forEach(([platform, rawgId], idx) => {
          const res = responses[idx];
          const code = res ? res.getResponseCode() : 0;
          if (code === 429) {
            retry.push([platform, rawgId]); // rate-limit — пробуем ещё раз
            return;
          }
          if (code !== 200) {
            rawgStatus.push(platform + ':HTTP' + code);
            return;
          }
          try {
            const json = JSON.parse(res.getContentText());
            const games = (json.results || []).map((g) => g.name).filter((n) => n && String(n).trim());
            for (const g of games) merge(platform, g);
            if (games.length === 100) props.setProperty('page_' + rawgId, String(Number(props.getProperty('page_' + rawgId) || '1') + 1));
            added += games.length;
            rawgStatus.push(platform + ':+' + games.length);
          } catch (err) {
            rawgStatus.push(platform + ':err');
          }
        });
        chunk.length = 0;
        chunk.push(...retry);
        if (retry.length > 0) {
          sleep(5000); // ждём окно rate-limit
          continue;
        }
        break;
      }
      if (i + BATCH < rawgIds.length) sleep(2500);
    }
  }
  gamesRef.clear();
  const flat = [];
  for (const [platform, games] of pairs) for (const game of games) flat.push([platform, game]);
  if (flat.length) gamesRef.getRange(1, 1, flat.length, 2).setValues(flat);
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
  SpreadsheetApp.getUi().alert(
    'Готово! Таблица «Solo RGG» развёрнута.\n\n' +
    '• Дата — проставляется сама при заполнении строки\n' +
    '• Платформа/Мод/Результат/Инвентарь/Событие — выпадающие списки\n' +
    '• Игра — каскад по платформе (RAWG + база)\n' +
    '• Ячейки красятся в цвет выбранного значения\n' +
    'Докачано с RAWG: ' + added + ' игр.\n\n' +
    'RAWG по платформам:\n' + rawgStatus.join(', ') +
    '\n\nНастрой триггер: Триггеры → Добавить → onEdit, «При изменении».\n' +
    'Запусти скрипт ещё 2–3 раза для докачки.',
  );
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
    cell.setDataValidation(null);
    return;
  }
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(gamesRef.getRange(startRow, 2, count, 1), true)
    .setAllowInvalid(false)
    .setHelpText('Игры платформы: ' + platform)
    .build();
  cell.setDataValidation(rule);
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
      cell.setDataValidation(null);
      continue;
    }
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(gamesRef.getRange(info.startRow, 2, info.count, 1), true)
      .setAllowInvalid(false)
      .setHelpText('Игры платформы: ' + platform)
      .build();
    cell.setDataValidation(rule);
  }
}

/** Жёсткий маппинг наших платформ → id платформ RAWG (проверено по API). */
function rawgPlatformMap() {
  const ids = [
    ['NES', 49], ['SNES', 79], ['N64', 83], ['GameCube', 105],
    ['Game Boy', 26], ['Game Boy Color', 43], ['GBA', 24],
    ['SMD', 167], ['Sega CD', 119], ['32X', 117],
    ['Master System', 74], ['Game Gear', 77], ['Saturn', 107], ['Dreamcast', 106],
    ['PS1', 27], ['PS2', 15], ['PSP', 17],
    ['STEAM', 4], ['PC', 4],
    ['Neo Geo', 12],
    ['Atari 2600', 23], ['Atari 5200', 31], ['Atari 7800', 28],
    ['Atari Lynx', 46], ['Atari Jaguar', 112], ['Atari ST', 34],
    ['Commodore 64', 166], ['Amiga', 166], ['Apple II', 41],
    ['3DO', 111],
  ];
  return ids;
}

/** Все платформы: [название, группа, цвет]. */
function platformList() {
  return [
    ['NES', 'Nintendo', '#e53935'], ['SNES', 'Nintendo', '#e53935'],
    ['N64', 'Nintendo', '#e53935'], ['GameCube', 'Nintendo', '#e53935'],
    ['Game Boy', 'Nintendo', '#e53935'], ['Game Boy Color', 'Nintendo', '#e53935'],
    ['GBA', 'Nintendo', '#e53935'], ['Virtual Boy', 'Nintendo', '#e53935'],
    ['Famicom Disk System', 'Nintendo', '#e53935'],
    ['SMD', 'Sega', '#1e88e5'], ['SMD+2', 'Sega', '#1e88e5'],
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
    ['ZX Spectrum', 'Компьютеры', '#546e7a'], ['ZXspec', 'Компьютеры', '#546e7a'],
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