// Google Apps Script 側のコード（控え）
// スプレッドシートの「拡張機能 → Apps Script」で開いたエディタに、この内容を貼り付けて使う

// 1行目に書く見出し
const HEADERS = ["受信日時", "participantId", "type", "payload"];

// ブラウザから POST で送られてきたデータを受け取る
function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    // 同時に送信されても行が混ざらないよう、ほかの書き込みが終わるまで最大10秒待つ
    lock.waitLock(10000);

    // 送られてきた JSON 文字列を読む
    const data = JSON.parse(e.postData.contents);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // シートが空なら、1行目に見出しを書く
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    // payload は JSON 文字列のまま保存する
    const payload = typeof data.payload === "string" ? data.payload : JSON.stringify(data.payload);

    sheet.appendRow([
      new Date(),          // 受信日時（サーバー側の時刻）
      data.participantId,
      data.type,
      payload
    ]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 結果を JSON で返す
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
