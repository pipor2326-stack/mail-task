// スプレッドシート（Google Apps Script）にデータを送る
//
// 送り方(SPEC.md 7章):
//   1. 送るデータを、まず localStorage の「送信待ちリスト」に入れる(ページを閉じても消えない)
//   2. リストの先頭から順に送る。成功したらリストから消す
//   3. 失敗したら、画面の上に「再送する」ボタンを出す
// 送るデータには1件ごとに送信ID(sendId)を付け、GAS は同じ送信IDを2回目以降は書き込まない

// ===== サーバーとの通信の土台 =====

// GAS に JSON を送り、返事を受け取る
// 成功したら返事({ ok: true, ... })を渡す。失敗(通信エラー・時間切れ・サーバー側エラー)したら catch に進む
function postToServer(body) {
  // SERVER_TIMEOUT_MS ミリ秒たっても返事がなければ、あきらめる
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);

  // Content-Type を指定しない（text/plain になる）ことで、CORS の事前確認を避ける
  return fetch(SAVE_URL, {
    method: "POST",
    body: JSON.stringify(body),
    signal: controller.signal
  })
    .then(response => response.json())
    .then(result => {
      if (!result.ok) throw new Error(result.error || "サーバー側エラー");
      return result;
    })
    .finally(() => clearTimeout(timer));
}

// サーバー(GAS)に頼みごとをして、返事を受け取る
//   action: "getId"(参加者IDをもらう)/ "getPattern"(割り付けパターンをもらう)
function callServer(action) {
  return postToServer({ action: action });
}

// ===== 送信待ちリスト =====

// localStorage が使えない設定のブラウザでも止まらないよう、読み書きの失敗は Console に出すだけにする
function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(SEND_QUEUE_KEY)) || [];
  } catch (error) {
    console.error("送信待ちリストを読めませんでした:", error);
    return [];
  }
}

function saveQueue(queue) {
  try {
    localStorage.setItem(SEND_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("送信待ちリストに保存できませんでした:", error);
  }
  updateDevQueue(queue.length);
}

// 送信待ちが残っていないか
function isQueueEmpty() {
  return loadQueue().length === 0;
}

// trials シートに、試行の行をまとめて送る
//   sendId: 例「P001-trials-practice」(同じフェーズを2回書き込まないための名前)
function sendTrials(sendId, rows) {
  addToQueue({ sendId: sendId, action: "trials", data: rows });
}

// participants シートの、この参加者の行を送る(なければ作り、あれば上書きする)
function sendParticipant(row) {
  // まだ送れていない古い参加者の行は、新しい行で置き換える(いつも最新の内容だけ送ればよいため)
  const queue = loadQueue().filter(item => item.action !== "participant");
  saveQueue(queue);
  addToQueue({ sendId: row.participantId + "-participant-" + row.updateSeq, action: "participant", data: row });
}

function addToQueue(item) {
  const queue = loadQueue();
  queue.push(item);
  saveQueue(queue);
  flushQueue();
}

// ===== 送信 =====

let flushing = null;     // 送信中なら、その処理(Promise)
let onAllSent = null;    // 送信待ちが空になったときに呼ぶ関数(終了画面で使う)

// 送信待ちリストを先頭から順に送る。全部送れたら true、途中で失敗したら false を返す
function flushQueue() {
  // すでに送信中なら、それが終わってからもう一度送る(その間に増えた分も送るため)
  if (flushing) return flushing.then(() => flushQueue());

  flushing = (async () => {
    while (true) {
      const queue = loadQueue();
      if (queue.length === 0) break;
      const item = queue[0];
      try {
        const result = await postToServer({ action: item.action, sendId: item.sendId, data: item.data });
        console.log("送信成功:", item.sendId, result.status || "");
        // 送れたものだけリストから消す(送っている間に増えたものは残す)
        saveQueue(loadQueue().filter(other => other.sendId !== item.sendId));
      } catch (error) {
        console.error("送信失敗:", item.sendId, error);
        showSendError();
        return false;
      }
    }
    hideSendError();
    if (onAllSent) onAllSent();
    return true;
  })();

  return flushing.finally(() => { flushing = null; });
}

// ===== 送信に失敗したときの表示(画面の上の帯) =====

const sendErrorBar = document.getElementById("send-error");

function showSendError() {
  sendErrorBar.style.display = "block";
}

function hideSendError() {
  sendErrorBar.style.display = "none";
}

document.getElementById("send-retry-button").addEventListener("click", () => {
  hideSendError();
  flushQueue();
});
