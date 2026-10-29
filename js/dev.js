// 開発者モード(URL の末尾に ?dev=1 を付けたとき)
//
// 使える指定(& でつなげる):
//   ?dev=1               開発者モードにする
//   &start=block1        好きな画面から始める(画面の名前は js/screens.js の SCREEN_ORDER を参照)
//   &pattern=3           割り付けパターンを指定する(段階5で使う)
//   &n=4                 1ブロックの試行数を減らす(段階3以降で使う)
//   &rest=3              休憩の待ち時間(秒)を変える(config.js の REST_MIN_SECONDS は変えない)

const urlParams = new URLSearchParams(location.search);

const DEV = {
  isDev: urlParams.get("dev") === "1",
  start: urlParams.get("start"),            // 指定がなければ null
  pattern: Number(urlParams.get("pattern")) || null,
  n: Number(urlParams.get("n")) || null,
  rest: parseRestSeconds(urlParams.get("rest"))
};

// &rest= の値を秒数にする。0以上の整数でなければ null(指定なし扱い)
function parseRestSeconds(value) {
  if (value === null) return null;
  const seconds = Number(value);
  if (!Number.isInteger(seconds) || seconds < 0) {
    console.error("&rest= の値が正しくありません(0以上の整数にしてください):", value);
    return null;
  }
  return seconds;
}

// 開発者モードでないときは、ほかの指定はすべて無視する
if (!DEV.isDev) {
  DEV.start = null;
  DEV.pattern = null;
  DEV.n = null;
  DEV.rest = null;
}

// 画面の右下に「開発者モード」の札を出す
// (今どの画面にいるかと、参加済みの記録を消すボタン)
function setupDevPanel() {
  if (!DEV.isDev) return;

  const panel = document.createElement("div");
  panel.id = "dev-panel";
  panel.innerHTML = `
    <div><strong>開発者モード</strong></div>
    <div>画面: <span id="dev-screen-name">-</span></div>
    <div>抽選: <span id="dev-draw">-</span></div>
    <div>いまの試行: <span id="dev-trial">-</span></div>
    <button id="dev-clear-button">参加済みの記録を消す</button>
  `;
  document.body.appendChild(panel);

  document.getElementById("dev-clear-button").addEventListener("click", () => {
    localStorage.removeItem(PARTICIPATED_KEY);
    alert("参加済みの記録を消しました。");
  });

  console.log("開発者モードの設定:", DEV);
}

// 札の「画面:」の表示を更新する(画面が切り替わるたびに screens.js から呼ばれる)
function updateDevPanel(screenName) {
  const span = document.getElementById("dev-screen-name");
  if (span) span.textContent = screenName;
}

// 札の「抽選:」に、確認画面を出す試行の抽選結果を表示する(ブロック開始時に task.js から呼ばれる)
//   例:「2/8通(ひっかけ1・通常1) A03, A06」
function updateDevDraw(order, draw) {
  const span = document.getElementById("dev-draw");
  if (!span) return;
  const ids = order.filter(mail => draw.ids.has(mail.id)).map(mail => mail.id); // 表示順に並べる
  span.textContent = `${ids.length}/${order.length}通(ひっかけ${draw.trapCount}・通常${draw.normalCount}) ${ids.join(", ")}`;
}

// 札の「いまの試行:」に、いまのメールの正解と、確認画面を出すかを表示する(mail が null なら「-」)
function updateDevTrial(mail, willShowDialog) {
  const span = document.getElementById("dev-trial");
  if (!span) return;
  span.textContent = mail
    ? `${mail.id} 正解=${mail.correctFolder}${mail.isTrap ? "(ひっかけ)" : ""} 確認画面=${willShowDialog ? "出す" : "出さない"}`
    : "-";
}
