/*
 * ============================================
 *  Google Apps Script — 婚禮網站圖片索引 API
 * ============================================
 *
 *  【部署步驟】
 *
 *  1. 前往 https://script.google.com/ 並登入你的 Google 帳號
 *  2. 點擊「新專案」
 *  3. 把下方的 doGet 函式貼到編輯器中（取代預設的 myFunction）
 *  4. 點擊上方選單「部署」→「新增部署作業」
 *  5. 左側齒輪選「網頁應用程式」
 *  6. 設定：
 *     - 說明：婚禮圖片 API
 *     - 執行身分：我自己
 *     - 誰可以存取：所有人
 *  7. 點擊「部署」→ 授權 → 複製產生的網址
 *  8. 把網址貼到 index.html 中的 DRIVE_SCRIPT_URL 變數
 *
 *  完成！網站就會自動從你的 Google 雲端硬碟載入圖片。
 *  之後只要把新照片上傳到雲端資料夾，網站會自動更新。
 */

function doGet(e) {
  // 你的 Google Drive 資料夾 ID（從共用連結中取得）
  var FOLDER_ID = '1Bra7HNtyfRpjHae3bzalSeBLhhLpE4xM';

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

        // 只取圖片檔案
        if (mimeType.indexOf('image') === 0) {
          result[name].push({
            id: file.getId(),
            name: file.getName()
          });
        }
      }

      // 依檔名排序
      result[name].sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });
    }

    // 也檢查根資料夾的圖片
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
