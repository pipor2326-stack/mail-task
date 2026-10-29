// 仕分け画面(練習・共通課題・本番で共通)
//
// 使い方:
//   runTask({
//     container:    仕分け画面を入れる場所(index.html の .task-container)
//     emails:       使うメールの一覧(EMAILS.P など)
//     shuffle:      true なら表示順をランダムにする(本番の A・B だけ true)
//     showFeedback: true なら確定後に「正解/不正解」を表示する(練習だけ true)
//     dialogMode:   確認画面の出し方("none" / "practice" / "low" / "high"。js/dialog.js を参照)
//     onFinish:     全部終わったときに呼ぶ関数。試行の結果の一覧と、まとめ(summary)を渡す
//   });
//
// 時刻はすべて performance.now()(ページを開いてからの経過ミリ秒)

// ミリ秒を小数第1位までにする(シートを見やすくするため)
function roundMs(ms) {
  return ms === null ? null : Math.round(ms * 10) / 10;
}

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
        <!-- 確認画面を出す場所(フォルダボタンの下。ふだんは空いている) -->
        <div class="dialog-slot"></div>
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

  const results = [];   // 試行ごとの結果
  let index = 0;        // いま何通目か(0から数える)
  let locked = true;    // true のあいだはフォルダボタンを押しても反応しない(空白中・確認画面中など)
  let trial = null;     // いまの試行の記録(フォルダを選ぶたびに書き足す)
  let tabAtStart = null; // 試行の始まりの時点で、タブを離れた回数と時間
  let dialogOpenAt = null; // 確認画面を出した時刻
  let backAt = null;       // 「戻る」を押した時刻
  let blockStartAt = null; // 最初のメールを表示した時刻(総作業時間の始まり)

  console.log("表示順:", order.map(mail => mail.id));
  console.log("確認画面を出す試行:", Array.from(draw.ids), "(ひっかけ", draw.trapCount, "/ 通常", draw.normalCount, ")");
  updateDevDraw(order, draw);

  // index 通目のメールを表示する。全部終わっていたら onFinish を呼ぶ
  function showEmail() {
    if (index >= order.length) {
      updateDevTrial(null);
      options.onFinish(results, {
        startAt: blockStartAt,
        endAt: results.length > 0 ? results[results.length - 1].decidedAt : blockStartAt,
        draw: draw
      });
      return;
    }
    const mail = order[index];
    container.querySelector(".mail-sender").textContent = mail.sender;
    container.querySelector(".mail-subject").textContent = mail.subject;
    container.querySelector(".mail-body").textContent = mail.body;
    feedback.textContent = "";
    mailCard.style.visibility = "visible";

    // この並び順が、trials シートの列の順番になる
    trial = {
      trialNumber: index + 1,     // 試行番号(表示順)
      emailId: mail.id,
      isTrap: mail.isTrap,
      trapType: mail.trapType,
      correctFolder: mail.correctFolder,
      firstFolder: null,          // 最初に選んだフォルダ
      finalFolder: null,          // 最終的に確定したフォルダ
      isFirstCorrect: null,       // 最初の選択が正しいか
      isFinalCorrect: null,       // 最終が正しいか
      dialogShown: false,         // 確認画面を出したか
      dialogResponse: null,       // 確認画面での応答("実行" / "戻る"。出さなければ null)
      dialogRT: null,             // 確認画面の応答時間(確認画面を出してから、実行/戻るを押すまで)
      sameFolderAfterBack: null,  // 戻ったあと同じフォルダを選んだか(戻らなければ null)
      reselectTime: null,         // 再選択にかかった時間(「戻る」を押してから、2回目のフォルダをクリックするまで)
      shownAt: null,              // メールを表示した時刻
      firstClickAt: null,         // 最初にフォルダをクリックした時刻
      decidedAt: null,            // 確定した時刻
      tabLeaveCount: 0,           // この試行中にタブを離れた回数
      tabLeaveMs: 0               // この試行中にタブを離れていた合計時間
    };
    trial.shownAt = roundMs(performance.now());
    if (blockStartAt === null) blockStartAt = trial.shownAt;
    tabAtStart = getTabStats();
    dialogOpenAt = null;
    backAt = null;

    updateDevTrial(mail, draw.ids.has(mail.id));
    locked = false;
  }

  // フォルダボタンが押されたとき
  function onFolderClick(folder, clickAt) {
    const mail = order[index];

    if (trial.firstFolder === null) {
      // 1回目の選択
      trial.firstFolder = folder;
      trial.firstClickAt = roundMs(clickAt);
      if (draw.ids.has(mail.id)) {
        trial.dialogShown = true;
        dialogOpenAt = performance.now();
        openConfirmDialog(folder, container.querySelector(".dialog-slot"),
          () => {
            const now = performance.now();
            trial.dialogResponse = "実行";
            trial.dialogRT = roundMs(now - dialogOpenAt);
            decide(folder, now);
          },
          () => {
            backAt = performance.now();
            trial.dialogResponse = "戻る";
            trial.dialogRT = roundMs(backAt - dialogOpenAt);
            locked = false; // 選び直しを待つ
          }
        );
        return;
      }
      decide(folder, clickAt);
    } else {
      // 「戻る」のあとの選び直し:確認画面を出さず、そのまま確定する
      trial.sameFolderAfterBack = folder === trial.firstFolder;
      trial.reselectTime = roundMs(clickAt - backAt);
      decide(folder, clickAt);
    }
  }

  // フォルダを確定したとき(decidedAt:確定した時刻)
  function decide(folder, decidedAt) {
    const mail = order[index];
    const isCorrect = folder === mail.correctFolder;
    trial.finalFolder = folder;
    trial.isFirstCorrect = trial.firstFolder === mail.correctFolder;
    trial.isFinalCorrect = isCorrect;
    trial.decidedAt = roundMs(decidedAt);

    // この試行中にタブを離れた回数と時間(試行の始まりとの差)
    const tabNow = getTabStats();
    trial.tabLeaveCount = tabNow.count - tabAtStart.count;
    trial.tabLeaveMs = Math.round(tabNow.ms - tabAtStart.ms);

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
      const clickAt = performance.now(); // クリックした時刻(先に測っておく)
      button.blur(); // 選択状態を外す(Enter や Space キーで次のメールまで押せてしまわないように)
      if (locked) return; // 確定した直後の連打などは無視する
      locked = true;
      onFolderClick(button.dataset.folder, clickAt);
    });
  });

  showEmail();
}
