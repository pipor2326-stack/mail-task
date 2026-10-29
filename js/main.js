// 実験全体の流れ(SPEC.md 5章)
// 段階2では、各画面をボタンで順に進めるだけ。中身は後の段階で入れる

// 画面を切り替え、その画面を開いたときにする準備を行う
function goTo(name) {
  showScreen(name);

  if (name === "rest") {
    startRestTimer();
  }

  // 仕分け画面:画面を開いたら課題を始め、終わったら次の画面へ
  // 〔仮〕段階5で、ブロック1・2のセットと条件を割り付けパターンから決める。いまはブロック1=A、ブロック2=B
  if (name === "practice") startTask(EMAILS.P, false, true);
  if (name === "common") startTask(EMAILS.C, false, false);
  if (name === "block1") startTask(EMAILS.A, true, false);
  if (name === "block2") startTask(EMAILS.B, true, false);
}

// いまの画面で仕分け課題を始める
// shuffle:表示順をランダムにするか、showFeedback:正誤を表示するか
function startTask(emails, shuffle, showFeedback) {
  runTask({
    container: document.querySelector("#screen-" + currentScreen + " .task-container"),
    emails: emails,
    shuffle: shuffle,
    showFeedback: showFeedback,
    onFinish: results => {
      console.log("課題の結果:", results); // 段階6で、ここから記録・送信する
      goNext();
    }
  });
}

// いまの画面の次の画面へ進む
function goNext() {
  const next = getNextScreen(currentScreen);
  if (next) goTo(next);
}

// ===== 同意画面 =====

const consentCheckbox = document.getElementById("consent-checkbox");
const consentButton = document.getElementById("consent-button");

// チェックを入れたときだけボタンが押せる
consentCheckbox.addEventListener("change", () => {
  consentButton.disabled = !consentCheckbox.checked;
});

consentButton.addEventListener("click", () => {
  localStorage.setItem(PARTICIPATED_KEY, "true"); // 参加済みの印は同意した時点で付ける
  goNext();
});

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

if (DEV.start) {
  // 開発者モードで &start= が指定されたら、その画面から始める
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
