// Google Apps Script 側のコード（控え）
// スプレッドシートの「拡張機能 → Apps Script」で開いたエディタに、この内容を貼り付けて使う
// このファイルを変えたら、エディタに貼り直し、「デプロイを管理」→ 編集 →「新バージョン」でデプロイし直す

// 1行目に書く見出し
const HEADERS = ["受信日時", "participantId", "type", "payload"];

// カウンターの数字を保存しておく場所の名前(スクリプト プロパティ)
const ID_COUNTER_KEY = "ID_COUNTER";         // 参加者IDの番号(P001 なら 1)
const ASSIGN_COUNTER_KEY = "ASSIGN_COUNTER"; // 割り付けを何人に配ったか

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

    // それ以外:データをシートに書き込む
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
