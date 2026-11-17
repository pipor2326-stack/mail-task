// 仕分け画面(練習・共通課題・本番で共通)
//
// 使い方:
//   runTask({
//     container:    仕分け画面を入れる場所(index.html の .task-container)
//     emails:       使うメールの一覧(EMAILS.P など)
//     shuffle:      true なら表示順をランダムにする(本番の A・B だけ true)
//     showFeedback: true なら確定後に「正解/不正解」を表示する(練習だけ true)
//     dialogMode:   確認画面の出し方("none" / "practice" / "low" / "high"。js/dialog.js を参照)
//     timeLimitMs:  制限時間(ミリ秒。本番のブロックだけ。なければ制限なし)
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

// フォルダのアイコン(見た目だけ。振り分けや記録には使わない)
// ルールの見出しとフォルダボタンの両方に、同じ絵を同じ大きさ・同じ色で付ける(大きさと色は style.css の .folder-icon)
// 線の色は文字と同じ色(currentColor)になる。表にないフォルダ名のときは、アイコンなしで表示する
const FOLDER_ICONS = {
  // 本
  "授業": '<path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2z"/><path d="M22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z"/>',
  // かばん
  "就職活動": '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  // 書類
  "手続き": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  // フォルダ
  "その他": '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
};

// フォルダのアイコンの HTML を返す
function folderIcon(folder) {
  if (!FOLDER_ICONS[folder]) return "";
  return `<svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${FOLDER_ICONS[folder]}</svg>`;
}

// 「あなたの設定」→「重要」→「メールの振り分けルール」の HTML を作る
// 仕分け画面の左の欄と、ルールの確認画面(main.js)の両方で使う(文言とアイコンを同じにするため)
// 文言はすべて data/rules.js から入れる
function buildRulesHtml() {
  const profile = RULES.profile;
  return `
    <div class="profile-box">
      <div class="profile-head">
        <h2>${profile.title}</h2>
        <span class="profile-badge">${profile.badge}</span>
      </div>
      <p class="profile-label">${profile.universityLabel}</p>
      <ul class="profile-list"><li>${profile.university}</li></ul>
      <p class="profile-label">${profile.companiesLabel}</p>
      <ul class="profile-list">${profile.companies.map(company => `<li>${company}</li>`).join("")}</ul>
    </div>
    <div class="rule-important">
      <strong>${RULES.importantTitle}</strong>
      <p>${RULES.important}</p>
    </div>
    <div class="task-rules">
      <h2>${RULES.title}</h2>
      <p class="rule-lead">${RULES.lead}</p>
      <dl class="rule-list">
        ${RULES.items.map(item => `<dt>${folderIcon(item.folder)}<span>${item.folder}</span></dt><dd>${item.text}</dd>`).join("")}
      </dl>
    </div>
  `;
}

// 仕分け画面の部品を作る(あなたの設定・ルール・メール・正誤表示・フォルダボタン)
function buildTaskArea(container) {
  container.innerHTML = `
    <div class="task">
      <div class="task-side">${buildRulesHtml()}</div>
      <div class="task-main">
        <!-- 何通目かと残り時間(本番のブロックだけ表示。ほかの部分の位置を動かさないよう、メールの枠の右上に重ねて出す) -->
        <div class="task-timer"><span class="task-progress"></span><span class="task-remaining"></span></div>
        <div class="mail-card">
          <div class="mail-row"><span class="mail-label">差出人</span><span class="mail-sender"></span></div>
          <div class="mail-row"><span class="mail-label">件名</span><span class="mail-subject"></span></div>
          <div class="mail-body"></div>
        </div>
        <div class="task-feedback"></div>
        <div class="folder-buttons">
          ${FOLDERS.map(folder => `<button class="folder-button" data-folder="${folder}">${folderIcon(folder)}<span>${folder}</span></button>`).join("")}
        </div>
        <!-- 確認画面を出す場所(フォルダボタンの下。ふだんは空いている)
             練習で不正解のときは、ここに理由と「次へ」ボタンを出す(確定したあとなので、確認画面とは重ならない) -->
        <div class="dialog-slot">
          <div class="feedback-panel">
            <p class="feedback-reason"></p>
            <button class="main-button feedback-next">${TEXTS.task.next}</button>
          </div>
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
  const feedbackPanel = container.querySelector(".feedback-panel"); // 練習で不正解のときの、理由と「次へ」

  const results = [];   // 試行ごとの結果
  let index = 0;        // いま何通目か(0から数える)
  let locked = true;    // true のあいだはフォルダボタンを押しても反応しない(空白中・確認画面中など)
  let trial = null;     // いまの試行の記録(フォルダを選ぶたびに書き足す)
  let tabAtStart = null; // 試行の始まりの時点で、タブを離れた回数と時間
  let dialogOpenAt = null; // 確認画面を出した時刻
  let backAt = null;       // 「戻る」を押した時刻
  let blockStartAt = null; // 最初のメールを表示した時刻(総作業時間の始まり。制限時間もここから数える)
  let finished = false;    // true になったら、このブロックはもう何も受け付けない(全部終えた・時間切れ)
  let dialogShownCount = 0; // 実際に確認画面が出た回数(時間切れで確定しなかったメールの分も数える)

  // 制限時間(本番のブロックだけ。練習と共通課題は null で、制限なし)
  const timeLimitMs = options.timeLimitMs || null;
  const timerBox = container.querySelector(".task-remaining");     // 残り時間
  const progressBox = container.querySelector(".task-progress");   // 今何通目か
  let timerId = null;

  console.log("表示順:", order.map(mail => mail.id));
  console.log("確認画面を出す試行:", Array.from(draw.ids), "(ひっかけ", draw.trapCount, "/ 通常", draw.normalCount, ")");
  updateDevDraw(order, draw);
  updateDevTimer(timeLimitMs ? "開始前" : "なし");

  // 残り時間を表示し、時間になったら時間切れにする(最初のメールを表示してから、0.2秒ごとに呼ぶ)
  function updateTimer() {
    const remainingMs = timeLimitMs - (performance.now() - blockStartAt);
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
    timerBox.textContent = TEXTS.task.timeRemaining.replace("{秒}", remainingSec);
    updateDevTimer("残り " + remainingSec + "秒 / 時間切れ: なし");
    if (remainingMs <= 0) timeUp();
  }

  // 時間切れ:途中のメールは確定せず(試行の行を作らない)、「時間になりました」を見せてから終える
  function timeUp() {
    if (finished) return;
    finished = true;
    locked = true;
    clearInterval(timerId);
    closeConfirmDialog(); // 確認画面が出ていたら閉じる(「実行」「戻る」の処理は呼ばない)
    mailCard.style.visibility = "hidden";
    feedback.textContent = TEXTS.task.timeUp;
    feedback.className = "task-feedback is-timeup";
    updateDevTimer("残り 0秒 / 時間切れ: あり");
    updateDevTrial(null);
    setTimeout(() => {
      options.onFinish(results, {
        startAt: blockStartAt,
        endAt: blockStartAt + timeLimitMs, // 作業時間は制限時間と同じになる
        draw: draw,
        timedOut: true,
        dialogShownCount: dialogShownCount
      });
    }, TIME_UP_MESSAGE_MS);
  }

  // index 通目のメールを表示する。全部終わっていたら onFinish を呼ぶ
  function showEmail() {
    if (finished) return; // 時間切れのあとは、次のメールを出さない
    if (index >= order.length) {
      finished = true;
      clearInterval(timerId);
      if (timeLimitMs) updateDevTimer("全部振り分けた / 時間切れ: なし");
      updateDevTrial(null);
      options.onFinish(results, {
        startAt: blockStartAt,
        endAt: results.length > 0 ? results[results.length - 1].decidedAt : blockStartAt,
        draw: draw,
        timedOut: false,
        dialogShownCount: dialogShownCount
      });
      return;
    }
    const mail = order[index];
    container.querySelector(".mail-sender").textContent = mail.sender;
    container.querySelector(".mail-subject").textContent = mail.subject;
    container.querySelector(".mail-body").textContent = mail.body;
    feedback.textContent = "";
    mailCard.style.visibility = "visible";
    // 本番のブロックだけ:今何通目か(全部の通数は、このブロックのメールの数)
    if (timeLimitMs) {
      progressBox.textContent = TEXTS.task.progress.replace("{今}", index + 1).replace("{全部}", order.length);
    }

    // この並び順が、trials シートの列の順番になる
    trial = {
      trialNumber: index + 1,     // 試行番号(表示順)
      emailId: mail.id,
      isTrap: mail.isTrap,
      trapType: mail.trapType,
      trapGroup: mail.trapGroup,  // ひっかけのまとまり(not_mine / is_mine。通常は "")
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
    if (blockStartAt === null) {
      blockStartAt = trial.shownAt;
      // 本番のブロック:最初のメールを表示した時点から、制限時間を数え始める
      if (timeLimitMs) {
        updateTimer();
        timerId = setInterval(updateTimer, 200);
      }
    }
    tabAtStart = getTabStats();
    dialogOpenAt = null;
    backAt = null;

    updateDevTrial(mail, draw.ids.has(mail.id));
    locked = false;
  }

  // フォルダボタンが押されたとき
  function onFolderClick(folder, clickAt) {
    if (finished) return;
    const mail = order[index];

    if (trial.firstFolder === null) {
      // 1回目の選択
      trial.firstFolder = folder;
      trial.firstClickAt = roundMs(clickAt);
      if (draw.ids.has(mail.id)) {
        trial.dialogShown = true;
        dialogShownCount++;
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
    if (finished) return; // 時間切れのあとに届いた確定は数えない
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
      // 練習だけ:正誤を表示する
      feedback.textContent = isCorrect
        ? TEXTS.task.correct
        : TEXTS.task.incorrect.replace("{正解}", mail.correctFolder);
      feedback.className = "task-feedback " + (isCorrect ? "is-correct" : "is-incorrect");
      if (isCorrect) {
        // 正解:少し見せてから、自動で次へ
        setTimeout(blankThenNext, FEEDBACK_MS_CORRECT);
      } else {
        // 不正解:理由を出し、「次へ」が押されるまで待つ(フォルダボタンは押せないまま)
        feedbackPanel.querySelector(".feedback-reason").textContent = mail.feedbackReason || "";
        feedbackPanel.style.display = "block";
      }
    } else {
      blankThenNext();
    }
  }

  // 練習で不正解のときの「次へ」
  container.querySelector(".feedback-next").addEventListener("click", event => {
    event.currentTarget.blur();
    if (feedbackPanel.style.display !== "block") return; // 2度押しは無視する
    feedbackPanel.style.display = "none";
    blankThenNext();
  });

  // メールを消して BLANK_MS ミリ秒の空白をはさみ、次のメールを表示する
  function blankThenNext() {
    mailCard.style.visibility = "hidden";
    feedback.textContent = "";
    feedbackPanel.style.display = "none";
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
