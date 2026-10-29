// 仕分け画面(練習・共通課題・本番で共通)
//
// 使い方:
//   runTask({
//     container:    仕分け画面を入れる場所(index.html の .task-container)
//     emails:       使うメールの一覧(EMAILS.P など)
//     shuffle:      true なら表示順をランダムにする(本番の A・B だけ true)
//     showFeedback: true なら確定後に「正解/不正解」を表示する(練習だけ true)
//     dialogMode:   確認画面の出し方("none" / "practice" / "low" / "high"。js/dialog.js を参照)
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

  // ブロック開始前に、確認画面を出す試行を決めて固定する
  const draw = drawDialogTrials(order, options.dialogMode);

  buildTaskArea(container);
  const mailCard = container.querySelector(".mail-card");
  const feedback = container.querySelector(".task-feedback");

  const results = [];   // 試行ごとの結果(段階6で記録の項目を増やす)
  let index = 0;        // いま何通目か(0から数える)
  let locked = true;    // true のあいだはフォルダボタンを押しても反応しない(空白中・確認画面中など)
  let trial = null;     // いまの試行の記録(フォルダを選ぶたびに書き足す)

  console.log("表示順:", order.map(mail => mail.id));
  console.log("確認画面を出す試行:", Array.from(draw.ids), "(ひっかけ", draw.trapCount, "/ 通常", draw.normalCount, ")");
  updateDevDraw(order, draw);

  // index 通目のメールを表示する。全部終わっていたら onFinish を呼ぶ
  function showEmail() {
    if (index >= order.length) {
      updateDevTrial(null);
      options.onFinish(results);
      return;
    }
    const mail = order[index];
    container.querySelector(".mail-sender").textContent = mail.sender;
    container.querySelector(".mail-subject").textContent = mail.subject;
    container.querySelector(".mail-body").textContent = mail.body;
    feedback.textContent = "";
    mailCard.style.visibility = "visible";

    trial = {
      trialNumber: index + 1,
      emailId: mail.id,
      correctFolder: mail.correctFolder,
      firstFolder: null,          // 最初に選んだフォルダ
      dialogShown: false,         // 確認画面を出したか
      dialogResponse: null,       // 確認画面での応答("実行" / "戻る"。出さなければ null)
      sameFolderAfterBack: null,  // 戻ったあと同じフォルダを選んだか(戻らなければ null)
      finalFolder: null           // 最終的に確定したフォルダ
    };
    updateDevTrial(mail, draw.ids.has(mail.id));
    locked = false;
  }

  // フォルダボタンが押されたとき
  function onFolderClick(folder) {
    const mail = order[index];

    if (trial.firstFolder === null) {
      // 1回目の選択
      trial.firstFolder = folder;
      if (draw.ids.has(mail.id)) {
        trial.dialogShown = true;
        openConfirmDialog(folder, container.querySelector(".folder-buttons"),
          () => { trial.dialogResponse = "実行"; decide(folder); },
          () => { trial.dialogResponse = "戻る"; locked = false; } // 選び直しを待つ
        );
        return;
      }
      decide(folder);
    } else {
      // 「戻る」のあとの選び直し:確認画面を出さず、そのまま確定する
      trial.sameFolderAfterBack = folder === trial.firstFolder;
      decide(folder);
    }
  }

  // フォルダを確定したとき
  function decide(folder) {
    const mail = order[index];
    const isCorrect = folder === mail.correctFolder;
    trial.finalFolder = folder;
    trial.isFirstCorrect = trial.firstFolder === mail.correctFolder;
    trial.isFinalCorrect = isCorrect;
    results.push(trial);

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
      onFolderClick(button.dataset.folder);
    });
  });

  showEmail();
}
