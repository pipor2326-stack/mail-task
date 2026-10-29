// ログの記録(SPEC.md 7章)
//
// - record:参加者ごとの記録。participants シートの1行になる
// - makeTrialRows():仕分け課題の結果を、trials シートの行の形にする
// - タブを離れた回数と時間を数える
//
// シートの見出し(列名)は、ここで付けた名前(participantId など)がそのまま使われる

// ===== タブを離れた記録 =====

const tabStats = {
  count: 0,          // 離れた回数
  totalMs: 0,        // 離れていた合計時間(ミリ秒。いま離れている分は含まない)
  hiddenSince: null  // いま離れているなら、離れた時刻(performance.now())
};

// ページが見えなくなった・また見えるようになった、という合図を受け取る
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    tabStats.count++;
    tabStats.hiddenSince = performance.now();
  } else if (tabStats.hiddenSince !== null) {
    tabStats.totalMs += performance.now() - tabStats.hiddenSince;
    tabStats.hiddenSince = null;
  }
});

// いままでに離れた回数と合計時間を返す(いま離れている分も含める)
function getTabStats() {
  const ongoing = tabStats.hiddenSince !== null ? performance.now() - tabStats.hiddenSince : 0;
  return { count: tabStats.count, ms: tabStats.totalMs + ongoing };
}

// ===== 参加者ごとの記録(participants シート) =====

const record = {
  participantId: null,     // 参加者ID(P001 など。開発者モードでは DEV-日時、取得失敗なら R-日時-乱数)
  isDev: DEV.isDev,        // 開発者モードか(テストのデータを分析から除くため)
  completed: false,        // 最後まで終えたか
  lastScreen: null,        // 最後にいた画面(途中で閉じた人が、どこでやめたかが分かる)
  pattern: null,           // 割り付けパターン(1〜4)
  blockOrder: null,        // ブロック順(例:「高A→低B」)
  idFetchFailed: false,    // ID の取得に失敗したか
  assignFailed: false,     // サーバー割り付けに失敗したか

  // 開始・終了の時刻(Date.now() の実際の日時と、performance.now() のページを開いてからの経過時間)
  startTime: null,         // 日本時間。例:「2026-10-29T22:30:12+09:00」
  startTimeMs: null,       // Date.now()
  startPerf: null,         // performance.now()
  endTime: null,
  endTimeMs: null,
  endPerf: null,

  // 端末の情報
  browser: null,
  browserVersion: null,
  os: null,
  screenSize: null,        // 画面の大きさ(例:「1920x1080」)
  windowSize: null,        // ブラウザの表示部分の大きさ
  userAgent: navigator.userAgent,

  // 各フェーズの成績(正答数は「最終的に確定したフォルダ」が正しかった数)
  practiceCorrect: null,
  practiceTimeMs: null,
  commonCorrect: null,
  commonTimeMs: null,
  block1Set: null,
  block1Condition: null,
  block1TimeMs: null,      // 総作業時間:最初のメールを表示してから、最後のメールを確定するまで
  block1Correct: null,
  block1DialogDrawn: null, // 確認画面を出すと抽選した試行の数
  block1DialogTrap: null,  //   そのうち、ひっかけ
  block1DialogNormal: null,//   そのうち、通常
  block2Set: null,
  block2Condition: null,
  block2TimeMs: null,
  block2Correct: null,
  block2DialogDrawn: null,
  block2DialogTrap: null,
  block2DialogNormal: null,

  // 〔段階7〕事前質問・主観評価・全体の質問の回答は、ここに足す

  // 実験全体でタブを離れた回数と合計時間
  tabLeaveCount: 0,
  tabLeaveMs: 0,

  updateSeq: 0             // 何回目の送信か(GAS が古い内容で上書きしないために使う)
};

// 日時を、日本時間の「2026-10-29T22:30:12+09:00」の形にする
// 参加者のパソコンの時間帯の設定に関係なく、いつも日本時間にする
function formatJapanTime(date) {
  const two = n => String(n).padStart(2, "0");
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000); // 世界標準時に9時間足すと日本時間
  return `${jst.getUTCFullYear()}-${two(jst.getUTCMonth() + 1)}-${two(jst.getUTCDate())}` +
    `T${two(jst.getUTCHours())}:${two(jst.getUTCMinutes())}:${two(jst.getUTCSeconds())}+09:00`;
}

// 開始の時刻と端末の情報を記録する(同意したときに1回だけ呼ぶ)
function recordStart() {
  const now = new Date();
  record.startTime = formatJapanTime(now);
  record.startTimeMs = now.getTime();
  record.startPerf = performance.now();

  const browser = detectBrowser(navigator.userAgent);
  record.browser = browser.name;
  record.browserVersion = browser.version;
  record.os = detectOS(navigator.userAgent);
  record.screenSize = `${screen.width}x${screen.height}`;
  record.windowSize = `${window.innerWidth}x${window.innerHeight}`;
}

// 終了の時刻を記録し、完了にする(全体の質問に答えたときに呼ぶ)
function recordEnd() {
  const now = new Date();
  record.endTime = formatJapanTime(now);
  record.endTimeMs = now.getTime();
  record.endPerf = performance.now();
  record.completed = true;
  record.lastScreen = "end"; // このあと終了画面へ進むので、最後まで終えた人は「end」にする
}

// participants シートに送る1行を作る(送るたびに updateSeq を1つ進める)
function makeParticipantRow() {
  const tab = getTabStats();
  record.tabLeaveCount = tab.count;
  record.tabLeaveMs = Math.round(tab.ms);
  record.updateSeq++;
  return Object.assign({}, record); // 送ったあとに record が変わっても影響しないよう、写しを作る
}

// ブラウザ名とバージョンを、userAgent(ブラウザが名乗る文字列)から読み取る
// 順番が大事:Edge や Opera も「Chrome」を名乗るので、先に調べる
function detectBrowser(ua) {
  const rules = [
    ["Edge", /Edg\/([\d.]+)/],
    ["Opera", /OPR\/([\d.]+)/],
    ["Firefox", /Firefox\/([\d.]+)/],
    ["Chrome", /Chrome\/([\d.]+)/],
    ["Safari", /Version\/([\d.]+).*Safari/]
  ];
  for (const [name, pattern] of rules) {
    const match = ua.match(pattern);
    if (match) return { name: name, version: match[1] };
  }
  return { name: "不明", version: "" };
}

// OS を userAgent から読み取る
function detectOS(ua) {
  if (/Windows/.test(ua)) return "Windows";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Mac OS X/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Linux/.test(ua)) return "Linux";
  return "不明";
}

// ===== 試行ごとの記録(trials シート) =====

// 仕分け課題の結果を、trials シートの行の一覧にする
//   results: task.js が返した試行の一覧
//   info:    { phase: "練習"/"共通課題"/"本番", blockNumber: 1/2(本番以外は ""), condition: "低"/"高"/"なし", set: "A" など }
function makeTrialRows(results, info) {
  return results.map(trial => Object.assign({
    participantId: record.participantId,
    pattern: record.pattern,
    phase: info.phase,
    blockNumber: info.blockNumber,
    condition: info.condition,
    set: info.set,
    isDev: record.isDev
  }, trial));
}

// 仕分け課題の結果から、正答数と総作業時間を求める
function summarizeTask(results, summary) {
  return {
    correct: results.filter(trial => trial.isFinalCorrect).length,
    timeMs: Math.round(summary.endAt - summary.startAt)
  };
}
