// 開発者モード(URL の末尾に ?dev=1 を付けたとき)
//
// 使える指定(& でつなげる):
//   ?dev=1               開発者モードにする
//   &start=block1        好きな画面から始める(画面の名前は js/screens.js の SCREEN_ORDER を参照)
//   &pattern=3           割り付けパターンを指定する(段階5で使う)
//   &n=4                 1ブロックの試行数を減らす(段階3以降で使う)
//   &rest=3              休憩の待ち時間(秒)を変える(config.js の REST_MIN_SECONDS は変えない)
//
// テストモード(URL の末尾に ?test=1 を付けたとき。SPEC.md 8章)
//   参加者とまったく同じ動きにする(警告・PC チェック・参加済みチェック・ランダムな順番。札は出さない)
//   ただし、データに isTest = true を付け、カウンターは進めない(ID は TEST-日時)
//   使える指定は &pattern= だけ(指定がなければパターン1)
//   ?dev=1 と ?test=1 を両方付けたときは、開発者モードになる

const urlParams = new URLSearchParams(location.search);

const DEV = {
  isDev: urlParams.get("dev") === "1",
  isTest: urlParams.get("test") === "1" && urlParams.get("dev") !== "1",
  start: urlParams.get("start"),            // 指定がなければ null
  pattern: parsePattern(urlParams.get("pattern")),
  n: Number(urlParams.get("n")) || null,
  rest: parseRestSeconds(urlParams.get("rest"))
};

// &pattern= の値を 1〜4 の数にする。それ以外なら null(指定なし扱い)
function parsePattern(value) {
  if (value === null) return null;
  const pattern = Number(value);
  if (![1, 2, 3, 4].includes(pattern)) {
    console.error("&pattern= の値が正しくありません(1〜4 にしてください):", value);
    return null;
  }
  return pattern;
}

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

// 開発者モードでないときは、ほかの指定はすべて無視する(テストモードでは &pattern= だけ使える)
if (!DEV.isDev) {
  DEV.start = null;
  DEV.n = null;
  DEV.rest = null;
  if (!DEV.isTest) DEV.pattern = null;
}

// 参加済み・完了の記録を保存するキー
// 開発者モードでは開発者専用、テストモードではテスト専用のキーに保存する(本物の参加済みの記録と分けるため)
const STORAGE_KEY_SUFFIX = DEV.isDev ? "_dev" : DEV.isTest ? "_test" : "";
const PARTICIPATED_STORAGE_KEY = PARTICIPATED_KEY + STORAGE_KEY_SUFFIX;
const COMPLETED_STORAGE_KEY = COMPLETED_KEY + STORAGE_KEY_SUFFIX;

// 画面の右下に「開発者モード」の札を出す
// (今どの画面にいるかと、参加済みの記録を消すボタン)
function setupDevPanel() {
  if (!DEV.isDev) return;

  const panel = document.createElement("div");
  panel.id = "dev-panel";
  panel.innerHTML = `
    <div><strong>開発者モード</strong></div>
    <div>画面: <span id="dev-screen-name">-</span></div>
    <div>ID: <span id="dev-participant">-</span></div>
    <div>パターン: <span id="dev-pattern">-</span></div>
    <div>抽選: <span id="dev-draw">-</span></div>
    <div>いまの試行: <span id="dev-trial">-</span></div>
    <div>送信待ち: <span id="dev-queue">0</span> 件</div>
    <button id="dev-clear-button">参加済みの記録を消す</button>
  `;
  document.body.appendChild(panel);

  document.getElementById("dev-clear-button").addEventListener("click", () => {
    // 本物・テストモード・開発者モードの記録をすべて消す
    ["", "_test", "_dev"].forEach(suffix => {
      localStorage.removeItem(PARTICIPATED_KEY + suffix);
      localStorage.removeItem(COMPLETED_KEY + suffix);
    });
    alert("参加済みの記録(本物・テストモード・開発者モード)をすべて消しました。");
  });

  console.log("開発者モードの設定:", DEV);
}

// 札の「画面:」の表示を更新する(画面が切り替わるたびに screens.js から呼ばれる)
function updateDevPanel(screenName) {
  const span = document.getElementById("dev-screen-name");
  if (span) span.textContent = screenName;
}

// 札の「ID:」「パターン:」を更新する(main.js から、ID や割り付けが決まったときに呼ばれる)
function updateDevState(participantId, patternText) {
  const idSpan = document.getElementById("dev-participant");
  const patternSpan = document.getElementById("dev-pattern");
  if (idSpan) idSpan.textContent = participantId || "-";
  if (patternSpan) patternSpan.textContent = patternText || "-";
}

// 札の「送信待ち:」の件数を更新する(save.js から、送信待ちリストが変わるたびに呼ばれる)
function updateDevQueue(count) {
  const span = document.getElementById("dev-queue");
  if (span) span.textContent = count;
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
