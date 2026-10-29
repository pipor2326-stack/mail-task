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

  // ひっかけと通常に分け、それぞれから「ちょうどの数」(四捨五入)をくじ引きで選ぶ
  const traps = order.filter(mail => mail.isTrap);
  const normals = order.filter(mail => !mail.isTrap);
  const trapCount = Math.round(traps.length * rate);
  const normalCount = Math.round(normals.length * rate);

  // shuffleArray は js/task.js にある(並べ替えた先頭から必要な数だけ取る=くじ引き)
  const chosen = shuffleArray(traps).slice(0, trapCount)
    .concat(shuffleArray(normals).slice(0, normalCount));

  return { ids: new Set(chosen.map(mail => mail.id)), trapCount: trapCount, normalCount: normalCount };
}

// 【開発者モード】本番セット A・B の低頻度の抽選数を点検し、問題があれば Console に黄色の注意を出す
//   - 「ひっかけの数 × LOW_RATE」「通常の数 × LOW_RATE」が整数にならない(四捨五入で割合がずれる)
//   - A と B で抽選される数が違う
function checkLowRateCounts() {
  const counts = {};
  ["A", "B"].forEach(set => {
    const trapTotal = EMAILS[set].filter(mail => mail.isTrap).length;
    const normalTotal = EMAILS[set].length - trapTotal;
    const trapExact = trapTotal * LOW_RATE;
    const normalExact = normalTotal * LOW_RATE;

    // 小数の計算の誤差(0.30000000000000004 など)を無視するため、ごく小さい差は整数とみなす
    const isInteger = value => Math.abs(value - Math.round(value)) < 1e-9;
    if (!isInteger(trapExact)) {
      console.warn(`セット${set}:ひっかけ${trapTotal}通 × ${LOW_RATE} = ${trapExact} が整数になりません(四捨五入で ${Math.round(trapExact)} 通を抽選します)`);
    }
    if (!isInteger(normalExact)) {
      console.warn(`セット${set}:通常${normalTotal}通 × ${LOW_RATE} = ${normalExact} が整数になりません(四捨五入で ${Math.round(normalExact)} 通を抽選します)`);
    }
    counts[set] = { trap: Math.round(trapExact), normal: Math.round(normalExact) };
  });

  if (counts.A.trap !== counts.B.trap || counts.A.normal !== counts.B.normal) {
    console.warn(`低頻度で抽選される数が A と B で違います:A はひっかけ${counts.A.trap}・通常${counts.A.normal}、B はひっかけ${counts.B.trap}・通常${counts.B.normal}`);
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

// 確認画面を開く
//   folder:    選んだフォルダ名
//   anchor:    確認画面を重ねる場所(フォルダボタンの並び)
//   onExecute: 「実行」を押したときに呼ぶ関数
//   onBack:    「戻る」を押したときに呼ぶ関数
function openConfirmDialog(folder, anchor, onExecute, onBack) {
  dialogMessage.textContent = TEXTS.dialog.message.replace("{フォルダ}", folder);
  dialogOnExecute = onExecute;
  dialogOnBack = onBack;

  // フォルダボタンの真上に重ねて出す(メールとルールを隠さないように。SPEC.md 4章)
  const rect = anchor.getBoundingClientRect();
  dialogBox.style.top = rect.top + "px";
  dialogBox.style.left = rect.left + "px";
  dialogBox.style.width = rect.width + "px";
  dialogOverlay.style.display = "flex";
  // どちらのボタンも選ばれた状態(フォーカス)にしない
  if (document.activeElement) document.activeElement.blur();
}

function closeConfirmDialog() {
  dialogOverlay.style.display = "none";
  dialogOnExecute = null;
  dialogOnBack = null;
}

dialogExecuteButton.addEventListener("click", () => {
  const callback = dialogOnExecute;
  closeConfirmDialog();
  if (callback) callback();
});

dialogBackButton.addEventListener("click", () => {
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
