// Google Apps Script 側のコード（控え）
// スプレッドシートの「拡張機能 → Apps Script」で開いたエディタに、この内容を貼り付けて使う
// このファイルを変えたら、エディタに貼り直し、「デプロイを管理」→ 編集 →「新バージョン」でデプロイし直す

// カウンターの数字を保存しておく場所の名前(スクリプト プロパティ)
const ID_COUNTER_KEY = "ID_COUNTER";         // 参加者IDの番号(P001 なら 1)
const ASSIGN_COUNTER_KEY = "ASSIGN_COUNTER"; // 割り付けを何人に配ったか

// データを書き込むシートの名前(なければ自動で作る)
const TRIALS_SHEET = "trials";
const PARTICIPANTS_SHEET = "participants";

// ブラウザから POST で送られてきたデータを受け取る
function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    // 同時に送信されても行が混ざったり番号が重なったりしないよう、ほかの処理が終わるまで最大10秒待つ
    lock.waitLock(10000);

    // 送られてきた JSON 文字列を読む
    const data = JSON.parse(e.postData.contents);

    // 同意した時点:参加者IDを1つ進めて返す
    if (data.action === "getId") {
      return jsonResponse({ ok: true, participantId: nextParticipantId() });
    }

    // 割り付けの時点:割り付けパターン(1〜4)を順番に返す
    if (data.action === "getPattern") {
      return jsonResponse({ ok: true, pattern: nextPattern() });
    }

    // 各フェーズの終わり:試行の行をまとめて trials シートに追加する
    if (data.action === "trials") {
      return jsonResponse({ ok: true, status: appendTrials(data.sendId, data.data) });
    }

    // 参加者の行を participants シートに書く(なければ作り、あれば上書き)
    if (data.action === "participant") {
      return jsonResponse({ ok: true, status: upsertParticipant(data.data) });
    }

    return jsonResponse({ ok: false, error: "知らない action です: " + data.action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// ===== カウンター =====

// ID カウンターを1つ進め、"P001" のような参加者IDを返す
function nextParticipantId() {
  const n = incrementCounter(ID_COUNTER_KEY);
  return "P" + String(n).padStart(3, "0");
}

// 割り付けカウンターを1つ進め、1→2→3→4→1… の順にパターンを返す
function nextPattern() {
  const n = incrementCounter(ASSIGN_COUNTER_KEY);
  return ((n - 1) % 4) + 1;
}

// カウンターを1つ進めて、進めたあとの数を返す(まだ一度も使っていなければ 1 を返す)
function incrementCounter(key) {
  const props = PropertiesService.getScriptProperties();
  const n = Number(props.getProperty(key) || 0) + 1;
  props.setProperty(key, String(n));
  return n;
}

// ===== シートへの書き込み =====

// 試行の行をまとめて trials シートの末尾に追加する
// 同じ sendId がすでに書き込まれていたら、何もしない(再送で同じ行が重複しないように)
function appendTrials(sendId, rows) {
  const sheet = getOrCreateSheet(TRIALS_SHEET);
  if (rows.length === 0) return "empty";

  const keys = ["sendId", "receivedAt"].concat(Object.keys(rows[0]));
  const headers = ensureHeaders(sheet, keys);

  if (findRowByValue(sheet, headers.indexOf("sendId") + 1, sendId)) {
    return "duplicate";
  }

  const receivedAt = new Date();
  const values = rows.map(row => headers.map(header => {
    if (header === "sendId") return sendId;
    if (header === "receivedAt") return receivedAt;
    return toCell(row[header]);
  }));
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, headers.length).setValues(values);
  return "written";
}

// 参加者の行を participants シートに書く
// 同じ参加者IDの行があれば上書きする。ただし、届いた内容がすでに書かれているものより古ければ(updateSeq が小さければ)何もしない
function upsertParticipant(row) {
  const sheet = getOrCreateSheet(PARTICIPANTS_SHEET);
  const headers = ensureHeaders(sheet, ["receivedAt"].concat(Object.keys(row)));

  const values = headers.map(header => header === "receivedAt" ? new Date() : toCell(row[header]));
  const rowNumber = findRowByValue(sheet, headers.indexOf("participantId") + 1, row.participantId);

  if (rowNumber) {
    const oldSeq = Number(sheet.getRange(rowNumber, headers.indexOf("updateSeq") + 1).getValue()) || 0;
    if (oldSeq >= row.updateSeq) return "skipped";
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([values]);
    return "updated";
  }
  sheet.appendRow(values);
  return "created";
}

// シートを名前で探す。なければ作る
function getOrCreateSheet(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

// 1行目の見出しを確かめ、足りない列名を右端に足す。見出しの一覧を返す
// (あとで記録する項目を増やしても、このコードを直さずに済むように)
function ensureHeaders(sheet, keys) {
  let headers = [];
  if (sheet.getLastRow() > 0) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  const missing = keys.filter(key => headers.indexOf(key) === -1);
  if (missing.length > 0) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    headers = headers.concat(missing);
  }
  return headers;
}

// column 列目に value と同じ値が入っている行の番号を返す(なければ null)
function findRowByValue(sheet, column, value) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const found = sheet.getRange(2, column, lastRow - 1, 1)
    .createTextFinder(String(value))
    .matchEntireCell(true)
    .findNext();
  return found ? found.getRow() : null;
}

// シートのマスに入れる形にする(null は空欄、配列やオブジェクトは JSON の文字にする)
function toCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

// ===== GAS のエディタから手で実行する関数 =====

// 【本番を始める前に1回だけ】2つのカウンターを0に戻す
// 次に同意した人が P001、次に割り付けを受けた人がパターン1 になる
function resetCounters() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties();
    props.deleteProperty(ID_COUNTER_KEY);
    props.deleteProperty(ASSIGN_COUNTER_KEY);
    Logger.log("カウンターを0に戻しました。");
  } finally {
    lock.releaseLock();
  }
  showCounters();
}

// いまのカウンターの数を「実行ログ」に表示する(確認用。数は変えない)
function showCounters() {
  const props = PropertiesService.getScriptProperties();
  Logger.log("ID カウンター: " + (props.getProperty(ID_COUNTER_KEY) || 0));
  Logger.log("割り付けカウンター: " + (props.getProperty(ASSIGN_COUNTER_KEY) || 0));
}

// 結果を JSON で返す
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
