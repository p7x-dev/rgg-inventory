/**
 * Справочник платформ для выпадающего списка в Solo RGG-таблице.
 * Запуск: Расширения → Apps Script → вставить → Запустить.
 * Скрипт:
 *  1. Находит лист с колонкой «Платформа» (по названию в любой строке шапки);
 *  2. Создаёт скрытый лист «Платформы» со всеми 50 платформами,
 *     раскрашенными по группам (цвета чипов в выпадающем списке);
 *  3. Ставит выпадающий список (из диапазона) на колонку «Платформа».
 * Если UI недоступен — итог в журнале: Просмотр → Журналы.
 */
function addPlatformsDropdown() {
  const PLATFORMS = [
    // Nintendo (красный)
    ['NES', '#e53935'], ['SNES', '#e53935'], ['N64', '#e53935'],
    ['GameCube', '#e53935'], ['Game Boy', '#e53935'], ['Game Boy Color', '#e53935'],
    ['GBA', '#e53935'], ['Virtual Boy', '#e53935'], ['Famicom Disk System', '#e53935'],
    // Sega (синий)
    ['SMD', '#1e88e5'], ['SMD+2', '#1e88e5'], ['Sega CD', '#1e88e5'],
    ['32X', '#1e88e5'], ['Master System', '#1e88e5'], ['Game Gear', '#1e88e5'],
    ['Saturn', '#1e88e5'], ['Dreamcast', '#1e88e5'], ['SG-1000', '#1e88e5'],
    // Sony (зелёный)
    ['PS1', '#43a047'], ['PS2', '#43a047'], ['PSP', '#43a047'], ['STEAM', '#43a047'],
    // NEC (фиолетовый)
    ['TG16', '#8e24aa'], ['PC-FX', '#8e24aa'],
    // SNK (оранжевый)
    ['Neo Geo', '#f4511e'], ['Neo Geo Pocket', '#f4511e'],
    // Atari (коричневый)
    ['Atari 2600', '#6d4c41'], ['Atari 5200', '#6d4c41'], ['Atari 7800', '#6d4c41'],
    ['Atari Lynx', '#6d4c41'], ['Atari Jaguar', '#6d4c41'], ['Atari ST', '#6d4c41'],
    // Компьютеры (сине-серый)
    ['ZX Spectrum', '#546e7a'], ['ZXspec', '#546e7a'], ['DOS', '#546e7a'],
    ['Commodore 64', '#546e7a'], ['Amiga', '#546e7a'], ['MSX', '#546e7a'],
    ['Amstrad CPC', '#546e7a'], ['Apple II', '#546e7a'], ['BBC Micro', '#546e7a'],
    ['X68000', '#546e7a'], ['FM Towns', '#546e7a'],
    // Прочее (серый)
    ['3DO', '#757575'], ['CD-i', '#757575'], ['WonderSwan', '#757575'],
    ['ColecoVision', '#757575'], ['Intellivision', '#757575'], ['Vectrex', '#757575'],
    ['Аркада', '#757575'],
  ];

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const found = findSheetWithPlatformColumn(ss);
  if (!found) {
    throw new Error('Не найден лист с колонкой «Платформа» (название в шапке).');
  }
  const target = found.sheet;
  const col = found.col + 1;

  // --- справочник «Платформы» ---
  const ref = ss.getSheetByName('Платформы') || ss.insertSheet('Платформы');
  ref.clear();
  ref.getRange(1, 1, PLATFORMS.length, 1).setValues(PLATFORMS.map(([name]) => [name]));
  for (let i = 0; i < PLATFORMS.length; i++) {
    ref.getRange(i + 1, 1).setBackground(PLATFORMS[i][1]);
  }
  ref.hideSheet();

  // --- колонка «Платформа» (строка шапки уже найдена) ---
  const lastRow = Math.max(target.getLastRow(), 2);
  const dataRange = target.getRange(found.headerRow + 2, col, Math.max(lastRow - found.headerRow - 1, 1), 1);

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ref.getRange(1, 1, PLATFORMS.length, 1), true)
    .setAllowInvalid(false)
    .setHelpText('Выбери платформу')
    .build();
  dataRange.setDataValidation(rule);

  SpreadsheetApp.flush();
  notify(
    `Готово!\n\nСправочник «Платформы» (50 платформ с цветами) создан.\nВыпадающий список поставлен на колонку «Платформа» (${String.fromCharCode(65 + col - 1)}) листа «${target.getName()}».\n\nСтроки ${found.headerRow + 2}–${lastRow} — отмечены.`,
  );
}

/** Показывает итог: alert, если UI доступен; иначе — в журнал (Просмотр → Журналы). */
function notify(message) {
  Logger.log(message);
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (err) {
    // UI недоступен — итог уже в журнале.
  }
}

const PLATFORM_KEYWORDS = ['платформа', 'платформы', 'platform', 'консоль', 'console', 'система', 'system'];

/** Нормализация заголовка для сравнения (регистр/пробелы не важны). */
function normalizeHeader(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Разбивает заголовок на слова. */
function headerWords(value) {
  return normalizeHeader(value).split(/[^\p{L}\p{N}]+/u).filter((w) => w !== '');
}

/** Совпадение заголовка с ключевым словом: слово/префикс (стемминг «платформы»↔«платформа»). */
function headerMatches(header, keyword) {
  const h = normalizeHeader(header);
  const k = normalizeHeader(keyword);
  if (!h || !k) return false;
  if (h === k) return true;
  for (const word of headerWords(header)) {
    if (word === k) return true;
    if (word.startsWith(k) || k.startsWith(word)) return true;
    const min = Math.min(word.length, k.length);
    if (min >= 4 && word.slice(0, min - 1) === k.slice(0, min - 1)) return true;
  }
  return false;
}

/** Индекс колонки с узнаваемым заголовком (или -1). */
function findHeaderColumn(line, keywords) {
  for (let c = 0; c < line.length; c++) {
    for (const kw of keywords) {
      if (headerMatches(line[c], kw)) return c;
    }
  }
  return -1;
}

/** Ищет лист с колонкой «Платформа» в любой строке шапки (до 100 строк). */
function findSheetWithPlatformColumn(ss) {
  const sheets = ss.getSheets();
  for (const sheet of sheets) {
    const rows = sheet.getRange(1, 1, Math.min(100, Math.max(sheet.getLastRow(), 1)), Math.max(sheet.getLastColumn(), 1)).getValues();
    for (let r = 0; r < rows.length; r++) {
      const col = findHeaderColumn(rows[r], PLATFORM_KEYWORDS);
      if (col >= 0) return { sheet, col, headerRow: r };
    }
  }
  return null;
}