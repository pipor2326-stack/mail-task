// 実験全体の流れ(SPEC.md 5章)

// この参加者について決まったこと(段階6で、記録・送信する内容に加える)
const state = {
  participantId: null,   // 参加者ID(P001 など。開発者モードでは DEV-日時、取得失敗なら R-日時-乱数)
  idFetchFailed: false,  // ID の取得に3回失敗したか
  pattern: null,         // 割り付けパターン(1〜4)
  assignFailed: false    // サーバー割り付けに3回失敗したか
};

// 画面を切り替え、その画面を開いたときにする準備を行う
function goTo(name) {
  showScreen(name);

  if (name === "rest") {
    startRestTimer();
  }

  if (name === "assign") {
    startAssign();
  }

  // 仕分け画面:画面を開いたら課題を始め、終わったら次の画面へ
  // 練習と共通課題は全員同じ順番、本番は割り付けパターンで決まったセットと条件で、ランダムな順番
  if (name === "practice") startTask(EMAILS.P, false, true, "practice");
  if (name === "common") startTask(EMAILS.C, false, false, "none");
  if (name === "block1") startBlock(1);
  if (name === "block2") startBlock(2);
}

// いまの画面の次の画面へ進む
function goNext() {
  const next = getNextScreen(currentScreen);
  if (next) goTo(next);
}

// ===== 仕分け課題 =====

// いまの画面で仕分け課題を始める
// shuffle:表示順をランダムにするか、showFeedback:正誤を表示するか、dialogMode:確認画面の出し方
function startTask(emails, shuffle, showFeedback, dialogMode) {
  runTask({
    container: document.querySelector("#screen-" + currentScreen + " .task-container"),
    emails: emails,
    shuffle: shuffle,
    showFeedback: showFeedback,
    dialogMode: dialogMode,
    onFinish: results => {
      console.log("課題の結果:", results); // 段階6で、ここから記録・送信する
      goNext();
    }
  });
}

// 本番のブロック(1 または 2)を、割り付けパターンに従って始める
function startBlock(blockNumber) {
  const plan = PATTERNS[state.pattern][blockNumber - 1];
  console.log(`ブロック${blockNumber}:セット${plan.set}・${plan.condition === "low" ? "低頻度" : "高頻度"}`);
  startTask(EMAILS[plan.set], true, false, plan.condition);
}

// パターンを「パターン3:高A → 低B」のような文にする(開発者モードの札と Console 用)
function describePattern(pattern) {
  const label = block => (block.condition === "low" ? "低" : "高") + block.set;
  return `パターン${pattern}:${label(PATTERNS[pattern][0])} → ${label(PATTERNS[pattern][1])}`;
}

// 開発者モードの札の ID・パターンを、いまの state に合わせる
function refreshDevState() {
  updateDevState(state.participantId, state.pattern ? describePattern(state.pattern) : null);
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

  // 開発者モード:カウンターを進めない
  if (DEV.isDev) {
    state.participantId = "DEV-" + formatDateTime(new Date());
    refreshDevState();
    goNext();
    return;
  }

  requestWithRetry("getId", document.getElementById("consent-status"),
    result => {
      state.participantId = result.participantId;
      console.log("参加者ID:", state.participantId);
      goNext();
    },
    () => {
      // 3回失敗:ブラウザ側で仮 ID を作って先へ進む
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
      state.participantId = "R-" + formatDateTime(new Date()) + "-" + random;
      state.idFetchFailed = true;
      console.warn("ID 取得失敗。仮 ID:", state.participantId);
      goNext();
    }
  );
});

// ===== 割り付け(準備中の画面) =====

function startAssign() {
  // 開発者モード:カウンターを進めず、&pattern= のパターンにする(指定がなければ 1)
  if (DEV.isDev) {
    state.pattern = DEV.pattern || 1;
    console.log("開発者モードの割り付け:", describePattern(state.pattern));
    refreshDevState();
    goNext();
    return;
  }

  requestWithRetry("getPattern", document.getElementById("assign-status"),
    result => {
      state.pattern = result.pattern;
      console.log("割り付け:", describePattern(state.pattern));
      goNext();
    },
    () => {
      // 3回失敗:ブラウザ側でランダムに決めて先へ進む
      state.pattern = Math.floor(Math.random() * 4) + 1;
      state.assignFailed = true;
      console.warn("サーバー割り付け失敗。ブラウザ側で決めたパターン:", state.pattern);
      goNext();
    }
  );
}

// ===== 「次へ」系のボタン(押したら次の画面へ進むだけのもの) =====

document.querySelectorAll(".next-button").forEach(button => {
  button.addEventListener("click", goNext);
});

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

if (DEV.start) {
  // 開発者モードで &start= が指定されたら、その画面から始める
  // 途中から始めても動くよう、ID とパターンを先に決めておく
  state.participantId = "DEV-" + formatDateTime(new Date());
  state.pattern = DEV.pattern || 1;
  refreshDevState();

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
