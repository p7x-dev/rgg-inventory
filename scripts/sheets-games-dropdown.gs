/**
 * Каскадный выпадающий список игр для колонки «Игра»:
 * показываются только игры выбранной в той же строке платформы.
 *
 * Механика (без Advanced Service): скрытый справочник «Игры» (A=платформа, B=игра);
 * для каждой строки таблицы ставится своя валидация с диапазоном игр её платформы.
 *
 * ВАЖНО: если в строке поменять платформу — список обновится после повторного
 * запуска скрипта (так же, как после добавления новых игр).
 *
 * Запуск: addGamesDropdown
 */
function addGamesDropdown() {
  const REF_NAME = 'Игры';
  const PLATFORM_NAMES = ['платформа', 'platform', 'консоль', 'console'];
  const GAME_NAMES = ['игра', 'игры', 'game', 'games', 'название', 'title'];

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Ищем лист: колонки «Платформа» и «Игра» (могут быть в разных строках).
  let target = null;
  let colP = -1;
  let colG = -1;
  for (const sheet of ss.getSheets()) {
    const rows = sheet.getRange(1, 1, 50, Math.max(sheet.getLastColumn(), 1)).getValues();
    let foundP = -1;
    let foundG = -1;
    for (let r = 0; r < rows.length && (foundP < 0 || foundG < 0); r++) {
      const line = rows[r].map((h) => String(h).trim().toLowerCase());
      if (foundP < 0) {
        const p = line.findIndex((h) => PLATFORM_NAMES.includes(h));
        if (p >= 0) foundP = p + 1;
      }
      if (foundG < 0) {
        const g = line.findIndex((h) => GAME_NAMES.includes(h));
        if (g >= 0) foundG = g + 1;
      }
    }
    if (foundP >= 0 && foundG >= 0) {
      target = sheet;
      colP = foundP;
      colG = foundG;
      break;
    }
  }
  if (!target) {
    const dump = ss.getSheets()
      .map((s) => {
        const row1 = s.getRange(1, 1, 1, Math.max(s.getLastColumn(), 1)).getValues()[0]
          .map((h) => '«' + String(h).trim() + '»').join(' | ');
        return s.getName() + ': ' + (row1 || '(пусто)');
      })
      .join('\n');
    throw new Error('Колонки не найдены. Заголовки первых строк листов:\n' + dump);
  }

  // 2. Собираем пары платформа→игра из данных таблицы.
  const lastDataRow = target.getLastRow();
  const data = target.getRange(2, 1, Math.max(lastDataRow - 1, 1), Math.max(colP, colG)).getValues();
  const pairs = new Map(); // платформа -> Set(игр)
  for (const row of data) {
    const pl = String(row[colP - 1]).trim();
    const gm = String(row[colG - 1]).trim();
    if (!pl || !gm) continue;
    if (!pairs.has(pl)) pairs.set(pl, new Set());
    pairs.get(pl).add(gm);
  }

  // 3. Справочник «Игры»: A=платформа (цвет), B=игра.
  const ref = ss.getSheetByName(REF_NAME) || ss.insertSheet(REF_NAME);
  ref.clear();
  const flat = [];
  for (const [platform, games] of pairs) {
    for (const game of games) flat.push([platform, game]);
  }
  if (flat.length) {
    ref.getRange(1, 1, flat.length, 2).setValues(flat);
  }
  const platformColors = platformColorMap();
  for (let i = 0; i < flat.length; i++) {
    const color = platformColors[flat[i][0].toLowerCase()] || '#757575';
    ref.getRange(i + 1, 1).setBackground(color);
  }
  ref.hideSheet();

  // Диапазоны игр по платформам: платформа -> { startRow, count }
  const rangesOf = new Map();
  for (let i = 0; i < flat.length; i++) {
    const platform = flat[i][0];
    if (!rangesOf.has(platform)) rangesOf.set(platform, { startRow: i + 1, count: 0 });
    rangesOf.get(platform).count++;
  }

  // 4. Построчно ставим валидацию: игры платформы текущей строки.
  const rowsToUpdate = Math.max(lastDataRow - 1, 0);
  for (let i = 0; i < rowsToUpdate; i++) {
    const platform = String(data[i][colP - 1]).trim();
    const rangeInfo = rangesOf.get(platform);
    const cell = target.getRange(i + 2, colG);
    if (!rangeInfo) {
      cell.setDataValidation(null); // платформа без игр — свободный ввод
      continue;
    }
    const gameRange = ref.getRange(rangeInfo.startRow, 2, rangeInfo.count, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(gameRange, true)
      .setAllowInvalid(false)
      .setHelpText('Игры платформы: ' + platform)
      .build();
    cell.setDataValidation(rule);
  }

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert(
    'Готово!\n\nКолонка «Игра» (стр. ' + colG + ') — каскадный список: игры показываются по выбранной платформе.\n\nСправочник «' + REF_NAME + '» скрыт (Вид → Скрытые листы), там можно дополнять игры.\n\nПосле изменения платформы в строке или добавления игр — запусти скрипт заново.',
  );
}

/** Буква колонки по номеру (1 → A). */
function letter(col) {
  let name = '';
  let n = col;
  while (n > 0) {
    const mod = (n - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

/** Цвета платформ — те же, что в справочнике «Платформы». */
function platformColorMap() {
  const pairs = [
    ['nes', '#e53935'], ['snes', '#e53935'], ['n64', '#e53935'],
    ['gamecube', '#e53935'], ['game boy', '#e53935'], ['game boy color', '#e53935'],
    ['gba', '#e53935'], ['virtual boy', '#e53935'], ['famicom disk system', '#e53935'],
    ['smd', '#1e88e5'], ['smd+2', '#1e88e5'], ['sega cd', '#1e88e5'],
    ['32x', '#1e88e5'], ['master system', '#1e88e5'], ['game gear', '#1e88e5'],
    ['saturn', '#1e88e5'], ['dreamcast', '#1e88e5'], ['sg-1000', '#1e88e5'],
    ['ps1', '#43a047'], ['ps2', '#43a047'], ['psp', '#43a047'], ['steam', '#43a047'],
    ['tg16', '#8e24aa'], ['pc-fx', '#8e24aa'],
    ['neo geo', '#f4511e'], ['neo geo pocket', '#f4511e'],
    ['atari 2600', '#6d4c41'], ['atari 5200', '#6d4c41'], ['atari 7800', '#6d4c41'],
    ['atari lynx', '#6d4c41'], ['atari jaguar', '#6d4c41'], ['atari st', '#6d4c41'],
    ['zx spectrum', '#546e7a'], ['zxspec', '#546e7a'], ['dos', '#546e7a'],
    ['commodore 64', '#546e7a'], ['amiga', '#546e7a'], ['msx', '#546e7a'],
    ['amstrad cpc', '#546e7a'], ['apple ii', '#546e7a'], ['bbc micro', '#546e7a'],
    ['x68000', '#546e7a'], ['fm towns', '#546e7a'],
    ['3do', '#757575'], ['cd-i', '#757575'], ['wonderswan', '#757575'],
    ['colecovision', '#757575'], ['intellivision', '#757575'], ['vectrex', '#757575'],
    ['аркада', '#757575'],
  ];
  return Object.fromEntries(pairs);
}