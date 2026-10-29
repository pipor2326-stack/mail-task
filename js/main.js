// 実験全体の流れ(SPEC.md 5章)
// 参加者について決まったことは、js/logger.js の record に記録する

// 画面を切り替え、その画面を開いたときにする準備を行う
function goTo(name) {
  showScreen(name);
  record.lastScreen = name;

  if (name === "rest") {
    startRestTimer();
  }

  if (name === "assign") {
    startAssign();
  }

  // 仕分け画面:画面を開いたら課題を始め、終わったら次の画面へ
  // 練習と共通課題は全員同じ順番、本番は割り付けパターンで決まったセットと条件で、ランダムな順番
  if (name === "practice") startPractice();
  if (name === "common") startCommon();
  if (name === "block1") startBlock(1);
  if (name === "block2") startBlock(2);

  if (name === "end") {
    startEnd();
  }
}

// いまの画面の次の画面へ進む
function goNext() {
  const next = getNextScreen(currentScreen);
  if (next) goTo(next);
}

// ===== 仕分け課題 =====

// いまの画面で仕分け課題を始める
// shuffle:表示順をランダムにするか、showFeedback:正誤を表示するか、dialogMode:確認画面の出し方
// onFinish:終わったときに呼ぶ関数(試行の結果と、まとめを渡す)
function startTask(emails, shuffle, showFeedback, dialogMode, onFinish) {
  runTask({
    container: document.querySelector("#screen-" + currentScreen + " .task-container"),
    emails: emails,
    shuffle: shuffle,
    showFeedback: showFeedback,
    dialogMode: dialogMode,
    onFinish: (results, summary) => {
      console.log("課題の結果:", results);
      onFinish(results, summary);
      goNext();
    }
  });
}

// 練習(セットP)
function startPractice() {
  startTask(EMAILS.P, false, true, "practice", (results, summary) => {
    const score = summarizeTask(results, summary);
    record.practiceCorrect = score.correct;
    record.practiceTimeMs = score.timeMs;
    sendPhase("practice", results, { phase: "練習", blockNumber: "", condition: "なし", set: "P" });
  });
}

// 事前の共通課題(セットC)
function startCommon() {
  startTask(EMAILS.C, false, false, "none", (results, summary) => {
    const score = summarizeTask(results, summary);
    record.commonCorrect = score.correct;
    record.commonTimeMs = score.timeMs;
    sendPhase("common", results, { phase: "共通課題", blockNumber: "", condition: "なし", set: "C" });
  });
}

// 本番のブロック(1 または 2)を、割り付けパターンに従って始める
function startBlock(blockNumber) {
  const plan = PATTERNS[record.pattern][blockNumber - 1];
  const conditionLabel = plan.condition === "low" ? "低" : "高";
  console.log(`ブロック${blockNumber}:セット${plan.set}・${conditionLabel}頻度`);

  startTask(EMAILS[plan.set], true, false, plan.condition, (results, summary) => {
    const score = summarizeTask(results, summary);
    const prefix = "block" + blockNumber; // record の block1〜 / block2〜 に入れる
    record[prefix + "Set"] = plan.set;
    record[prefix + "Condition"] = conditionLabel;
    record[prefix + "TimeMs"] = score.timeMs;
    record[prefix + "Correct"] = score.correct;
    record[prefix + "DialogDrawn"] = summary.draw.ids.size;
    record[prefix + "DialogTrap"] = summary.draw.trapCount;
    record[prefix + "DialogNormal"] = summary.draw.normalCount;
    sendPhase(prefix, results, { phase: "本番", blockNumber: blockNumber, condition: conditionLabel, set: plan.set });
  });
}

// フェーズの終わりに、試行の行と、参加者の行(その時点までの内容)を送る
//   phaseKey: "practice" / "common" / "block1" / "block2"
function sendPhase(phaseKey, results, info) {
  const rows = makeTrialRows(results, info);
  sendTrials(record.participantId + "-trials-" + phaseKey, rows);
  sendParticipant(makeParticipantRow());
  if (DEV.isDev) checkCorrectCount(phaseKey, rows);
}

// 【開発者モード】送った trials の正答数を、フェーズごとに覚えておく(終了画面でまとめて点検する)
const sentTrialCorrect = {};

// 【開発者モード】「trials の isFinalCorrect の合計」と「participants の正答数」が一致するかを点検する
function checkCorrectCount(phaseKey, rows) {
  const fromTrials = rows.filter(row => row.isFinalCorrect === true).length;
  const fromParticipant = record[phaseKey + "Correct"];
  sentTrialCorrect[phaseKey] = fromTrials;
  if (fromTrials === fromParticipant) {
    console.log(`正答数の点検(${phaseKey}):一致(${fromTrials})`);
  } else {
    console.error(`正答数の点検(${phaseKey}):一致しません。trials の isFinalCorrect の合計 = ${fromTrials}、participants の ${phaseKey}Correct = ${fromParticipant}`);
  }
}

// 【開発者モード】終了時に、全フェーズの正答数をまとめて点検する
function checkAllCorrectCounts() {
  ["practice", "common", "block1", "block2"].forEach(phaseKey => {
    if (!(phaseKey in sentTrialCorrect)) {
      console.warn(`正答数の点検(${phaseKey}):このフェーズの trials は送られていません(&start= で途中から始めた場合など)`);
      return;
    }
    const fromTrials = sentTrialCorrect[phaseKey];
    const fromParticipant = record[phaseKey + "Correct"];
    if (fromTrials !== fromParticipant) {
      console.error(`正答数の点検(終了時・${phaseKey}):一致しません。trials = ${fromTrials}、participants = ${fromParticipant}`);
    }
  });
  console.log("正答数の点検(終了時):", sentTrialCorrect, "participants:", {
    practice: record.practiceCorrect, common: record.commonCorrect, block1: record.block1Correct, block2: record.block2Correct
  });
}

// パターンを「パターン3:高A → 低B」のような文にする(開発者モードの札と Console 用)
function describePattern(pattern) {
  const label = block => (block.condition === "low" ? "低" : "高") + block.set;
  return `パターン${pattern}:${label(PATTERNS[pattern][0])} → ${label(PATTERNS[pattern][1])}`;
}

// 割り付けパターンが決まったときに、record に書く
function setPattern(pattern) {
  record.pattern = pattern;
  const label = block => (block.condition === "low" ? "低" : "高") + block.set;
  record.blockOrder = `${label(PATTERNS[pattern][0])}→${label(PATTERNS[pattern][1])}`;
  refreshDevState();
}

// 開発者モードの札の ID・パターンを、いまの record に合わせる
function refreshDevState() {
  updateDevState(record.participantId, record.pattern ? describePattern(record.pattern) : null);
}

// ===== サーバーとの通信 =====

// サーバーに頼みごとをし、失敗したら「もう一度試す」ボタンを出す
//   action:     "getId" / "getPattern"
//   statusArea: 「通信中」や「もう一度試す」を表示する場所
//   onSuccess:  成功したときに呼ぶ関数(サーバーの返事を渡す)
//   onGiveUp:   MAX_SERVER_TRIES 回失敗したときに呼ぶ関数
function requestWithRetry(action, statusArea, onSuccess, onGiveUp) {
  let failures = 0;

  const attempt = () => {
    statusArea.innerHTML = `<p>${TEXTS.server.connecting}</p>`;

    callServer(action)
      .then(result => {
        statusArea.innerHTML = "";
        onSuccess(result);
      })
      .catch(error => {
        failures++;
        console.error(`通信失敗(${action}、${failures}回目):`, error);

        if (failures >= MAX_SERVER_TRIES) {
          statusArea.innerHTML = "";
          onGiveUp();
          return;
        }
        statusArea.innerHTML = `
          <p class="server-error">${TEXTS.server.failed}</p>
          <button class="main-button">${TEXTS.server.retry}</button>
        `;
        statusArea.querySelector("button").addEventListener("click", attempt);
      });
  };

  attempt();
}

// いまの日時を "20261029-153012" のような文字にする(仮 ID・開発者 ID 用)
function formatDateTime(date) {
  const two = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}${two(date.getMonth() + 1)}${two(date.getDate())}-${two(date.getHours())}${two(date.getMinutes())}${two(date.getSeconds())}`;
}

// ===== 同意画面 =====

const consentCheckbox = document.getElementById("consent-checkbox");
const consentButton = document.getElementById("consent-button");

// チェックを入れたときだけボタンが押せる
consentCheckbox.addEventListener("change", () => {
  consentButton.disabled = !consentCheckbox.checked;
});

consentButton.addEventListener("click", () => {
  // 通信中に2回押されたり、チェックを外されたりしないようにする
  consentButton.disabled = true;
  consentCheckbox.disabled = true;
  localStorage.setItem(PARTICIPATED_KEY, "true"); // 参加済みの印は同意した時点で付ける
  recordStart();

  // ID が決まったら、参加者の行を「未完了」として送ってから次へ
  const afterId = () => {
    refreshDevState();
    sendParticipant(makeParticipantRow());
    goNext();
  };

  // 開発者モード:カウンターを進めない
  if (DEV.isDev) {
    record.participantId = "DEV-" + formatDateTime(new Date());
    afterId();
    return;
  }

  requestWithRetry("getId", document.getElementById("consent-status"),
    result => {
      record.participantId = result.participantId;
      console.log("参加者ID:", record.participantId);
      afterId();
    },
    () => {
      // 3回失敗:ブラウザ側で仮 ID を作って先へ進む
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
      record.participantId = "R-" + formatDateTime(new Date()) + "-" + random;
      record.idFetchFailed = true;
      console.warn("ID 取得失敗。仮 ID:", record.participantId);
      afterId();
    }
  );
});

// ===== 割り付け(準備中の画面) =====

function startAssign() {
  // パターンが決まったら、参加者の行を更新してから次へ
  const afterPattern = pattern => {
    setPattern(pattern);
    sendParticipant(makeParticipantRow());
    goNext();
  };

  // 開発者モード:カウンターを進めず、&pattern= のパターンにする(指定がなければ 1)
  if (DEV.isDev) {
    console.log("開発者モードの割り付け:", describePattern(DEV.pattern || 1));
    afterPattern(DEV.pattern || 1);
    return;
  }

  requestWithRetry("getPattern", document.getElementById("assign-status"),
    result => {
      console.log("割り付け:", describePattern(result.pattern));
      afterPattern(result.pattern);
    },
    () => {
      // 3回失敗:ブラウザ側でランダムに決めて先へ進む
      const pattern = Math.floor(Math.random() * 4) + 1;
      record.assignFailed = true;
      console.warn("サーバー割り付け失敗。ブラウザ側で決めたパターン:", pattern);
      afterPattern(pattern);
    }
  );
}

// ===== 「次へ」系のボタン(押したら次の画面へ進むだけのもの) =====

document.querySelectorAll(".next-button").forEach(button => {
  button.addEventListener("click", goNext);
});

// ===== 全体についての質問 =====

// 「回答を送信する」:完了として参加者の行を送り、終了画面へ
document.getElementById("postquestions-button").addEventListener("click", () => {
  recordEnd();
  sendParticipant(makeParticipantRow());
  if (DEV.isDev) checkAllCorrectCounts();
  goNext();
});

// ===== 終了画面 =====

// すべての送信が成功したことを確かめてから、「完了」の文言を出す
function startEnd() {
  const status = document.getElementById("end-status");
  const content = document.getElementById("end-content");
  content.style.display = "none";
  status.innerHTML = `<p>${TEXTS.save.sending}</p>`;

  onAllSent = () => {
    onAllSent = null;
    status.innerHTML = "";
    content.style.display = "block";
    console.log("すべての送信が成功しました");
  };

  flushQueue().then(allSent => {
    if (!allSent) {
      // 失敗:画面の上の「再送する」で送れたら、onAllSent で「完了」に切り替わる
      status.innerHTML = `<p class="server-error">${TEXTS.save.endFailed}</p>`;
    }
  });
}

// ===== 休憩画面 =====

let restTimerId = null;

// REST_MIN_SECONDS 秒たったら「次へ」ボタンを押せるようにする
// (開発者モードで &rest= が指定されていれば、その秒数にする)
function startRestTimer() {
  const restButton = document.getElementById("rest-button");
  const countdown = document.getElementById("rest-countdown");
  let remaining = DEV.rest !== null ? DEV.rest : REST_MIN_SECONDS;

  clearInterval(restTimerId); // 前のタイマーが残っていたら止める

  // 残り秒数を表示する。0になったらボタンを押せるようにする
  const update = () => {
    if (remaining <= 0) {
      clearInterval(restTimerId);
      countdown.textContent = "";
      restButton.disabled = false;
    } else {
      countdown.textContent = TEXTS.rest.countdown.replace("{秒}", remaining);
      restButton.disabled = true;
    }
  };
  update();

  // 1秒ごとに残り秒数を減らす
  restTimerId = setInterval(() => {
    remaining--;
    update();
  }, 1000);
}

document.getElementById("rest-button").addEventListener("click", goNext);

// ===== 参加済みの画面 =====

// 段階7で、完了した人と途中で終了した人とで文言を分ける。いまは完了の文言だけを出す
function showAlreadyScreen() {
  document.getElementById("already-title").innerHTML = TEXTS.already.doneTitle;
  document.getElementById("already-body").innerHTML = TEXTS.already.doneBody;
  showScreen("already");
}

// ===== 実験の開始 =====

applyTexts();
setupDevPanel();
if (DEV.isDev) checkLowRateCounts(); // 開発者モード:本番セットの抽選数を点検する

// 前回ページを閉じたときに送れていなかったデータが残っていれば、送る
if (!isQueueEmpty()) {
  console.log("前回の送信待ちが残っているので、送ります");
  flushQueue();
}
updateDevQueue(loadQueue().length);

if (DEV.start) {
  // 開発者モードで &start= が指定されたら、その画面から始める
  // 途中から始めても動くよう、ID とパターンを先に決めておく
  record.participantId = "DEV-" + formatDateTime(new Date());
  recordStart();
  setPattern(DEV.pattern || 1);

  if (DEV.start === "already") {
    showAlreadyScreen();
  } else if (document.getElementById("screen-" + DEV.start)) {
    goTo(DEV.start);
  } else {
    console.error("&start= の画面名が正しくありません:", DEV.start, "使える名前:", ["pccheck", "already"].concat(SCREEN_ORDER));
    goTo("consent");
  }
} else if (!DEV.isDev && localStorage.getItem(PARTICIPATED_KEY) === "true") {
  // 参加済みなら先へ進めない(開発者モードでは無視する)
  showAlreadyScreen();
} else {
  goTo("consent");
}
