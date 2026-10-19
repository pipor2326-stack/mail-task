// スプレッドシート（Google Apps Script）にデータを送る

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
