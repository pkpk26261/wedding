/*
 * ============================================
 *  Google Apps Script — 婚禮網站 API（共用部署）
 * ============================================
 *
 *  本腳本整合了兩個功能：
 *    1. 圖片索引 API（預設）
 *    2. 賓客座位查詢 API（?action=seats）
 *
 *  【部署步驟】
 *
 *  1. 前往 https://script.google.com/ 並登入你的 Google 帳號
 *  2. 點擊「新專案」
 *  3. 把下方所有程式碼貼到編輯器中（取代預設的 myFunction）
 *  4. 修改下方的 FOLDER_ID 和 SPREADSHEET_ID
 *  5. 點擊上方選單「部署」→「新增部署作業」
 *  6. 左側齒輪選「網頁應用程式」
 *  7. 設定：
 *     - 說明：婚禮網站 API
 *     - 執行身分：我自己
 *     - 誰可以存取：所有人
 *  8. 點擊「部署」→ 授權 → 複製產生的網址
 *  9. 把網址貼到 index.html 中的 DRIVE_SCRIPT_URL 變數
 *     （SEAT_SCRIPT_URL 會自動使用同一個網址加上 ?action=seats）
 *
 *  完成！一個部署同時處理圖片和座位查詢。
 *
 *  【座位試算表格式】
 *
 *  每個工作表代表一「桌」，工作表名稱 = 桌名（如「主桌」「第1桌」等）。
 *  工作表中 A 欄放賓客姓名（從 A1 開始，不需要標題列）。
 *
 *  工作表「主桌」:        工作表「第1桌」:       工作表「第2桌」:
 *  ┌──────────┐       ┌──────────┐      ┌──────────┐
 *  │  黃裕仁    │       │  王大明    │      │  李小華    │
 *  │  黎氏翠    │       │  王太太    │      │  陳美麗    │
 *  │  黃山炎    │       │  張三      │      │  林志明    │
 *  │  王雪如    │       │  李四      │      │  ...      │
 *  └──────────┘       └──────────┘      └──────────┘
 */

// ===== 設定區 =====
var FOLDER_ID      = '1Bra7HNtyfRpjHae3bzalSeBLhhLpE4xM';  // Google Drive 圖片資料夾 ID
var SPREADSHEET_ID = '16GihMm_bh7EwaUtQjcEyW4URVOKAFyJVKA6rgdCtMOo';  // 座位表試算表 ID

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'images';

  if (action === 'seats') {
    return getSeatData();
  } else {
    return getImageData();
  }
}

// ===== 圖片索引 API =====
function getImageData() {
  var result = {};

  try {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var subFolders = folder.getFolders();

    while (subFolders.hasNext()) {
      var sub = subFolders.next();
      var name = sub.getName();
      var files = sub.getFiles();
      result[name] = [];

      while (files.hasNext()) {
        var file = files.next();
        var mimeType = file.getMimeType();

        if (mimeType.indexOf('image') === 0) {
          result[name].push({
            id: file.getId(),
            name: file.getName()
          });
        }
      }

      result[name].sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });
    }

    var rootFiles = folder.getFiles();
    var rootImages = [];
    while (rootFiles.hasNext()) {
      var rf = rootFiles.next();
      if (rf.getMimeType().indexOf('image') === 0) {
        rootImages.push({
          id: rf.getId(),
          name: rf.getName()
        });
      }
    }
    if (rootImages.length > 0) {
      rootImages.sort(function(a, b) { return a.name.localeCompare(b.name); });
      result['root'] = rootImages;
    }

  } catch (err) {
    result.error = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== 賓客座位查詢 API =====
function getSeatData() {
  var result = {};

  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheets = ss.getSheets();

    for (var i = 0; i < sheets.length; i++) {
      var sheet = sheets[i];
      var tableName = sheet.getName();
      var lastRow = sheet.getLastRow();

      if (lastRow === 0) continue;

      var values = sheet.getRange(1, 1, lastRow, 1).getValues();
      var guests = [];

      for (var r = 0; r < values.length; r++) {
        var name = String(values[r][0]).trim();
        if (name && name !== '') {
          guests.push(name);
        }
      }

      if (guests.length > 0) {
        result[tableName] = guests;
      }
    }

  } catch (err) {
    result.error = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
