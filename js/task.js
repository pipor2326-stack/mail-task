// 仕分け画面(練習・共通課題・本番で共通)
//
// 使い方:
//   runTask({
//     container:    仕分け画面を入れる場所(index.html の .task-container)
//     emails:       使うメールの一覧(EMAILS.P など)
//     shuffle:      true なら表示順をランダムにする(本番の A・B だけ true)
//     showFeedback: true なら確定後に「正解/不正解」を表示する(練習だけ true)
//     onFinish:     全部終わったときに呼ぶ関数。試行の結果の一覧を渡す
//   });

// 配列の順番をランダムに並べ替えた、新しい配列を返す(フィッシャー–イェーツのシャッフル)
function shuffleArray(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 仕分け画面の部品を作る(ルール・メール・正誤表示・フォルダボタン)
function buildTaskArea(container) {
  container.innerHTML = `
    <div class="task">
      <div class="task-rules">
        <h2>${RULES.title}</h2>
        <ul>${RULES.items.map(item => `<li>${item}</li>`).join("")}</ul>
      </div>
      <div class="task-main">
        <div class="mail-card">
          <div class="mail-row"><span class="mail-label">差出人</span><span class="mail-sender"></span></div>
          <div class="mail-row"><span class="mail-label">件名</span><span class="mail-subject"></span></div>
          <div class="mail-body"></div>
        </div>
        <div class="task-feedback"></div>
        <div class="folder-buttons">
          ${FOLDERS.map(folder => `<button class="folder-button" data-folder="${folder}">${folder}</button>`).join("")}
        </div>
      </div>
    </div>
  `;
}

function runTask(options) {
  const container = options.container;

  // 表示順を決める
  let order = options.shuffle ? shuffleArray(options.emails) : options.emails.slice();
  if (DEV.n) order = order.slice(0, DEV.n); // 開発者モードの &n= で試行数を減らす

  buildTaskArea(container);
  const mailCard = container.querySelector(".mail-card");
  const feedback = container.querySelector(".task-feedback");

  const results = [];   // 試行ごとの結果(段階6で記録の項目を増やす)
  let index = 0;        // いま何通目か(0から数える)
  let locked = true;    // true のあいだはフォルダボタンを押しても反応しない(空白中など)

  console.log("表示順:", order.map(mail => mail.id));

  // index 通目のメールを表示する。全部終わっていたら onFinish を呼ぶ
  function showEmail() {
    if (index >= order.length) {
      options.onFinish(results);
      return;
    }
    const mail = order[index];
    container.querySelector(".mail-sender").textContent = mail.sender;
    container.querySelector(".mail-subject").textContent = mail.subject;
    container.querySelector(".mail-body").textContent = mail.body;
    feedback.textContent = "";
    mailCard.style.visibility = "visible";
    locked = false;
  }

  // フォルダが選ばれ、確定したとき(段階4で、この前に確認画面が入る)
  function decide(folder) {
    const mail = order[index];
    const isCorrect = folder === mail.correctFolder;
    results.push({
      trialNumber: index + 1,
      emailId: mail.id,
      chosenFolder: folder,
      correctFolder: mail.correctFolder,
      isCorrect: isCorrect
    });

    if (options.showFeedback) {
      // 練習だけ:正誤を表示してから次へ
      feedback.textContent = isCorrect
        ? TEXTS.task.correct
        : TEXTS.task.incorrect.replace("{正解}", mail.correctFolder);
      feedback.className = "task-feedback " + (isCorrect ? "is-correct" : "is-incorrect");
      setTimeout(blankThenNext, isCorrect ? FEEDBACK_MS_CORRECT : FEEDBACK_MS_WRONG);
    } else {
      blankThenNext();
    }
  }

  // メールを消して BLANK_MS ミリ秒の空白をはさみ、次のメールを表示する
  function blankThenNext() {
    mailCard.style.visibility = "hidden";
    feedback.textContent = "";
    setTimeout(() => {
      index++;
      showEmail();
    }, BLANK_MS);
  }

  // フォルダボタンのクリック
  container.querySelectorAll(".folder-button").forEach(button => {
    button.addEventListener("click", () => {
      button.blur(); // 選択状態を外す(Enter や Space キーで次のメールまで押せてしまわないように)
      if (locked) return; // 確定した直後の連打などは無視する
      locked = true;
      decide(button.dataset.folder);
    });
  });

  showEmail();
}
