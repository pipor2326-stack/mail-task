// 確認画面と、確認画面を出す試行の抽選(SPEC.md 4章)

// ===== 抽選 =====

// どの試行で確認画面を出すかを、ブロック開始前に決める
//   order: 表示順に並んだメールの一覧
//   mode:  "none"     … 出さない(共通課題)
//          "practice" … メールの showDialog が true の試行で出す(練習。全員同じ)
//          "low"      … LOW_RATE の割合で抽選する(低頻度条件)
//          "high"     … HIGH_RATE の割合で抽選する(高頻度条件)
// 返す値:{ ids: 確認画面を出すメールIDの集まり, trapCount: ひっかけで出す数, normalCount: 通常で出す数 }
function drawDialogTrials(order, mode) {
  if (mode === "none") {
    return { ids: new Set(), trapCount: 0, normalCount: 0 };
  }

  if (mode === "practice") {
    const chosen = order.filter(mail => mail.showDialog === true);
    return {
      ids: new Set(chosen.map(mail => mail.id)),
      trapCount: chosen.filter(mail => mail.isTrap).length,
      normalCount: chosen.filter(mail => !mail.isTrap).length
    };
  }

  const rate = mode === "low" ? LOW_RATE : HIGH_RATE;

  // ひっかけは TRAP_GROUPS(config.js)のグループに分け、グループごとに「ちょうどの数」(四捨五入)をくじ引きで選ぶ
  // 通常のメールも、同じように「ちょうどの数」を選ぶ
  // shuffleArray は js/task.js にある(並べ替えた先頭から必要な数だけ取る=くじ引き)
  const traps = order.filter(mail => mail.isTrap);
  const normals = order.filter(mail => !mail.isTrap);

  let chosenTraps = [];
  splitTrapsByGroup(traps).forEach(members => {
    chosenTraps = chosenTraps.concat(shuffleArray(members).slice(0, Math.round(members.length * rate)));
  });
  const normalCount = Math.round(normals.length * rate);
  const chosen = chosenTraps.concat(shuffleArray(normals).slice(0, normalCount));

  return { ids: new Set(chosen.map(mail => mail.id)), trapCount: chosenTraps.length, normalCount: normalCount };
}

// ひっかけを TRAP_GROUPS のグループごとに分ける(グループの順に、メールの一覧の一覧を返す)
// どのグループにも入っていない trapType のひっかけは、最後に1つのグループとしてまとめる(設定漏れ。点検で赤字になる)
function splitTrapsByGroup(traps) {
  const groups = TRAP_GROUPS.map(group => traps.filter(mail => group.trapTypes.includes(mail.trapType)));
  const others = traps.filter(mail => !TRAP_GROUPS.some(group => group.trapTypes.includes(mail.trapType)));
  if (others.length > 0) groups.push(others);
  return groups;
}

// 【開発者モード】本番セット A・B の低頻度の抽選数を点検し、問題があれば Console に知らせる
//   赤字:ひっかけの trapType が、TRAP_GROUPS のどのグループにも入っていない
//   黄色:「グループのひっかけの数 × LOW_RATE」「通常の数 × LOW_RATE」が整数にならない(四捨五入で割合がずれる)
//         A と B で抽選される数が違う
function checkLowRateCounts() {
  // 小数の計算の誤差(0.30000000000000004 など)を無視するため、ごく小さい差は整数とみなす
  const isInteger = value => Math.abs(value - Math.round(value)) < 1e-9;
  const counts = {};

  ["A", "B"].forEach(set => {
    const traps = EMAILS[set].filter(mail => mail.isTrap);
    const normalTotal = EMAILS[set].length - traps.length;
    counts[set] = {};

    traps.forEach(mail => {
      if (!TRAP_GROUPS.some(group => group.trapTypes.includes(mail.trapType))) {
        console.error(`${mail.id}:trapType「${mail.trapType}」が、config.js の TRAP_GROUPS のどのグループにも入っていません`);
      }
    });

    TRAP_GROUPS.forEach(group => {
      const total = traps.filter(mail => group.trapTypes.includes(mail.trapType)).length;
      const exact = total * LOW_RATE;
      if (!isInteger(exact)) {
        console.warn(`セット${set}:ひっかけ「${group.name}」${total}通 × ${LOW_RATE} = ${exact} が整数になりません(四捨五入で ${Math.round(exact)} 通を抽選します)`);
      }
      counts[set][group.name] = Math.round(exact);
    });

    const normalExact = normalTotal * LOW_RATE;
    if (!isInteger(normalExact)) {
      console.warn(`セット${set}:通常${normalTotal}通 × ${LOW_RATE} = ${normalExact} が整数になりません(四捨五入で ${Math.round(normalExact)} 通を抽選します)`);
    }
    counts[set].通常 = Math.round(normalExact);
  });

  if (JSON.stringify(counts.A) !== JSON.stringify(counts.B)) {
    console.warn("低頻度で抽選される数が A と B で違います:", counts);
  }
  console.log("低頻度の抽選数:", counts);
}

// ===== 確認画面 =====

const dialogOverlay = document.getElementById("confirm-dialog");
const dialogBox = dialogOverlay.querySelector(".dialog-box");
const dialogMessage = document.getElementById("confirm-message");
const dialogExecuteButton = document.getElementById("confirm-execute");
const dialogBackButton = document.getElementById("confirm-back");

// 確認画面が開いているあいだに押されたときに呼ぶ関数(開くたびに入れ替える)
let dialogOnExecute = null;
let dialogOnBack = null;

// 確認画面を開いた時刻(performance.now())。開いた直後のクリックを無視するために使う
let dialogOpenedAt = 0;

// 確認画面を開く
//   folder:    選んだフォルダ名
//   anchor:    確認画面を出す場所(フォルダボタンの下の空き場所 .dialog-slot)
//   onExecute: 「実行」を押したときに呼ぶ関数
//   onBack:    「戻る」を押したときに呼ぶ関数
function openConfirmDialog(folder, anchor, onExecute, onBack) {
  dialogMessage.textContent = TEXTS.dialog.message.replace("{フォルダ}", folder);
  dialogOnExecute = onExecute;
  dialogOnBack = onBack;

  // 出す場所が画面の下にはみ出していたら、見えるところまで少しだけスクロールする
  anchor.scrollIntoView({ block: "nearest" });

  // フォルダボタンの下の空き場所に出す(メール・ルール・フォルダボタンを隠さない。SPEC.md 4章)
  const rect = anchor.getBoundingClientRect();
  dialogBox.style.top = rect.top + "px";
  dialogBox.style.left = rect.left + "px";
  dialogBox.style.width = rect.width + "px";
  dialogOverlay.style.display = "flex";
  dialogOpenedAt = performance.now();
  // どちらのボタンも選ばれた状態(フォーカス)にしない
  if (document.activeElement) document.activeElement.blur();
}

function closeConfirmDialog() {
  dialogOverlay.style.display = "none";
  dialogOnExecute = null;
  dialogOnBack = null;
}

// 開いてから DIALOG_LOCK_MS ミリ秒たっていなければ true(そのクリックは無視する)
// フォルダボタンを素早く2回押したとき、2回目が「実行」「戻る」の応答として記録されないように
function isDialogLocked() {
  return performance.now() - dialogOpenedAt < DIALOG_LOCK_MS;
}

dialogExecuteButton.addEventListener("click", () => {
  if (isDialogLocked()) return;
  const callback = dialogOnExecute;
  closeConfirmDialog();
  if (callback) callback();
});

dialogBackButton.addEventListener("click", () => {
  if (isDialogLocked()) return;
  const callback = dialogOnBack;
  closeConfirmDialog();
  if (callback) callback();
});

// 確認画面の外(暗い部分)をクリックしても、何もしない(閉じない)

// 確認画面が開いているあいだは、キーボード操作を受け付けない(Enter・Esc・Space・Tab など)
document.addEventListener("keydown", event => {
  if (dialogOverlay.style.display === "flex") {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);
