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

// ===== 質問の画面(事前質問・主観評価・全体の質問) =====

// 質問の一覧(data/questions.js)を、container の中に並べる
//   group: 記録の列名の頭に付ける名前("pre" / "rating1" / "rating2" / "post")
function renderQuestions(container, questions, group) {
  const items = questions.map((question, i) => {
    const name = group + "_" + question.id; // 記録の列名にもなる
    let input = "";

    if (question.type === "choice") {
      input = `<div class="choice-list">` + question.options.map(option =>
        `<label class="choice"><input type="radio" name="${name}" value="${option}"> ${option}</label>`
      ).join("") + `</div>`;
    } else if (question.type === "scale") {
      const points = [];
      for (let n = question.min; n <= question.max; n++) {
        points.push(`<label class="scale-point"><input type="radio" name="${name}" value="${n}"><span>${n}</span></label>`);
      }
      input = `<div class="scale">
        <span class="scale-label">${question.minLabel}</span>
        <div class="scale-points">${points.join("")}</div>
        <span class="scale-label">${question.maxLabel}</span>
      </div>`;
    } else if (question.type === "text") {
      input = `<textarea name="${name}" rows="3"></textarea>`;
    }

    const optional = question.required === false ? `<span class="optional">${TEXTS.questions.optional}</span>` : "";
    return `<div class="question" data-name="${name}">
      <p class="question-text">${i + 1}. ${question.text}${optional}</p>
      ${input}
    </div>`;
  });

  container.innerHTML = items.join("") + `<p class="question-error"></p>`;

  // 答えたら、その質問の「未回答」の印を消す
  container.addEventListener("change", event => {
    const block = event.target.closest(".question");
    if (block) block.classList.remove("is-missing");
  });
}

// 回答を集める。未回答の必須の質問があれば、印を付けて false を返す
// すべて答えていれば、{ 列名: 回答 } を返す(scale は数、choice と text は文字)
function collectAnswers(container, questions, group) {
  const answers = {};
  const missing = [];

  questions.forEach(question => {
    const name = group + "_" + question.id;
    let value = null;
    if (question.type === "text") {
      value = container.querySelector(`textarea[name="${name}"]`).value.trim();
      if (value === "") value = null;
    } else {
      const checked = container.querySelector(`input[name="${name}"]:checked`);
      if (checked) value = question.type === "scale" ? Number(checked.value) : checked.value;
    }

    if (value === null && question.required !== false) missing.push(name);
    answers[name] = value;
  });

  // 未回答の質問に印を付け、いちばん上の未回答の質問が見えるところまでスクロールする
  container.querySelectorAll(".question").forEach(block => {
    block.classList.toggle("is-missing", missing.includes(block.dataset.name));
  });
  container.querySelector(".question-error").textContent = missing.length > 0 ? TEXTS.questions.unanswered : "";
  if (missing.length > 0) {
    container.querySelector(".question.is-missing").scrollIntoView({ block: "center" });
    return false;
  }
  return answers;
}

// index.html の data-text="〇〇" が付いた場所すべてに、texts.js の文言を入れる
function applyTexts() {
  document.querySelectorAll("[data-text]").forEach(element => {
    element.innerHTML = getText(element.dataset.text);
  });
}
