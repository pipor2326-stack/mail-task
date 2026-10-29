// 画面の切り替え
//
// index.html の <section class="screen" id="screen-〇〇"> が1つの画面。
// showScreen("〇〇") で、その画面だけを表示し、ほかは隠す。

// 実験の画面の順番(SPEC.md 5章)
// pccheck と already は、条件に当てはまったときだけ出す特別な画面なので、順番には入れない
const SCREEN_ORDER = [
  "consent",        // 同意
  "prequestions",   // 事前質問
  "instructions",   // 課題の共通説明
  "practice",       // 練習(セットP)
  "commonintro",    // 共通課題の説明
  "common",         // 事前の共通課題(セットC)
  "assign",         // 割り付け(サーバーと通信)
  "block1intro",    // ブロック1の説明
  "block1",         // ブロック1
  "rating1",        // ブロック1後の主観評価
  "rest",           // 休憩
  "block2intro",    // ブロック2の説明
  "block2",         // ブロック2
  "rating2",        // ブロック2後の主観評価
  "postquestions",  // 全体についての質問
  "end"             // 終了画面
];

// いま表示している画面の名前
let currentScreen = null;

// 指定した画面だけを表示する
function showScreen(name) {
  const target = document.getElementById("screen-" + name);
  if (!target) {
    console.error("画面が見つかりません:", name);
    return;
  }

  document.querySelectorAll(".screen").forEach(screen => {
    screen.style.display = "none";
  });
  target.style.display = "block";
  window.scrollTo(0, 0); // 新しい画面は一番上から見せる

  currentScreen = name;
  updateDevPanel(name);
}

// SCREEN_ORDER で、いまの画面の次にある画面の名前を返す(最後なら null)
function getNextScreen(name) {
  const index = SCREEN_ORDER.indexOf(name);
  if (index === -1 || index === SCREEN_ORDER.length - 1) return null;
  return SCREEN_ORDER[index + 1];
}

// "consent.title" のような名前から、TEXTS の中の文言を取り出す
function getText(key) {
  let value = TEXTS;
  for (const part of key.split(".")) {
    if (value === undefined) break;
    value = value[part];
  }
  if (typeof value !== "string") {
    console.error("texts.js に文言がありません:", key);
    return "";
  }
  return value;
}

// index.html の data-text="〇〇" が付いた場所すべてに、texts.js の文言を入れる
function applyTexts() {
  document.querySelectorAll("[data-text]").forEach(element => {
    element.innerHTML = getText(element.dataset.text);
  });
}
