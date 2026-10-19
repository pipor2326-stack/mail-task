// 条件をランダムに割り当てる（50%ずつの確率でAまたはB）
const condition = Math.random() < 0.5 ? "A" : "B";
console.log("割り当てられた条件:", condition);

// ログ用データ
const actionLog = [];
let startTime = null; // 「同意して始める」を押した時刻に記録する
let endTime = null;
let processedCount = 0; // 処理済みメール数（archive/trashが実際に実行された数）

const tbody = document.getElementById("mail-list");

emails.forEach((mail, index) => {
  const tr = document.createElement("tr");
  tr.id = `mail-${index}`;
  tr.innerHTML = `
    <td>${mail.sender}</td>
    <td>${mail.subject}</td>
    <td>${mail.date}</td>
    <td>
      <button class="archive-btn" onclick="handleAction(${index}, 'archive')">アーカイブ</button>
      <button class="trash-btn" onclick="handleAction(${index}, 'trash')">ゴミ箱</button>
    </td>
  `;
  tbody.appendChild(tr);
});

updateDebugLog(); // 初期状態も表示しておく

// PARTICIPATED_KEY は js/config.js で定義

// 同意画面の制御
const alreadyScreen = document.getElementById("already-screen");
const consentScreen = document.getElementById("consent-screen");
const taskScreen = document.getElementById("task-screen");
const completeScreen = document.getElementById("complete-screen");
const consentCheckbox = document.getElementById("consent-checkbox");
const consentButton = document.getElementById("consent-button");

if (localStorage.getItem(PARTICIPATED_KEY) === "true") {
  // すでに参加済みの場合は同意画面を隠し、専用の画面だけ表示する
  consentScreen.style.display = "none";
  alreadyScreen.style.display = "block";
} else {
  consentCheckbox.addEventListener("change", () => {
    consentButton.disabled = !consentCheckbox.checked;
  });

  consentButton.addEventListener("click", () => {
    startTime = Date.now(); // 同意して始めた時刻をstartTimeとして記録
    localStorage.setItem(PARTICIPATED_KEY, "true"); // 参加済みフラグを記録
    consentScreen.style.display = "none";
    taskScreen.style.display = "block";
    updateDebugLog();
  });
}

function handleAction(index, action) {
  const row = document.getElementById(`mail-${index}`);
  if (!row) return;

  const mail = emails[index];
  let dialogChoice = null; // 確認ダイアログで「はい」→true, 「いいえ」→false, 出なければnull

  // 条件Aのときだけ確認ダイアログを出す
  if (condition === "A") {
    const actionLabel = action === "archive" ? "アーカイブ" : "ゴミ箱に移動";
    const confirmed = window.confirm(`このメールを${actionLabel}しますか？`);
    dialogChoice = confirmed;
    if (!confirmed) {
      console.log(`メール${index}の${actionLabel}をキャンセルしました`);
      // キャンセルした場合もログに残す（isCorrectはnull扱い＝実行されていないため）
      actionLog.push({
        timestamp: Date.now(),
        mailIndex: index,
        subject: mail.subject,
        chosenAction: action,
        correctAction: mail.correctAction,
        isCorrect: null,
        condition: condition,
        dialogChoice: dialogChoice
      });
      updateDebugLog();
      return;
    }
  }

  if (action === "trash") {
    // ゴミ箱の場合は行自体を非表示にする
    row.style.display = "none";
  } else {
    row.classList.add("archived");
    row.querySelectorAll("button").forEach(btn => btn.disabled = true);
  }

  // ログを1件記録
  actionLog.push({
    timestamp: Date.now(),
    mailIndex: index,
    subject: mail.subject,
    chosenAction: action,
    correctAction: mail.correctAction,
    isCorrect: action === mail.correctAction,
    condition: condition,
    dialogChoice: dialogChoice
  });

  processedCount++;

  console.log(`メール${index}を${action === "archive" ? "アーカイブ" : "ゴミ箱に移動"}しました`);

  // 全メールを処理し終えたらendTimeを記録し、完了画面に切り替える
  if (processedCount === emails.length && endTime === null) {
    endTime = Date.now();
    const durationMs = endTime - startTime;
    console.log(`完了時間: ${durationMs} ms`);
    console.log("startTime:", startTime, "endTime:", endTime);

    taskScreen.style.display = "none";
    completeScreen.style.display = "block";
  }

  updateDebugLog();
}

// デバッグ用ログ表示を更新
function updateDebugLog() {
  const debugDiv = document.getElementById("debug-log");
  if (!debugDiv) return;

  const summary = {
    startTime: startTime,
    endTime: endTime,
    durationMs: endTime !== null ? endTime - startTime : null,
    processedCount: processedCount,
    totalMails: emails.length
  };

  debugDiv.textContent = JSON.stringify({ summary, actionLog }, null, 2);
}
