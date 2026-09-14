/**
 * НАСТРОЙКА SOLO-ТАБЛИЦЫ (игры тянутся с RAWG API).
 *
 * Делает всё сам:
 *  1. Находит лист с колонками «Платформа» и «Игра».
 *  2. Справочник «Платформы»: 50 платформ с цветами + выпадающий список.
 *  3. Справочник «Игры»: у КАЖДОЙ платформы СВОЙ набор игр:
 *     база популярных (все 50 платформ) + записи из таблицы +
 *     каждый запуск докачивает следующую порцию с RAWG (по 100 на платформу).
 *  4. Каскадные списки на колонку «Игра» (только игры выбранной платформы).
 *
 * Нужен RAWG API-ключ (бесплатный на rawg.io/apidocs) — впиши в RAWG_KEY.
 * Запуск: Расширения → Apps Script → вставить всё → setupSoloTable → ▶ Запустить.
 * Докачка игр из RAWG отдельно: downloadRawgGames → ▶ Запустить (сколько нужно раз).
 * Колонки ищутся по названиям в любой строке шапки. Если UI недоступен —
 * итог в журнале: Просмотр → Журналы.
 */
const RAWG_KEY = '159a78471a7141bbafe4c1592b12162a'; // ← твой ключ RAWG

function setupSoloTable() {
  const PLATFORM_NAMES = ['платформа', 'платформы', 'platform', 'консоль', 'console', 'система', 'system'];
  const GAME_NAMES = ['игра', 'игры', 'game', 'games', 'название', 'title'];

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ============ 1. ЛИСТ И КОЛОНКИ (по названиям, шапка в любой строке) ============
  let target = null;
  let headerRow = -1;
  let colP = -1;
  let colG = -1;
  for (const sheet of ss.getSheets()) {
    const rows = sheet.getRange(1, 1, Math.min(100, Math.max(sheet.getLastRow(), 1)), Math.max(sheet.getLastColumn(), 1)).getValues();
    let foundP = -1;
    let foundG = -1;
    for (let r = 0; r < rows.length && (foundP < 0 || foundG < 0); r++) {
      if (foundP < 0) foundP = findHeaderColumn(rows[r], PLATFORM_NAMES);
      if (foundG < 0) foundG = findHeaderColumn(rows[r], GAME_NAMES);
    }
    if (foundP >= 0 && foundG >= 0) {
      target = sheet;
      headerRow = rows.findIndex((line) => findHeaderColumn(line, PLATFORM_NAMES) >= 0);
      colP = foundP + 1;
      colG = foundG + 1;
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
    throw new Error('Колонки «Платформа» и «Игра» не найдены. Заголовки:\n' + dump);
  }

  // ============ 2. СПРАВОЧНИК «Платформы» ============
  const platformDefs = platformList();
  const platformsRef = ss.getSheetByName('Платформы') || ss.insertSheet('Платформы');
  platformsRef.clear();
  platformsRef.getRange(1, 1, platformDefs.length, 1)
    .setValues(platformDefs.map((p) => [p[0]]));
  for (let i = 0; i < platformDefs.length; i++) {
    platformsRef.getRange(i + 1, 1).setBackground(platformDefs[i][1]);
  }
  platformsRef.hideSheet();

  const lastRow = target.getLastRow();
  const platformRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(platformsRef.getRange(1, 1, platformDefs.length, 1), true)
    .setAllowInvalid(false)
    .setHelpText('Выбери платформу')
    .build();
  target.getRange(headerRow + 2, colP, Math.max(lastRow - headerRow - 1, 1), 1).setDataValidation(platformRule);

  // ============ 3. СБОР ИГР (каждая платформа — свой набор) ============
  const pairs = new Map();
  const merge = (platform, game) => {
    const pl = String(platform).trim();
    const gm = String(game).trim();
    if (!pl || !gm) return;
    if (!pairs.has(pl)) pairs.set(pl, new Set());
    pairs.get(pl).add(gm);
  };
  // Полная база популярных игр — для ВСЕХ 50 платформ.
  for (const [pl, games] of gameCatalog()) {
    for (const g of games) merge(pl, g);
  }
  // Записи из самой таблицы (под строкой шапки).
  const data = target.getRange(headerRow + 2, 1, Math.max(target.getLastRow() - headerRow - 1, 1), Math.max(colP, colG)).getValues();
  for (const row of data) merge(row[colP - 1], row[colG - 1]);
  // Ручные дополнения из старого справочника «Игры».
  const oldRef = ss.getSheetByName('Игры');
  if (oldRef) {
    const oldRows = oldRef.getRange(1, 1, oldRef.getLastRow(), 2).getValues();
    for (const row of oldRows) merge(row[0], row[1]);
  }

  // Докачка следующей порции игр с RAWG (по 100 на платформу за запуск).
  const props = PropertiesService.getScriptProperties();
  const rawgReport = [];
  const added = fetchRawgGames(RAWG_KEY, rawgPlatformMap(), props, pairs, rawgReport);

  // ============ 4. СПРАВОЧНИК «Игры» ============
  const gamesRef = oldRef || ss.insertSheet('Игры');
  gamesRef.clear();
  const flat = [];
  for (const [platform, games] of pairs) {
    for (const game of games) flat.push([platform, game]);
  }
  if (flat.length) gamesRef.getRange(1, 1, flat.length, 2).setValues(flat);
  const colors = new Map(platformDefs.map((p) => [p[0].toLowerCase(), p[1]]));
  for (let i = 0; i < flat.length; i++) {
    gamesRef.getRange(i + 1, 1).setBackground(colors.get(flat[i][0].toLowerCase()) || '#757575');
  }
  gamesRef.hideSheet();

  // Диапазоны игр по платформам.
  const rangesOf = new Map();
  for (let i = 0; i < flat.length; i++) {
    const platform = flat[i][0];
    if (!rangesOf.has(platform)) rangesOf.set(platform, { startRow: i + 1, count: 0 });
    rangesOf.get(platform).count++;
  }

  // ============ 5. КАСКАДНЫЕ СПИСКИ НА КОЛОНКУ «Игра» ============
  const rowsToUpdate = Math.max(target.getLastRow() - headerRow - 1, 0);
  for (let i = 0; i < rowsToUpdate; i++) {
    const platform = String(data[i][colP - 1]).trim();
    const rangeInfo = rangesOf.get(platform);
    const cell = target.getRange(headerRow + 2 + i, colG);
    if (!rangeInfo) {
      cell.setDataValidation(null);
      continue;
    }
    const gameRange = gamesRef.getRange(rangeInfo.startRow, 2, rangeInfo.count, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(gameRange, true)
      .setAllowInvalid(false)
      .setHelpText('Игры платформы: ' + platform)
      .build();
    cell.setDataValidation(rule);
  }

  SpreadsheetApp.flush();
  notify(
    'Готово!\n\n' +
    '• Справочник «Игры»: ' + flat.length + ' игр (докачано с RAWG: ' + added + ')\n' +
    '• Каскадные списки — колонка «' + letter(colG) + '»\n\n' +
    'RAWG по платформам (название: добавлено):\n' + rawgReport.join(', ') +
    '\n\nВсё не влезло за один запуск — запусти downloadRawgGames ещё несколько раз,\n' +
    'он докачает следующие порции игр для каждой платформы.',
  );
}

/** Точное сопоставление наших платформ → id платформ RAWG. */
function rawgPlatformMap() {
  const props = PropertiesService.getScriptProperties();
  let ids = props.getProperty('rawg_platforms_v2');
  if (!ids) {
    const key = '159a78471a7141bbafe4c1592b12162a';
    const res = UrlFetchApp.fetch('https://api.rawg.io/api/platforms?key=' + key + '&page_size=100');
    const json = JSON.parse(res.getContentText());
    ids = JSON.stringify((json.results || []).map((p) => [p.name, p.id]));
    props.setProperty('rawg_platforms_v2', ids);
    Utilities.sleep(1300);
  }
  const byName = new Map(JSON.parse(ids));

  // Наши платформы → ТОЧНОЕ название в RAWG (без приблизительного подбора!).
  const wanted = [
    ['NES', 'Nintendo Entertainment System'],
    ['SNES', 'Super Nintendo'],
    ['N64', 'Nintendo 64'],
    ['GameCube', 'Nintendo GameCube'],
    ['Game Boy Color', 'Game Boy Color'],
    ['Game Boy', 'Game Boy'],
    ['GBA', 'Game Boy Advance'],
    ['Virtual Boy', 'Virtual Boy'],
    ['SMD', 'Sega Mega Drive'],
    ['Sega CD', 'Sega CD'],
    ['32X', 'Sega 32X'],
    ['Master System', 'Sega Master System'],
    ['Game Gear', 'Sega Game Gear'],
    ['Saturn', 'Sega Saturn'],
    ['Dreamcast', 'Sega Dreamcast'],
    ['PS1', 'PlayStation'],
    ['PS2', 'PlayStation 2'],
    ['PSP', 'PlayStation Portable'],
    ['STEAM', 'PC'],
    ['TG16', 'TurboGrafx-16'],
    ['Neo Geo', 'Neo Geo'],
    ['Neo Geo Pocket', 'Neo Geo Pocket'],
    ['Atari 2600', 'Atari 2600'],
    ['Atari 5200', 'Atari 5200'],
    ['Atari 7800', 'Atari 7800'],
    ['Atari Lynx', 'Atari Lynx'],
    ['Atari Jaguar', 'Atari Jaguar'],
    ['Atari ST', 'Atari ST'],
    ['ZX Spectrum', 'ZX Spectrum'],
    ['DOS', 'DOS'],
    ['Commodore 64', 'Commodore / Amiga'],
    ['Amiga', 'Commodore / Amiga'],
    ['MSX', 'MSX'],
    ['Apple II', 'Apple II'],
    ['BBC Micro', 'BBC Microcomputer'],
    ['X68000', 'Sharp X68000'],
    ['3DO', '3DO'],
    ['CD-i', 'Philips CD-i'],
    ['WonderSwan', 'WonderSwan'],
    ['ColecoVision', 'ColecoVision'],
    ['Intellivision', 'Intellivision'],
    ['Vectrex', 'Vectrex'],
    ['Аркада', 'Arcade'],
  ];

  const result = [];
  for (const [platform, rawgName] of wanted) {
    const lower = rawgName.toLowerCase();
    let found = null;
    for (const [name, id] of byName) {
      if (name.toLowerCase() === lower) { found = [name, id]; break; }
    }
    if (found) result.push([platform, found[1]]);
  }
  return result;
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

/** Нормализация заголовка для сравнения (регистр/пробелы не важны). */
function normalizeHeader(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Разбивает заголовок на слова. */
function headerWords(value) {
  return normalizeHeader(value).split(/[^\p{L}\p{N}]+/u).filter((w) => w !== '');
}

/** Совпадение заголовка с ключевым словом: слово/префикс (стемминг «игры»↔«игра»). */
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

/**
 * Докачивает по одной странице (100 игр) на платформу из RAWG и сливает
 * в pairs. Место запоминается в PropertiesService (page_<id>); платформы,
 * у которых страницы закончились, помечаются done_<id> и больше не
 * опрашиваются. Возвращает число добавленных игр.
 */
function fetchRawgGames(key, rawgIds, props, pairs, report) {
  // Мелкие батчи (по 4) + повторы при 429: RAWG лимитирует ~20 запросов/мин.
  const BATCH = 4;
  const sleep = (ms) => Utilities.sleep(ms);
  const todo = rawgIds.filter(([, id]) => !props.getProperty('done_' + id));
  let added = 0;
  const merge = (platform, game) => {
    const pl = String(platform).trim();
    const gm = String(game).trim();
    if (!pl || !gm) return;
    if (!pairs.has(pl)) pairs.set(pl, new Set());
    pairs.get(pl).add(gm);
  };
  for (let i = 0; i < todo.length; i += BATCH) {
    const chunk = todo.slice(i, i + BATCH);
    const attempts = 3; // до 3 попыток на батч при rate-limit
    for (let attempt = 0; attempt < attempts; attempt++) {
      const requests = chunk.map(([, id]) => {
        const page = Number(props.getProperty('page_' + id) || '1');
        return {
          url: 'https://api.rawg.io/api/games?key=' + key +
            '&platforms=' + id + '&page_size=100&page=' + page + '&ordering=-rating',
          muteHttpExceptions: true,
        };
      });
      const responses = UrlFetchApp.fetchAll(requests);
      const retry = [];
      chunk.forEach(([platform, id], idx) => {
        const res = responses[idx];
        const code = res ? res.getResponseCode() : 0;
        if (code === 429) {
          retry.push([platform, id]); // rate-limit — пробуем ещё раз
          return;
        }
        if (code !== 200) {
          report.push(platform + ':HTTP' + code);
          return;
        }
        try {
          const json = JSON.parse(res.getContentText());
          const games = (json.results || []).map((g) => g.name).filter((n) => n && String(n).trim());
          for (const g of games) merge(platform, g);
          if (games.length === 100) {
            props.setProperty('page_' + id, String(Number(props.getProperty('page_' + id) || '1') + 1));
          } else {
            props.setProperty('done_' + id, '1'); // страницы закончились
          }
          added += games.length;
          report.push(platform + ':+' + games.length);
        } catch (err) {
          report.push(platform + ':err');
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
    if (i + BATCH < todo.length) sleep(2500);
  }
  return added;
}

/**
 * ДОКАЧКА ИГР ИЗ RAWG — запускай отдельно, сколько нужно раз.
 * Каждый запуск берёт следующую страницу по каждой платформе (место
 * запоминается) и дописывает новые игры в лист «Игры». Платформы,
 * у которых страницы закончились, больше не опрашиваются.
 */
function downloadRawgGames() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gamesRef = ss.getSheetByName('Игры') || ss.insertSheet('Игры');
  const pairs = new Map();
  if (gamesRef.getLastRow() > 0) {
    const oldRows = gamesRef.getRange(1, 1, gamesRef.getLastRow(), 2).getValues();
    for (const row of oldRows) {
      const pl = String(row[0]).trim();
      const gm = String(row[1]).trim();
      if (!pl || !gm) continue;
      if (!pairs.has(pl)) pairs.set(pl, new Set());
      pairs.get(pl).add(gm);
    }
  }
  const props = PropertiesService.getScriptProperties();
  const report = [];
  const added = fetchRawgGames(RAWG_KEY, rawgPlatformMap(), props, pairs, report);
  const flat = [];
  for (const [platform, games] of pairs) for (const game of games) flat.push([platform, game]);
  gamesRef.clear();
  if (flat.length) gamesRef.getRange(1, 1, flat.length, 2).setValues(flat);
  gamesRef.hideSheet();
  const total = rawgPlatformMap().length;
  const done = rawgPlatformMap().filter(([, id]) => props.getProperty('done_' + id)).length;
  notify(
    'Докачка RAWG завершена.\n\n' +
    'Добавлено игр: ' + added + '.\n' +
    'Осталось платформ в очереди: ' + (total - done) + ' из ' + total + '.\n\n' +
    'RAWG по платформам:\n' + report.join(', ') +
    '\n\nЗапусти downloadRawgGames ещё раз, чтобы продолжить докачку.',
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

/** Все 50 платформ с цветами по группам. */
function platformList() {
  return [
    ['NES', '#e53935'], ['SNES', '#e53935'], ['N64', '#e53935'],
    ['GameCube', '#e53935'], ['Game Boy', '#e53935'], ['Game Boy Color', '#e53935'],
    ['GBA', '#e53935'], ['Virtual Boy', '#e53935'], ['Famicom Disk System', '#e53935'],
    ['SMD', '#1e88e5'], ['SMD+2', '#1e88e5'], ['Sega CD', '#1e88e5'],
    ['32X', '#1e88e5'], ['Master System', '#1e88e5'], ['Game Gear', '#1e88e5'],
    ['Saturn', '#1e88e5'], ['Dreamcast', '#1e88e5'], ['SG-1000', '#1e88e5'],
    ['PS1', '#43a047'], ['PS2', '#43a047'], ['PSP', '#43a047'], ['STEAM', '#43a047'],
    ['TG16', '#8e24aa'], ['PC-FX', '#8e24aa'],
    ['Neo Geo', '#f4511e'], ['Neo Geo Pocket', '#f4511e'],
    ['Atari 2600', '#6d4c41'], ['Atari 5200', '#6d4c41'], ['Atari 7800', '#6d4c41'],
    ['Atari Lynx', '#6d4c41'], ['Atari Jaguar', '#6d4c41'], ['Atari ST', '#6d4c41'],
    ['ZX Spectrum', '#546e7a'], ['ZXspec', '#546e7a'], ['DOS', '#546e7a'],
    ['Commodore 64', '#546e7a'], ['Amiga', '#546e7a'], ['MSX', '#546e7a'],
    ['Amstrad CPC', '#546e7a'], ['Apple II', '#546e7a'], ['BBC Micro', '#546e7a'],
    ['X68000', '#546e7a'], ['FM Towns', '#546e7a'],
    ['3DO', '#757575'], ['CD-i', '#757575'], ['WonderSwan', '#757575'],
    ['ColecoVision', '#757575'], ['Intellivision', '#757575'], ['Vectrex', '#757575'],
    ['Аркада', '#757575'],
  ];
}

/** Полная база популярных игр — для ВСЕХ 50 платформ (у каждой свои). */
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