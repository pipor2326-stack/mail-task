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

// 【開発者モード】メールのセット(data/emails.js)を点検し、結果を Console に出す(SPEC.md 3章)
//   赤字(console.error):通数・ひっかけ数・本番のフォルダごとの数が config.js と違う、
//                        正解フォルダが FOLDERS にない、ID や件名がセットをまたいで重なっている、
//                        isTrap と trapType が食い違っている、練習の showDialog が true/false でない
//   黄色(console.warn):A と B で、ひっかけの種類ごとの数が違う
function checkEmailSets() {
  const summary = {};
  const seenIds = {};
  const seenSubjects = {};

  Object.keys(SET_SIZES).forEach(set => {
    const emails = EMAILS[set] || [];
    const expected = SET_SIZES[set];
    const traps = emails.filter(mail => mail.isTrap);

    if (emails.length !== expected.total) {
      console.error(`セット${set}:通数が ${emails.length} 通です(config.js では ${expected.total} 通)`);
    }
    if (traps.length !== expected.trap) {
      console.error(`セット${set}:ひっかけが ${traps.length} 通です(config.js では ${expected.trap} 通)`);
    }

    // フォルダごとの数
    const perFolder = {};
    FOLDERS.forEach(folder => perFolder[folder] = 0);
    emails.forEach(mail => {
      if (!FOLDERS.includes(mail.correctFolder)) {
        console.error(`セット${set}・${mail.id}:正解フォルダ「${mail.correctFolder}」が FOLDERS にありません`);
      } else {
        perFolder[mail.correctFolder]++;
      }
    });
    if (set === "A" || set === "B") {
      FOLDERS.forEach(folder => {
        if (perFolder[folder] !== MAIN_PER_FOLDER) {
          console.error(`セット${set}:「${folder}」が ${perFolder[folder]} 通です(config.js では ${MAIN_PER_FOLDER} 通)`);
        }
      });
    }

    emails.forEach(mail => {
      // ID と件名は、セットをまたいで重ならないようにする
      if (seenIds[mail.id]) console.error(`ID「${mail.id}」が重なっています(セット${seenIds[mail.id]} とセット${set})`);
      seenIds[mail.id] = set;
      if (seenSubjects[mail.subject]) console.error(`件名「${mail.subject}」が重なっています(${seenSubjects[mail.subject]} と ${mail.id})`);
      seenSubjects[mail.subject] = mail.id;

      // ひっかけなら trapType があり、通常なら trapType は空
      if (mail.isTrap !== (mail.trapType !== "")) {
        console.error(`${mail.id}:isTrap(${mail.isTrap})と trapType(「${mail.trapType}」)が食い違っています`);
      }
      if (set === "P" && typeof mail.showDialog !== "boolean") {
        console.error(`${mail.id}:練習のメールに showDialog(true / false)がありません`);
      }
    });

    // ひっかけの種類ごとの数
    const perTrapType = {};
    traps.forEach(mail => perTrapType[mail.trapType] = (perTrapType[mail.trapType] || 0) + 1);

    summary[set] = Object.assign({ 通数: emails.length, ひっかけ: traps.length }, perFolder);
    if (set === "P") summary[set]["確認画面を出す"] = emails.filter(mail => mail.showDialog === true).length;
    summary[set].trapTypes = perTrapType;
  });

  // A と B で、ひっかけの種類ごとの数がそろっているか
  const typesA = JSON.stringify(sortKeys(summary.A.trapTypes));
  const typesB = JSON.stringify(sortKeys(summary.B.trapTypes));
  if (typesA !== typesB) {
    console.warn(`ひっかけの種類ごとの数が A と B で違います:A ${typesA}、B ${typesB}`);
  }

  // 結果を表にして見せる(trapTypes は表に入らないので、別に出す)
  const table = {};
  Object.keys(summary).forEach(set => {
    table[set] = Object.assign({}, summary[set]);
    table[set].trapTypes = JSON.stringify(summary[set].trapTypes);
  });
  console.log("メールのセットの点検:");
  console.table(table);
}

// オブジェクトのキーを名前順に並べ直す(比べるため)
function sortKeys(obj) {
  const sorted = {};
  Object.keys(obj).sort().forEach(key => sorted[key] = obj[key]);
  return sorted;
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
  // 表示順に並べる。ひっかけには種類を付ける(例:A19[sender_similar])
  const ids = order.filter(mail => draw.ids.has(mail.id))
    .map(mail => mail.isTrap ? `${mail.id}[${mail.trapType}]` : mail.id);
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
