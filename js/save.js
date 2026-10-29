// スプレッドシート（Google Apps Script）にデータを送る

// サーバー(GAS)に頼みごとをして、返事を受け取る
//   action: "getId"(参加者IDをもらう)/ "getPattern"(割り付けパターンをもらう)
// 成功したら返事({ ok: true, ... })を渡す。失敗(通信エラー・時間切れ・サーバー側エラー)したら catch に進む
function callServer(action) {
  // SERVER_TIMEOUT_MS ミリ秒たっても返事がなければ、あきらめる
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);

  return fetch(SAVE_URL, {
    method: "POST",
    body: JSON.stringify({ action: action }),
    signal: controller.signal
  })
    .then(response => response.json())
    .then(result => {
      if (!result.ok) throw new Error(result.error || "サーバー側エラー");
      return result;
    })
    .finally(() => clearTimeout(timer));
}

// data の例: { participantId: "test", type: "test", payload: { ... } }
function sendToSheet(data) {
  // Content-Type を指定しない（text/plain になる）ことで、CORS の事前確認を避ける
  return fetch(SAVE_URL, {
    method: "POST",
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(result => {
      if (result.ok) {
        console.log("送信成功:", data);
      } else {
        console.error("送信失敗（サーバー側エラー）:", result.error);
      }
      return result;
    })
    .catch(error => {
      console.error("送信失敗（通信エラー）:", error);
      return { ok: false, error: String(error) };
    });
}
